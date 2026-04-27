# 03. AI 自動ラベリング仕様

## 目的

OHLCV データに対して「買い / 売り / 利確 / なし」のラベルを自動付与する。
手動ラベリングの初期値生成、もしくは大量データの一括ラベリング用途。

## ラベル定義（既存仕様準拠）

| 値 | ラベル |
|----|-------|
| 0 | 未分類（初期値） |
| 1 | 買い |
| 2 | 売り |
| 3 | 利確 |

## アプローチ

3 段階で段階的に実装する。

### Phase 1: ルールベース（最初に実装）

テクニカル指標を組み合わせたシグナル判定。
高速・無料・決定的、再現性あり。

#### デフォルトルール

| シグナル | 条件 |
|---------|------|
| 買い (1) | SMA(5) が SMA(20) を上抜け **かつ** RSI(14) < 70 |
| 売り (2) | SMA(5) が SMA(20) を下抜け **かつ** RSI(14) > 30 |
| 利確 (3) | 直近の買い/売りエントリから ±N% 到達、もしくは反対シグナル発生 |

- 利確の閾値 N: FX = 0.5%、株 = 2.0%（デフォルト、変更可能）
- 反対シグナルが先に出た場合は反対サイドの「売り/買い」をラベル化

#### 設定パラメータ

```ts
interface RuleBasedConfig {
  shortPeriod: number;       // 短期 SMA、デフォルト 5
  longPeriod: number;        // 長期 SMA、デフォルト 20
  rsiPeriod: number;         // RSI 期間、デフォルト 14
  rsiUpperBound: number;     // 買い抑制閾値、デフォルト 70
  rsiLowerBound: number;     // 売り抑制閾値、デフォルト 30
  takeProfitPct: number;     // 利確 % 、FX/株で別値
}
```

### Phase 2: LLM 補助（オプション、後回し）

Claude API を用いて、ルールベースで抽出した候補シグナルを検証 / 棄却。

- 入力：直近 N 本のローソク足、テクニカル指標、ルールベースの提案ラベル
- 出力：ラベル承認 / 却下、信頼度スコア
- モデル：`claude-haiku-4-5-20251001`（コスト最適化）
- プロンプトキャッシュを利用してコスト削減

### Phase 3: ML モデル（将来）

手動ラベリングデータが十分蓄積されたら、教師あり学習でモデル構築。
LightGBM / XGBoost あたりの軽量モデルから検証。

## API 設計

### `POST /api/labeling/auto`

単一チャート（symbol + interval）に対してラベリング実行。

**Request**

```json
{
  "symbol": "7203.T",
  "interval": "1d",
  "from": "2024-01-01",
  "to": "2024-12-31",
  "strategy": "rule-based",
  "config": {
    "shortPeriod": 5,
    "longPeriod": 20,
    "takeProfitPct": 2.0
  },
  "overwrite": false
}
```

**Response**

```json
{
  "symbol": "7203.T",
  "interval": "1d",
  "totalCandles": 251,
  "labeled": {
    "buy": 12,
    "sell": 11,
    "takeProfit": 20,
    "none": 208
  }
}
```

### `POST /api/labeling/auto/batch`

複数銘柄を一括ラベリング。

### `POST /api/labeling/auto/preview`

DB に保存せず結果のみ返す（UI でのプレビュー用）。

## UI 統合

ラベリングページに「自動ラベリング」ボタンを追加：

- ストラテジー選択（ドロップダウン）
- パラメータ調整（折りたたみパネル）
- プレビュー → 結果確認 → 確定保存
- 既存ラベルの上書き有無を選択

## モジュール構成

```
src/lib/labeling/
├── index.ts                  # エントリポイント
├── types.ts                  # 共通型
├── strategies/
│   ├── ruleBased.ts          # Phase 1
│   ├── llmAssisted.ts        # Phase 2
│   └── mlModel.ts            # Phase 3
└── indicators/
    ├── sma.ts
    ├── ema.ts
    └── rsi.ts
```

## テスト方針

- 各テクニカル指標の単体テスト（既知の入出力で検証）
- ルールベースストラテジーのスナップショットテスト
- 既存の手動ラベリングデータがある場合は一致率を計測

## 実装メモ

### Phase 1（ルールベース）実装記録（完了）

#### モジュール構成
```
src/lib/labeling/
├── index.ts                    # 公開エントリ
├── types.ts                    # 型 + デフォルト config
├── runner.ts                   # Prisma → ルール実行 → 結果
├── strategies/
│   └── ruleBased.ts            # SMA × RSI + 利確
└── indicators/
    ├── sma.ts
    └── rsi.ts
```

#### インジケータ
- `sma(values, period)`：シンプル移動平均、期間未満は `null`
- `rsi(values, period)`：Wilder smoothing 版、期間+1 未満は `null`

#### ルール（`labelByRules`）
- SMA(short) が SMA(long) を上抜け **かつ** RSI < `rsiUpperBound` → **買い**
- SMA(short) が SMA(long) を下抜け **かつ** RSI > `rsiLowerBound` → **売り**
- ポジション保有中に `takeProfitPct` 到達 → **利確**
- 反対シグナル発生時、保有ポジを **利確** で閉じてから新シグナルを置く
- デフォルト：FX `0.5%`、株 `2.0%`

#### API エンドポイント

| ルート | 用途 |
|------|------|
| `POST /api/labeling/auto/preview` | DB 保存せず結果のみ返却（UI プレビュー） |
| `POST /api/labeling/auto` | 結果を `Labeling.markers` に反映、`AutoLabelRun` を記録 |

`auto` の `overwrite=false`（デフォルト）時は既存マーカーとマージし、同一時刻は後勝ちで上書き。

#### UI 統合
- `src/components/AutoLabelingPanel.tsx`（MUI）：
  - 時間足セレクタ（asset type に応じた候補）
  - 短期/長期 SMA、RSI 期間、利確 % のテキスト入力
  - 上書きチェックボックス
  - **プレビュー** ボタン → 件数を Alert 表示
  - **ラベルに反映** ボタン → 適用後ページリロード
- `/chart` の右カラム「登録」ボタン直下に組み込み

#### 検証結果
- `npm run build`：`✓ Compiled successfully`、Static **18/18**
- `npm run lint`：エラー 0、警告 19（既存）

#### 既知の制約・残件
- Phase 2（LLM 補助）と Phase 3（ML モデル）は別タスクで段階的に実装
- 自動ラベリングのバックテスト指標（勝率・PF）算出 UI は未実装
- 大量データへの最適化（`createMany` での bulk insert / Prisma raw query）は必要に応じて追加
