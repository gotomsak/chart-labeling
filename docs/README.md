# 仕様書インデックス

本ディレクトリには chart-labeling プロジェクトの設計・仕様ドキュメントを集約する。

## ドキュメント一覧

| # | ファイル | 概要 |
|---|---------|------|
| 01 | [overview.md](./01-overview.md) | プロジェクト全体像・現状把握 |
| 02 | [data-collection.md](./02-data-collection.md) | データ自動収集機能の仕様 |
| 03 | [auto-labeling.md](./03-auto-labeling.md) | AI 自動ラベリング機能の仕様 |
| 04 | [multi-asset-support.md](./04-multi-asset-support.md) | FX + 日本株マルチアセット対応 |
| 05 | [schema-changes.md](./05-schema-changes.md) | DB スキーマ拡張計画 |

## 運用ルール

- 仕様確定 → 実装開始 → 実装完了時に「実装メモ」セクションを追記
- 仕様変更時は該当ドキュメントを更新し、コミットメッセージで参照する
- 新機能を追加する際は新しい番号付きドキュメントを追加する
