# 01. プロジェクト概要

## 目的

FX および株式のチャートに対して「買い / 売り / 利確」のラベルを付与し、機械学習用の教師データセットを構築する Web アプリケーション。

当初は手動ラベリングのみだったが、以下を拡張する予定：

- **データの自動収集**（外部 API から定期取得）
- **AI による自動ラベリング**（ルールベースを基本、必要に応じて LLM 補助）
- **マルチアセット対応**（FX + 日本株）

## 現状の技術スタック

| レイヤー | 採用技術 |
|---------|---------|
| フロントエンド | Next.js 14 / React 18 / TypeScript |
| UI | MUI 5, Tailwind CSS, Emotion |
| チャート描画 | Lightweight Charts 4.1 |
| 仮想スクロール | React Window |
| 状態管理 | React Context |
| API | Next.js API Routes |
| メタデータ DB | SQLite (Prisma) → **PostgreSQL に統合予定**（[06](./06-database-consolidation.md)） |
| チャート/ラベル DB | MongoDB → **PostgreSQL に統合予定** |
| インフラ | Docker Compose（MongoDB → PostgreSQL） |
| Storybook | 8.x |

## 現状のディレクトリ構造（抜粋）

```
src/
├── app/
│   ├── api/
│   │   ├── candles/          # チャートデータ取得・ラベル管理
│   │   ├── bookmark/         # ブックマーク機能
│   │   └── file/             # ファイル操作
│   ├── chart/                # ラベリング UI ページ
│   └── page.tsx
├── components/
├── provider/                 # React Context プロバイダ
├── types/
├── utils/
└── stories/                  # Storybook
prisma/
└── schema.prisma
```

## 現状の DB スキーマ（Prisma）

- `ChartMaster`: 通貨ペア（GBPJPY 等）
- `ChartLabeling`: チャートファイルのメタデータ
- `Bookmark`: ブックマーク情報

## 現状の API ルート

| エンドポイント | 役割 |
|--------------|------|
| `/api/candles` | チャートデータ取得（MongoDB） |
| `/api/candles/labeling` | ラベル GET / POST |
| `/api/bookmark` | ブックマーク管理 |
| `/api/file` | ファイル作成・エクスポート |

## 拡張ロードマップ

1. **依存関係アップグレード**（[00](./00-dependency-upgrade.md)）— Next.js 15 / React 19、不要パッケージ削除
2. **DB 統合**（[06](./06-database-consolidation.md)）— SQLite + MongoDB → PostgreSQL
3. **スキーマ拡張**（[05](./05-schema-changes.md)）— FX/株両対応（06 と同時実施）
4. **データ自動収集**（[02](./02-data-collection.md)）— Yahoo Finance ベース
5. **マルチアセット UI**（[04](./04-multi-asset-support.md)）— 銘柄選択・株用時間足
6. **自動ラベリング**（[03](./03-auto-labeling.md)）— ルールベース → LLM 補助
