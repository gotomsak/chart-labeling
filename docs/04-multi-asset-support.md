# 04. マルチアセット対応仕様（FX + 日本株）

## 目的

既存の FX 専用設計から、FX と株式を同一基盤で扱える構成に拡張する。
将来は米国株や暗号資産も追加できる汎用設計とする。

## アセット種別

```ts
type AssetType = "FX" | "STOCK";   // 将来 "CRYPTO" 等を追加
type Market = "FX" | "TSE" | "NYSE" | "NASDAQ";
```

## 既存と新規の差分

| 項目 | FX（既存） | 株（新規） |
|------|-----------|-----------|
| シンボル形式 | 通貨ペア（GBPJPY） | ティッカー + 市場（7203.T） |
| 取引時間 | 24 時間 | 9:00-11:30 / 12:30-15:00 JST |
| 主要時間足 | 5m / 1h / 4h | 1d / 1h |
| ギャップ | ほぼなし | 寄付き / 翌営業日でギャップあり |
| 出来高の扱い | 参考程度 | 重要（流動性指標） |
| 利確閾値の目安 | 0.5% | 2.0% |

## UI への影響

### 銘柄選択 UI

トップページもしくはチャートページのヘッダに以下を追加：

- アセットタイプタブ（FX / 株）
- 銘柄ドロップダウン（アセットタイプでフィルタ）
- 時間足セレクタ（アセットタイプに応じて選択肢が変動）

### チャートページの調整

- 株モード時：日足 + 1 時間足の 2 ペイン構成（5m は廃止 or オプション）
- FX モード時：従来通り 5m / 1h / 4h の 3 ペイン構成
- レイアウトを `assetType` で動的に切り替える

### 銘柄検索

入力に応じてサジェスト（マスタテーブル前方一致）。

## 取引時間とローソク足の扱い

- 株は非取引時間にローソクが存在しないことを前提に、X 軸を「ビジネス時刻」で連結
- Lightweight Charts の `timeScale` で `secondsVisible: false`、`tickMarkFormatter` を市場別にカスタマイズ
- 翌日寄付きとのギャップは視覚的に表現するが、データ上の補間はしない

## エクスポート形式

学習用データセット出力時、シンボルとアセットタイプをファイル名 / メタデータに含める：

```
labelData_7203.T_1d_2024.json
labelData_USDJPY_1h_2024.json
```

## マスタデータ初期投入（シード）

`prisma/seed.ts` に以下のシード処理を追加：

- 主要 FX ペア 5 種
- 主要日本株 7 銘柄

詳細は [02-data-collection.md](./02-data-collection.md) を参照。

## 段階的移行

1. スキーマ拡張（[05](./05-schema-changes.md)）と既存データのマイグレーション
2. シードで FX ペアを `assetType=FX` で再登録
3. 株銘柄を追加投入
4. UI を分岐対応
5. 自動収集 / 自動ラベリングを各アセットで実行

## 後方互換

- 既存のラベリングデータは `assetType=FX` 固定でマイグレーション
- 旧 API（`/api/candles/*`）はそのまま残し、新 API（`/api/data/*`）と並行運用
- 将来的に旧 API を deprecation ステータスへ

## 実装メモ

### 実装記録（完了）

#### 新規 Hook
- `src/hooks/useMasters.ts`：
  - `/api/masters` をクライアントから取得して `Master[]` を返却
  - `INTERVALS_BY_ASSET` 定数（FX: `5m/1h/4h`、STOCK: `1h/1d`）

#### 新規コンポーネント
- `src/components/SymbolSelector.tsx`（MUI）：
  - アセットタイプタブ（FX / 株）
  - タブ切替時に同タイプの先頭銘柄に自動切替
  - 銘柄ドロップダウン

#### `/chart` ページ刷新
- ハードコードの `selectPair = "GBPJPY"` を撤廃し、`SymbolSelector` で動的に切替
- `assetType` / `symbol` を localStorage に永続化
- チャート pane を **`intervals` 配列で動的に描画**
  - FX 選択時: 3 pane（5m / 1h / 4h）
  - 株選択時: 2 pane（1h / 1d）
- データ未投入時は「データがありません（自動取得を実行してください）」を表示

#### `CreateLabeling` 改修
- 内部の通貨ペアセレクタを撤去し、親から渡された `symbol` を使用
- ID 取得失敗時の警告メッセージを追加

#### `/admin/data` 管理画面（新規）
- 単一銘柄取得フォーム（symbol / interval / from / to）
- 一括取得ボタン（FX / 株 / 全件）
- 取得状況テーブル（symbol × interval ごとの件数 + 最終時刻）

#### Navigation
- 「Data」リンクを追加して `/admin/data` へ遷移可能に

#### API 追補
- `GET /api/candles/labels`：`symbol` クエリで `chartMasterId` 単位にフィルタ可能

#### 検証結果
- `npm run build`：`✓ Compiled successfully`、Static **16/16**（`/admin/data` 含む）
- `npm run lint`：エラー 0、警告 19（既存品質）

#### 既知の制約・残件
- 株の 5m / 4h は Yahoo の履歴制約で実装に含めず（仕様通り）
- 取引時間外のローソク連続性（市場ギャップ）の Lightweight Charts 側カスタマイズは別タスク
- バルクラベリング・進捗表示・取得失敗の銘柄リスト表示は最小実装（必要に応じて拡張）
