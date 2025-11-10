[English](README.md) | [日本語](README.ja.md)

---

# Re-prod

AI 駆動の R 分析 IDE — RStudio に代わる AI ネイティブな次世代統合開発環境

## ミッション

研究者やデータアナリストが、単なる分析のために R パッケージのドキュメントを何時間も読み込み、ツール間を行き来する必要はありません。Re-prod は **R や補助ツールを自然言語に変換** し、AI が複雑な部分を引き受けることで、ユーザーは洞察に集中できる未来を目指しています。

さらに Re-prod は、完全な実行履歴による **再現性の担保** と、継続的なコンテキストスイッチを排除する **エンドツーエンドのワークフロー** を提供します。

---

## 特徴

- 🤖 **AI エージェント統合**: Anthropic / OpenAI プロバイダーを備えたインテリジェントなコード支援
- 📝 **実行履歴**: すべての R 実行を保存してタイムライン表示
- 📊 **プロット管理**: 自動的にプロットをキャプチャし、UI で閲覧

## アーキテクチャ

### バックエンド (Rust)
- Cargo ワークスペース構成
- Tauri デスクトップアプリケーション
- Axum WebSocket サーバー (オプション)
- Tokio による R 実行
- AI プロバイダー統合 (Anthropic / OpenAI)
- プラットフォーム非依存のコアライブラリ

### フロントエンド
- React + TypeScript + Vite
- Monaco Editor によるコード編集
- Tauri / Web の両方から利用可能

## 前提条件

- **Rust** (最新の安定版) — [rustup.rs](https://rustup.rs/) からインストール
- **Node.js** 18 以上
- **pnpm** 9 以上 (`corepack enable pnpm` または `npm install -g pnpm`)
- **R** 4.0+ (`Rscript` が PATH に含まれていること)
- **Anthropic API キー** (任意、AI 機能用)

## インストール手順

### 1. Rust をインストール

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. Tauri CLI をインストール

```bash
cargo install tauri-cli --version "^2.0"
```

### 3. JavaScript 依存をインストール (pnpm)

```bash
pnpm install
```

### 4. (任意) AI 設定

`~/.reprod/auth.json` を作成し、Anthropic API キーや R のパスを設定します。

```bash
mkdir -p ~/.reprod
cat > ~/.reprod/auth.json <<'EOF'
{
  "anthropic_api_key": "your-api-key-here",
  "r_path": "Rscript"
}
EOF
```

## アプリケーションの起動

### オプション 1: デスクトップアプリ (推奨)

```bash
cd desktop
cargo tauri dev
```

Tauri ウィンドウが起動し、フロントエンドとバックエンドが自動で立ち上がります。

### オプション 2: Web 版

```bash
pnpm dev
```

- Axum サーバー: `http://localhost:3001`
- Vite 開発サーバー: `http://localhost:5173`

ブラウザで `http://localhost:5173` にアクセスします。

### オプション 3: フロントエンドのみ

```bash
pnpm --filter client dev
```

バックエンドを起動せずに Vite 開発サーバーのみを利用します。

## プロジェクト構成

```
Re-prod/
├── Cargo.toml                # Rust ワークスペース
├── core/                     # 共通ビジネスロジック
├── desktop/                  # Tauri デスクトップアプリ
├── server/                   # Axum Web サーバー
├── client/                   # React + TypeScript フロントエンド
└── shared/                   # 共有 TypeScript 型
```

## 開発ワークフロー

### TypeScript 型チェック

```bash
pnpm -r lint
```

### ビルド

```bash
pnpm -r build
```

### 一時ファイルの削除

一時的な R プロットやスクリプトは OS によりクリーンアップされますが、手動で削除も可能です。

```bash
rm -rf server/temp/*
```

## トラブルシューティング

### R が見つからない場合
- `Rscript` が PATH に含まれているか確認
- `~/.reprod/auth.json` の `r_path` を設定

### WebSocket 接続に失敗する場合
- バックエンドがポート 3001 で起動しているか確認
- 他のプロセスがポート 3001 を使用していないか (`lsof -i :3001`)
- フロントエンドが `ws://localhost:3001/ws` に接続しているか確認

### AI が応答しない場合
- `~/.reprod/auth.json` もしくは環境変数で API キーを設定
- サーバー / デスクトップのログを確認
- API の利用制限に達していないか確認

## ライセンス

MIT

## 謝辞

- RStudio の UI/UX にインスパイアされています
- React, Monaco Editor, Axum, Tauri などの OSS に感謝します
