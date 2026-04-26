# 02. データ自動収集仕様

## 目的

FX および日本株の OHLCV データを外部 API から自動取得し、**PostgreSQL の `Candle` テーブル**に保存する。

> DB 構成は [06-database-consolidation.md](./06-database-consolidation.md) を参照。
> Postgres 統合完了後にこの仕様の実装を開始する。

## データソース

### 一次採用：Yahoo Finance

- **理由**: API キー不要、FX・日本株・米国株を統一 API で取得可能、無料
- **クライアント**: `yahoo-finance2`（Node.js 用ライブラリ）
- **シンボル形式**:
  - FX: `USDJPY=X`, `EURUSD=X`, `GBPJPY=X`
  - 日本株: `7203.T`（トヨタ）, `6758.T`（ソニー）, `9984.T`（ソフトバンク）

### 補助：J-Quants API（将来検討）

- 日本株データの精度向上が必要になった場合に追加
- 無料登録制、東証公式データ

## 対象銘柄（初期）

### FX（メジャーペア）

| シンボル | 通貨ペア |
|---------|---------|
| USDJPY=X | 米ドル / 円 |
| EURUSD=X | ユーロ / 米ドル |
| GBPJPY=X | ポンド / 円 |
| EURJPY=X | ユーロ / 円 |
| GBPUSD=X | ポンド / 米ドル |

### 日本株（主要銘柄）

| シンボル | 銘柄 |
|---------|------|
| 7203.T | トヨタ自動車 |
| 6758.T | ソニーグループ |
| 9984.T | ソフトバンクグループ |
| 8306.T | 三菱UFJフィナンシャル・グループ |
| 9432.T | 日本電信電話 |
| 6861.T | キーエンス |
| 6098.T | リクルートホールディングス |

※ シードデータで投入し、UI から追加可能にする。

## 時間足

| 資産タイプ | 取得対象時間足 |
|-----------|---------------|
| FX | 5m / 1h / 4h |
| 株 | 1d（日足）+ 1h |

※ 株の 5 分足は Yahoo Finance での履歴取得期間が短い（直近 60 日程度）ため、
日足を主軸とする。

## API 設計

### `POST /api/data/fetch`

外部 API からデータを取得して Postgres の `Candle` テーブルへ upsert。

**Request**

```json
{
  "symbol": "7203.T",
  "assetType": "STOCK",
  "interval": "1d",
  "from": "2023-01-01",
  "to": "2024-12-31"
}
```

**Response**

```json
{
  "inserted": 251,
  "skipped": 0,
  "symbol": "7203.T",
  "interval": "1d"
}
```

### `POST /api/data/fetch/batch`

複数銘柄・複数時間足を一括取得（マスタテーブルから対象取得）。

**Request**

```json
{
  "assetType": "FX",  // 省略時は全件
  "from": "2024-01-01"
}
```

### `GET /api/data/status`

最終取得時刻・件数を確認。

## Postgres テーブル設計

`Candle` テーブル（詳細は [06](./06-database-consolidation.md#新スキーマprisma--postgres) 参照）：

| カラム | 型 | 備考 |
|--------|-----|------|
| id | BigInt | PK |
| chartMasterId | Int | `ChartMaster.id` への FK |
| interval | String | "5m" / "1h" / "4h" / "1d" |
| time | BigInt | Unix timestamp (秒) |
| open / high / low / close | Float | OHLC |
| volume | Float | 出来高 |
| label | Int | デフォルト 0 |
| source | String | "yahoo" 等 |
| fetchedAt | DateTime | 取得時刻 |

**ユニーク制約**: `(chartMasterId, interval, time)`
**インデックス**: 同上で時系列クエリを高速化

## 重複・冪等性

- 同一 `(chartMasterId, interval, time)` は `prisma.candle.upsert()` で更新
- 大量取得時は `createMany({ skipDuplicates: true })` でバッチ INSERT
- 既存データを上書きしない設定もオプションで提供

## エラーハンドリング

- API レート制限：指数バックオフでリトライ（最大 3 回）
- 一部銘柄失敗時は他銘柄の処理を継続し、結果に `errors[]` を含める
- 取得 0 件は warning ログ

## スケジュール実行

初期は手動 / 管理画面からの手動トリガで運用。
将来的には以下を検討：

- Vercel Cron / GitHub Actions による日次自動実行
- 平日 16:00 JST（東証クローズ後）に日本株、毎時 FX

## 実装メモ

### 実装記録（完了）

#### パッケージ
- `yahoo-finance2` ^3.14.0 を追加

#### ユーティリティ
- `src/utils/yahooFinance.ts`：
  - `new YahooFinance()` インスタンスで `chart()` API 呼び出し
  - `interval=4h` は Yahoo が直接非対応のため、1h を取得して 4 本ずつ集約
  - `null` を含むバーは除外
- `src/utils/dataIngestion.ts`：
  - `ingestSymbol(symbol, interval, from, to)` で取得 → `prisma.candle.upsert` で保存
  - `(chartMasterId, interval, time)` ユニーク制約で冪等
  - 戻り値：`{ inserted, updated, total }`

#### API エンドポイント

| ルート | 用途 |
|------|------|
| `POST /api/data/fetch` | 単一シンボル + interval を取得・保存 |
| `POST /api/data/fetch/batch` | 全マスタ（or `assetType` フィルタ）を一括取得 |
| `GET /api/data/status` | シンボル × interval ごとの件数・最終時刻 |
| `GET /api/masters` | ChartMaster 一覧（`assetType` フィルタ可） |

`/api/data/fetch/batch` のデフォルト interval：
- FX: `["1h", "4h"]`
- STOCK: `["1d", "1h"]`

#### 検証結果
- `npm run build`：`✓ Compiled successfully in 3.2s`、新ルート 4 本含めて Static 11/11 + Dynamic 9 ルート
- `npm run lint`：エラー 0、警告 19（既存）

#### 既知の制約・残件
- Yahoo の 5m / 15m は履歴期間が短い（直近 60 日程度）。長期履歴が必要な場合は 1d 中心に運用
- 大量銘柄の batch 取得時はレート制限の対策（指数バックオフ）を後追いで実装
- スケジュール実行（Vercel Cron 等）は別タスク
- UI からの取得トリガ・進捗表示は別タスク
