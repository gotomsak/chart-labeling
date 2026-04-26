# 05. スキーマ拡張計画

## 目的

FX 専用の現スキーマを、FX + 株（および将来の他アセット）に対応させる。
既存データは `assetType=FX` として保持し、後方互換を維持する。

## 現状スキーマ（参考）

```prisma
model ChartMaster {
  id            Int             @id @default(autoincrement())
  pair          String          @unique
  chartLabeling ChartLabeling[]
}

model ChartLabeling {
  id            Int         @id @default(autoincrement())
  fileName      String      @unique
  name          String
  chartMasterId Int
  chartMaster   ChartMaster @relation(fields: [chartMasterId], references: [id])
  bookmark      Bookmark[]
  created_at    DateTime    @default(now())
  updated_at    DateTime    @updatedAt
  deleted_at    DateTime?
}

model Bookmark {
  id              Int           @id @default(autoincrement())
  time            String
  date            DateTime      @default(now())
  chartLabelingId Int
  chartLabeling   ChartLabeling @relation(fields: [chartLabelingId], references: [id])
}
```

## 変更後スキーマ

```prisma
model ChartMaster {
  id            Int             @id @default(autoincrement())
  symbol        String          @unique          // 例: "USDJPY=X", "7203.T"
  displayName   String                            // UI 表示名
  assetType     String                            // "FX" | "STOCK"
  market        String                            // "FX" | "TSE" など
  enabled       Boolean         @default(true)    // 取得対象フラグ
  pair          String?         @unique           // 旧フィールド（後方互換、deprecated）
  chartLabeling ChartLabeling[]
  created_at    DateTime        @default(now())
  updated_at    DateTime        @updatedAt
}

model ChartLabeling {
  id              Int         @id @default(autoincrement())
  fileName        String      @unique
  name            String
  interval        String                              // "5m" | "1h" | "4h" | "1d"
  source          String      @default("manual")     // "manual" | "yahoo" | "auto-rule"
  chartMasterId   Int
  chartMaster     ChartMaster @relation(fields: [chartMasterId], references: [id])
  bookmark        Bookmark[]
  autoLabelRuns   AutoLabelRun[]
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt
  deleted_at      DateTime?
}

model Bookmark {
  id              Int           @id @default(autoincrement())
  time            String
  note            String?
  date            DateTime      @default(now())
  chartLabelingId Int
  chartLabeling   ChartLabeling @relation(fields: [chartLabelingId], references: [id])
}

model AutoLabelRun {
  id              Int           @id @default(autoincrement())
  chartLabelingId Int
  chartLabeling   ChartLabeling @relation(fields: [chartLabelingId], references: [id])
  strategy        String                              // "rule-based" | "llm-assisted" | "ml-model"
  config          String                              // JSON 文字列
  buyCount        Int
  sellCount       Int
  takeProfitCount Int
  noneCount       Int
  executedAt      DateTime      @default(now())
}
```

## 主な追加項目

### `ChartMaster`
- `symbol`: 統一シンボル（旧 `pair` を置換）
- `displayName`: UI 表示名
- `assetType`: 資産種別
- `market`: 市場区分
- `enabled`: 自動収集の対象フラグ
- `pair`: 旧フィールドを残し後方互換（deprecated、最終的に削除予定）

### `ChartLabeling`
- `interval`: 時間足
- `source`: データソース（手動 / 自動）

### `Bookmark`
- `note`: 任意メモ

### `AutoLabelRun`（新規）
- 自動ラベリングの実行履歴。再実行 / 比較に使う

## マイグレーション戦略

### Step 1: フィールド追加（NOT NULL 回避のため nullable）

```bash
npx prisma migrate dev --name add_asset_fields_nullable
```

### Step 2: 既存データのバックフィル

```ts
// prisma/migrations/scripts/backfill_asset_type.ts
await prisma.chartMaster.updateMany({
  data: { assetType: "FX", market: "FX" }
});
// pair から symbol へコピー
```

### Step 3: NOT NULL 化

```bash
npx prisma migrate dev --name require_asset_fields
```

### Step 4: 旧フィールドの段階的削除（数リリース後）

`pair` を削除。

## シードデータ

`prisma/seed.ts`:

```ts
const FX_PAIRS = [
  { symbol: "USDJPY=X", displayName: "USD/JPY", assetType: "FX", market: "FX" },
  { symbol: "EURUSD=X", displayName: "EUR/USD", assetType: "FX", market: "FX" },
  { symbol: "GBPJPY=X", displayName: "GBP/JPY", assetType: "FX", market: "FX" },
  { symbol: "EURJPY=X", displayName: "EUR/JPY", assetType: "FX", market: "FX" },
  { symbol: "GBPUSD=X", displayName: "GBP/USD", assetType: "FX", market: "FX" },
];

const JP_STOCKS = [
  { symbol: "7203.T", displayName: "トヨタ自動車",   assetType: "STOCK", market: "TSE" },
  { symbol: "6758.T", displayName: "ソニーグループ", assetType: "STOCK", market: "TSE" },
  { symbol: "9984.T", displayName: "ソフトバンクG",  assetType: "STOCK", market: "TSE" },
  { symbol: "8306.T", displayName: "三菱UFJ FG",      assetType: "STOCK", market: "TSE" },
  { symbol: "9432.T", displayName: "NTT",             assetType: "STOCK", market: "TSE" },
  { symbol: "6861.T", displayName: "キーエンス",     assetType: "STOCK", market: "TSE" },
  { symbol: "6098.T", displayName: "リクルートHD",   assetType: "STOCK", market: "TSE" },
];
```

## MongoDB（candles コレクション）

詳細は [02-data-collection.md](./02-data-collection.md#mongodb-コレクション設計) を参照。
スキーマレスだが、SQLite 側 `ChartMaster.symbol` と `MongoDB.candles.symbol` を一致させる。

## ロールバック

各 Prisma マイグレーションは `prisma migrate resolve` で取り消し可能。
バックフィルスクリプトは冪等に設計し、複数回実行しても問題ないこと。

## 実装メモ

（実装後に追記）
