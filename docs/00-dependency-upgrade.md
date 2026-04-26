# 00. 依存関係アップグレード計画

## 目的

新機能（自動収集・自動ラベリング・マルチアセット対応）の実装に先立ち、
ベースとなる依存関係を最新の安定版に揃え、長期メンテナンス性を確保する。

## 主要方針

- **Next.js を最新（16.2 / 2026-03）に更新**し、React 19.2 / React Compiler / Turbopack デフォルト構成へ移行
- **mysql2 を削除**（実コードで未使用、型インポートの誤検出のみ）
- **MongoDB を撤去**し PostgreSQL に統一（[06-database-consolidation.md](./06-database-consolidation.md) を参照）
- **SQLite (Prisma) も Postgres に統合**（メタデータも Postgres）

## 現状バージョン

| パッケージ | 現在 | 目標 | 備考 |
|-----------|------|------|------|
| next | 14.2.5 | **16.2（最新）** | **最優先**。Turbopack デフォルト、React Compiler 安定、ルーティング刷新 |
| react | 18.x | 19.2 | Next.js 16 同梱の最新版 |
| react-dom | 18.x | 19.2 | Next.js 16 と同時 |
| @types/react | 18.x | 19.x | React 19 と同時 |
| @types/react-dom | 18.x | 19.x | React 19 と同時 |
| typescript | 5.x | 5.7+ | 最新の安定版 |
| eslint-config-next | 14.2.5 | 16.x | Next と揃える |
| @prisma/client | 5.17.0 | 6.x | Prisma 6（Postgres 移行と同時） |
| prisma | 5.17.0 | 6.x | 同上 |
| @mui/material | 5.16.7 | 6.x | 慎重にメジャーアップ |
| @emotion/react | 11.13.0 | 11.x 最新 | MUI と整合 |
| @emotion/styled | 11.13.0 | 11.x 最新 | 同上 |
| lightweight-charts | 4.1.7 | 5.x | v5 で API 変更あり |
| axios | 1.3.1 | 1.x 最新 | パッチ |
| storybook | 8.2.9 | 8.x 最新 | 慎重にメジャー判断 |
| eslint | 8.x | 9.x | フラットコンフィグ移行 |
| tailwindcss | 3.4.1 | 4.x | v4 で大幅変更（要検討） |

※ 最新版はアップグレード作業時に `npm outdated` で正確な値を取得して反映。

## 削除対象パッケージ

| パッケージ | 削除理由 |
|-----------|---------|
| **mysql2** | 実コード未使用（route.ts の型インポートが誤検出されているのみ） |
| **mongodb** | Postgres へ統合のため不要（[06](./06-database-consolidation.md)） |
| **sqlite / sqlite3** | Postgres 統合のため不要 |
| **lighthouse** | 用途不明・ランタイム依存。要削除 |
| **webpack-cli** | Next.js が内部で webpack を抱えるため不要 |

## 追加予定パッケージ

| パッケージ | 用途 |
|-----------|------|
| **pg** | PostgreSQL クライアント（Prisma 経由なら不要、直接利用なら追加） |
| **yahoo-finance2** | データ自動収集（[02](./02-data-collection.md)） |

## アップグレード方針（段階的）

リスク軽減のため **5 フェーズ** に分けて実施。各フェーズ後に `dev` 起動・主要画面動作確認・型チェック・ビルドを通す。

### Phase A: クリーンアップ（最初に実施・低リスク）

不要パッケージの削除と誤インポートの修正。

```bash
npm uninstall mysql2 lighthouse webpack-cli
```

- `src/app/api/candles/labeling/route.ts` の `mysql2` からの型インポートを修正
  （`import { Next } from "node_modules/mysql2/typings/..."` を削除）

### Phase B: パッチ / マイナー追従（低リスク）

```bash
npx npm-check-updates -u --target minor
npm install
npm run lint && npm run build
```

対象：TypeScript、Prisma 5.x 系最新、@emotion/*、axios、@types/*、storybook 8.x 最新

### Phase C: Next.js 16 + React 19.2（**最優先メジャー**）

公式 codemod を活用して 14 → 15 → 16 を順に通す：

```bash
npx @next/codemod@canary upgrade latest
npm install
```

#### 主な対応事項
- `headers()` / `cookies()` / `params` / `searchParams` の **非同期化**（Next.js 15 で導入、16 で必須）
- **Turbopack がデフォルト** になる（`next dev` / `next build` 共に）。既存の webpack カスタム設定があれば Turbopack 設定へ移行
- **React Compiler** の有効化を検討（手動 `useMemo` / `useCallback` の削減）
- React 19.2 の型変更（`ReactNode` から子要素の型推論など）
- ルーティング・ナビゲーション API の刷新に追従
- `eslint-config-next` も同時に 16.x へ
- 主要画面（`/chart`）で全機能の手動動作確認

#### 注意
- Storybook 8.x が Next.js 16 と Turbopack 構成に追従しているか要確認。未対応なら Storybook も同時に最新化
- 一気に飛ばさず、まず 15 系で動作確認 → 16 系へ進める二段階方式が安全

### Phase D: DB 統合（Postgres へ移行）

詳細は [06-database-consolidation.md](./06-database-consolidation.md) を参照。

1. `docker-compose.yml` に Postgres サービスを追加
2. `prisma/schema.prisma` の provider を `postgresql` に変更
3. MongoDB 利用箇所を Prisma 経由の Postgres アクセスへ書き換え
4. データ移行スクリプト実行
5. MongoDB / SQLite 関連ファイル・依存削除
6. `prisma`, `@prisma/client` を 6.x へ

### Phase E: 残りのメジャーアップ（並走可）

#### E-1: MUI 6

- `sx` プロップ多用箇所の影響を確認
- 影響大の場合は見送り判断

#### E-2: Lightweight Charts 5

- ラベリング UI 中核のため単独 PR で慎重に検証

#### E-3: ESLint 9 (flat config)

- `.eslintrc.json` → `eslint.config.js` への移行

#### E-4: Tailwind 4（任意）

- v4 の構成変更を許容できるタイミングで実施

## 実施チェックリスト

各 Phase で実行：

- [ ] `npm outdated` で差分確認
- [ ] `npm install` 後 lockfile を確認
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run dev` で `/chart` ページの主要操作（ラベリング、ブックマーク、ファイル作成）を手動確認
- [ ] Storybook 起動確認
- [ ] Prisma マイグレーション動作確認（`npx prisma migrate status`）

## 後戻り対応

- 各 Phase は独立した PR / ブランチで実施
- 不具合検出時は `git revert` で速やかに戻す
- lockfile（`package-lock.json`）を必ずコミット

## 完了条件

- Phase A〜D 完了後、新機能（02 / 03 / 04 / 05）の本格実装に入る
- Phase E は新機能と並走、影響範囲の小さいものから順次

## 実装メモ

（実装後に追記）
