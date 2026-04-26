# 00. 依存関係アップグレード計画

## 目的

新機能（自動収集・自動ラベリング・マルチアセット対応）の実装に先立ち、
ベースとなる依存関係を最新の安定版に揃え、長期メンテナンス性を確保する。

## 現状バージョン

| パッケージ | 現在 | 最新（2026-04 時点想定） | 備考 |
|-----------|------|-------------------------|------|
| next | 14.2.5 | 15.x | App Router の安定化、Turbopack 改善 |
| react | 18.x | 19.x | use API、Actions、改善された Suspense |
| react-dom | 18.x | 19.x | React 19 同時アップグレード必須 |
| @types/react | 18.x | 19.x | React 19 と同時 |
| @types/react-dom | 18.x | 19.x | React 19 と同時 |
| typescript | 5.x | 5.7+ | 最新の安定版 |
| @prisma/client | 5.17.0 | 6.x | Prisma 6 へメジャーアップ |
| prisma | 5.17.0 | 6.x | Prisma 6 へメジャーアップ |
| @mui/material | 5.16.7 | 6.x or 7.x | MUI 6/7 でブレイキング変更あり |
| @emotion/react | 11.13.0 | 11.x 最新 | MUI と整合性確保 |
| @emotion/styled | 11.13.0 | 11.x 最新 | 同上 |
| mongodb | 6.8.0 | 6.x 最新 | パッチアップデート |
| lightweight-charts | 4.1.7 | 5.x | v5 で API 変更あり |
| axios | 1.3.1 | 1.x 最新 | パッチ |
| storybook | 8.2.9 | 8.x 最新 or 9.x | 慎重にメジャー判断 |
| eslint | 8.x | 9.x | フラットコンフィグ移行が必要 |
| eslint-config-next | 14.2.5 | next と揃える |  |
| tailwindcss | 3.4.1 | 4.x | v4 で大幅な構成変更（要検討） |

※ 最新版はアップグレード作業時に `npm outdated` で正確な値を取得して反映する。

## 不要・要見直しパッケージ

- **lighthouse**: ランタイム依存に入っているが用途不明。devDependencies へ移動 or 削除を検討
- **mysql2**: MongoDB / SQLite 構成のため未使用の可能性。削除候補
- **webpack-cli**: Next.js が内部で webpack を抱えるため不要の可能性。削除候補

## アップグレード方針（段階的）

リスク軽減のため **3 フェーズ** に分けて実施。各フェーズ後に `dev` 起動・主要画面動作確認・型チェック・ビルドを通す。

### Phase A: 低リスクの追従（パッチ / マイナー）

対象：以下のパッチ・マイナーアップ
- TypeScript 最新
- @prisma/* マイナー / パッチ
- mongodb パッチ
- axios パッチ
- @emotion/* パッチ
- storybook 8.x 系の最新
- @types/* 各種

```bash
npx npm-check-updates -u --target minor
npm install
npm run lint && npm run build
```

### Phase B: 構成系の整理

- 不要パッケージ削除（`lighthouse`, `mysql2`, `webpack-cli` の用途確認後）
- ESLint 設定の見直し（必要なら 9 系の flat config 化）
- `package.json` の scripts 整備（`typecheck` 追加など）

### Phase C: メジャーアップ（要計画）

ブレイキング変更を伴うため、個別に PR を切って実施。

#### C-1: Next.js 15 + React 19

- App Router 利用済みなので追従コストは中程度
- 影響：`headers()`/`cookies()` が非同期化、Server Component の振る舞い変更
- 公式 codemod: `npx @next/codemod@canary upgrade latest`

#### C-2: Prisma 6

- スキーマ・マイグレーションファイルへの影響を確認
- `04` 仕様（マルチアセット対応）のマイグレーションと統合実施が望ましい

#### C-3: MUI 6/7

- Pigment CSS / 新 styling API の検討
- 既存の `sx` プロップ利用箇所が多いと移行コストが高い
- 影響範囲が大きい場合は **見送り** も判断

#### C-4: Lightweight Charts 5

- v5 で API 名称・型シグネチャ変更
- ラベリング UI の中核なので慎重に検証
- ロールバック容易性のため単独 PR

#### C-5: Tailwind 4（任意）

- 設定ファイル形式が大きく変わるため、無理に上げない選択肢も可
- v3 の保守リスクが顕在化したタイミングで実施

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

- Phase A / B 完了後、新機能（02 / 03 / 04 / 05）の実装開始可能
- Phase C は新機能と並走して、影響範囲の小さいものから順次

## 実装メモ

（実装後に追記）
