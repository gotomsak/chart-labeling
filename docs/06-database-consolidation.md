# 06. データベース統合計画（PostgreSQL 一元化）

## 目的

現状の **SQLite（メタデータ）+ MongoDB（チャート/ラベル）+ mysql2（未使用）** の混在構成を解消し、**PostgreSQL に一元化**する。

## 統合の根拠

- mysql2 は実コード未使用（型インポートの誤検出のみ）→ 削除
- MongoDB はチャートデータ用途で使われているが、リレーショナルな整合性を取りたい（ChartMaster ↔ Candle ↔ Labeling）
- SQLite は本番運用に向かない（同時書き込み制限、ホスティング制約）
- Postgres は OLTP・時系列・JSONB を全て満たし、Prisma で完全サポート
- 必要に応じて TimescaleDB 拡張で時系列最適化も可能

## 移行範囲

| 種別 | 移行前 | 移行後 |
|------|--------|--------|
| メタデータ（ChartMaster, ChartLabeling, Bookmark） | SQLite | **Postgres** |
| チャートデータ（OHLCV） | MongoDB | **Postgres**（candles テーブル） |
| ラベリングデータ | MongoDB | **Postgres**（candles テーブルの label カラム） |
| ブックマーク（Mongo 側のもの） | MongoDB | **Postgres** |
| ファイル管理 | MongoDB | **Postgres**（labelings テーブル + 物理ファイル） |

## 新スキーマ（Prisma + Postgres）

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model ChartMaster {
  id          Int      @id @default(autoincrement())
  symbol      String   @unique           // "USDJPY=X", "7203.T"
  displayName String
  assetType   String                      // "FX" | "STOCK"
  market      String                      // "FX" | "TSE" など
  enabled     Boolean  @default(true)
  candles     Candle[]
  labelings   Labeling[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Candle {
  id            BigInt      @id @default(autoincrement())
  chartMasterId Int
  chartMaster   ChartMaster @relation(fields: [chartMasterId], references: [id])
  interval      String                    // "5m" | "1h" | "4h" | "1d"
  time          BigInt                    // Unix timestamp (秒)
  open          Float
  high          Float
  low           Float
  close         Float
  volume        Float
  label         Int         @default(0)   // 0:未分類 1:買い 2:売り 3:利確
  source        String      @default("yahoo")
  fetchedAt     DateTime    @default(now())

  @@unique([chartMasterId, interval, time])
  @@index([chartMasterId, interval, time])
}

model Labeling {
  id            Int         @id @default(autoincrement())
  chartMasterId Int
  chartMaster   ChartMaster @relation(fields: [chartMasterId], references: [id])
  fileName      String      @unique
  name          String
  interval      String
  source        String      @default("manual")    // "manual" | "auto-rule" | "auto-llm"
  bookmarks     Bookmark[]
  autoLabelRuns AutoLabelRun[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  deletedAt     DateTime?
}

model Bookmark {
  id         Int      @id @default(autoincrement())
  labelingId Int
  labeling   Labeling @relation(fields: [labelingId], references: [id])
  time       BigInt                       // Unix timestamp (秒)
  note       String?
  createdAt  DateTime @default(now())

  @@index([labelingId, time])
}

model AutoLabelRun {
  id              Int      @id @default(autoincrement())
  labelingId      Int
  labeling        Labeling @relation(fields: [labelingId], references: [id])
  strategy        String                   // "rule-based" | "llm-assisted" | "ml-model"
  config          Json
  buyCount        Int
  sellCount       Int
  takeProfitCount Int
  noneCount       Int
  executedAt      DateTime @default(now())
}
```

### Postgres 固有の活用

- `Json` 型（`AutoLabelRun.config`）でラベリング設定を構造化保存
- 部分インデックス・カバリングインデックスで時系列クエリを高速化
- 必要に応じて TimescaleDB の hypertable 化（`Candle` テーブル）

## docker-compose.yml の変更

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: chart-labeling-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-app}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-secret}
      POSTGRES_DB: ${POSTGRES_DB:-chart_labeling}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # MongoDB サービスは削除

volumes:
  postgres_data:
```

`.env`:

```
DATABASE_URL="postgresql://app:secret@localhost:5432/chart_labeling"
```

## 移行手順

### Step 1: Postgres 環境構築

- `docker-compose.yml` に Postgres サービス追加
- `prisma/schema.prisma` の provider を `postgresql` に変更
- 新スキーマで `npx prisma migrate dev --name init_postgres`

### Step 2: データ移行スクリプト

`scripts/migrate-to-postgres.ts` を作成：

1. SQLite から `ChartMaster`, `ChartLabeling`, `Bookmark` を読み込み Postgres に投入
2. MongoDB から各 collection を読み込み、Postgres の `Candle` / `Labeling` / `Bookmark` に投入
3. 件数検証（移行前後で一致確認）

```ts
// 概略
const oldMasters = await sqliteDb.all("SELECT * FROM ChartMaster");
for (const m of oldMasters) {
  await prisma.chartMaster.create({
    data: {
      symbol: m.pair,
      displayName: m.pair,
      assetType: "FX",
      market: "FX",
    },
  });
}

const candles = mongoDb.collection("candles").find({});
for await (const c of candles) {
  await prisma.candle.upsert({ ... });
}
```

### Step 3: API 書き換え

| ファイル | 変更内容 |
|---------|---------|
| `src/utils/mongo.ts` | 削除 |
| `src/global.d.ts` | MongoClient 型定義削除 |
| `src/app/api/candles/route.ts` | `prisma.candle.findMany()` ベースに書き換え |
| `src/app/api/candles/labeling/route.ts` | 同上 + `mysql2` 不要インポート削除 |
| `src/app/api/bookmark/route.ts` | `prisma.bookmark.*` に書き換え |
| `src/app/api/file/route.ts` | `prisma.labeling.*` に書き換え |

### Step 4: 依存削除

```bash
npm uninstall mongodb mysql2 sqlite sqlite3
```

### Step 5: 検証

- `/chart` ページで全機能を手動確認
- ラベル付与 → DB 反映確認
- ブックマーク追加 / 削除
- ファイル作成 / 取得
- Storybook 起動確認

### Step 6: クリーンアップ

- `docker-compose.yml` から MongoDB を削除
- 旧 SQLite ファイル（`prisma/dev.db` 等）削除
- 関連ドキュメント・README 更新

## ロールバック

- データ移行スクリプトは冪等に設計（`upsert` で複数回実行可能）
- 移行前の SQLite / Mongo データは別ディレクトリへバックアップ
- 問題発生時は前ブランチに `git revert`、Mongo / SQLite を復元

## 性能・運用上の注意

- `Candle` は数百万行〜になりうるため、`(chartMasterId, interval, time)` のユニークインデックス必須
- 大量 INSERT 時は `createMany` でバッチ化
- 必要に応じて TimescaleDB の hypertable 化を後追いで適用

## 完了条件

- MongoDB / SQLite / mysql2 への参照がコードベースから消える
- `npm run build` / `npm run lint` がパス
- `/chart` ページの主要機能が Postgres ベースで動作

## 実装メモ

（実装後に追記）
