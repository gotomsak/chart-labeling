# 仕様書インデックス

本ディレクトリには chart-labeling プロジェクトの設計・仕様ドキュメントを集約する。

## ドキュメント一覧

| # | ファイル | 概要 |
|---|---------|------|
| 00 | [dependency-upgrade.md](./00-dependency-upgrade.md) | 依存関係アップグレード計画（**新機能の前提**） |
| 01 | [overview.md](./01-overview.md) | プロジェクト全体像・現状把握 |
| 02 | [data-collection.md](./02-data-collection.md) | データ自動収集機能の仕様 |
| 03 | [auto-labeling.md](./03-auto-labeling.md) | AI 自動ラベリング機能の仕様 |
| 04 | [multi-asset-support.md](./04-multi-asset-support.md) | FX + 日本株マルチアセット対応 |
| 05 | [schema-changes.md](./05-schema-changes.md) | DB スキーマ拡張計画 |

## 実装順序

1. **00** 依存関係アップグレード（Phase A / B）
2. **05** スキーマ拡張
3. **02** データ自動収集
4. **04** マルチアセット UI 対応
5. **03** 自動ラベリング
6. **00** Phase C のメジャーアップは並走で随時

## 運用ルール

- 仕様確定 → 実装開始 → 実装完了時に「実装メモ」セクションを追記
- 仕様変更時は該当ドキュメントを更新し、コミットメッセージで参照する
- 新機能を追加する際は新しい番号付きドキュメントを追加する
