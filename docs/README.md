# 仕様書インデックス

本ディレクトリには chart-labeling プロジェクトの設計・仕様ドキュメントを集約する。

## ドキュメント一覧

| # | ファイル | 概要 |
|---|---------|------|
| 00 | [dependency-upgrade.md](./00-dependency-upgrade.md) | 依存関係アップグレード計画（**最優先**） |
| 01 | [overview.md](./01-overview.md) | プロジェクト全体像・現状把握 |
| 02 | [data-collection.md](./02-data-collection.md) | データ自動収集機能の仕様 |
| 03 | [auto-labeling.md](./03-auto-labeling.md) | AI 自動ラベリング機能の仕様 |
| 04 | [multi-asset-support.md](./04-multi-asset-support.md) | FX + 日本株マルチアセット対応 |
| 05 | [schema-changes.md](./05-schema-changes.md) | DB スキーマ拡張（06 に統合） |
| 06 | [database-consolidation.md](./06-database-consolidation.md) | SQLite + MongoDB → PostgreSQL 統合 |

## 実装順序

1. **00 Phase A** 不要パッケージ削除（mysql2, lighthouse, webpack-cli）
2. **00 Phase B** パッチ・マイナー追従
3. **00 Phase C** Next.js 15 + React 19 へメジャーアップ
4. **00 Phase D / 06** PostgreSQL へ DB 統合（+ スキーマ拡張 05 を同時実施）
5. **02** データ自動収集（Yahoo Finance）
6. **04** マルチアセット UI 対応
7. **03** 自動ラベリング（ルールベース → LLM）
8. **00 Phase E** 残りのメジャーアップ（MUI / Lightweight Charts / ESLint / Tailwind）は並走

## 運用ルール

- 仕様確定 → 実装開始 → 実装完了時に「実装メモ」セクションを追記
- 仕様変更時は該当ドキュメントを更新し、コミットメッセージで参照する
- 新機能を追加する際は新しい番号付きドキュメントを追加する
