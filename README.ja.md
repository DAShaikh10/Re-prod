[English](README.md) | [日本語](README.ja.md)

---

# Re-prod

AI駆動のR分析IDE - RStudioに代わる、AI-nativeな次世代統合開発環境

## ミッション

データアナリストや研究者が、たった一つの分析を行うためにRパッケージのドキュメントを半日かけて読んだり、断片化されたツール間を行き来する必要はありません。この非効率性は、生物学者、統計学者、データサイエンティストを問わず、科学コミュニティ全体にとって大きな機会損失です。

Re-prodは**Rと散在するツールを自然言語に変換**し、AIが複雑さを処理する間、あなたは洞察に集中できます。

従来のIDEとは異なり、Re-prodは完全な実行履歴による**完璧な再現性を保証し**、常にコンテキストを切り替える必要のない**エンドツーエンドのプラットフォームを提供します**（将来的に）。私たちは、R分析が誰にとってもアクセス可能で、再現可能で、効率的な未来を構築しています。

---

## 特徴

- 🤖 **AIエージェント統合**: LLM APIによるインテリジェントなRプログラミング支援
- 🔄 **ファイル監視**: chokidarによるリアルタイムファイルモニタリング
- 📝 **実行履歴**: すべてのR実行の完全なログ

## アーキテクチャ

### バックエンド
- Node.js + Express + TypeScript
- Socket.ioによるWebSocket通信
- child_processを介した実際のR実行
- LLM API統合
  - OpenAIのGPT
  - AnthropicのClaude
- chokidarによるファイル監視

### フロントエンド
- React + TypeScript + Vite
- Monacoエディタによるコード編集
- RStudioにインスパイアされたカラーパレット

## 前提条件

- Node.js 18+
- npm
- R (4.0+)、`Rscript`がPATHに含まれていること
- **OpenAI APIキー**（デフォルト）または **Anthropic APIキー**（代替）

## インストール

```bash
# すべてのワークスペースの依存関係をインストール
npm install
```

以下の依存関係がインストールされます：
- ルートワークスペース
- `client/`（Reactフロントエンド）
- `server/`（Node.jsバックエンド）
- `shared/`（TypeScript型定義）

## アプリケーションの実行

### フロントエンドとバックエンドを同時に起動

```bash
npm run dev
```

以下が起動します：
- バックエンド: `http://localhost:4000`
- フロントエンド: `http://localhost:5173`

### 個別に実行

```bash
# ターミナル1: バックエンド
npm run dev:server

# ターミナル2: フロントエンド
npm run dev:client
```

## プロジェクト構成

```
Re-prod/
├── client/                    # Reactフロントエンド
│   ├── src/
│   │   ├── components/        # UIコンポーネント
│   │   │   ├── ...
│   │   ├── services/
│   │   │   └── socket.ts      # WebSocketクライアント
│   │   ├── store/
│   │   │   └── useStore.ts    # Zustand状態管理
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── index.css          # RStudioカラー
│   └── package.json
├── server/                    # Node.jsバックエンド
│   ├── src/
│   │   ├── services/
│   │   │   └── ...
│   │   └── server.ts          # メインサーバー
│   ├── .env                   # 環境設定（APIキーを含む）
│   └── package.json
├── shared/                    # 共有TypeScript型定義
│   └── src/
│       └── types.ts
├── AGENTS.md                  # コーディングガイドライン
└── package.json               # ルートワークスペース設定
```

## 使い方

1. **Re-prodを開く**: ブラウザで `http://localhost:5173` にアクセス
2. **Rコードを書く**: Monacoエディタ（左ペイン）
3. **コードを実行**: 「▶ Run」ボタンをクリック
4. **出力を確認**: Consoleパネル（下部）
5. **プロットを表示**: Plotsパネル（右下）
6. **AIに質問**: AI Assistantパネル（右上）

### AIアシスタント

AIアシスタントは**OpenAI**（デフォルト）と**Claude**の両方をサポートしています：

**OpenAI (GPT-4o)** - デフォルト：
- 高速なレスポンス
- 優れたRプログラミング知識
- `server/.env`の`OPENAI_API_KEY`で設定

**Claude (3.5 Sonnet)** - 代替：
- 強力なコーディング能力
- `server/.env`で`AI_PROVIDER=anthropic`を設定

**プロバイダーの切り替え：**
```env
# server/.env内
AI_PROVIDER=openai        # または "anthropic"
OPENAI_API_KEY=sk-...     # OpenAI用
ANTHROPIC_API_KEY=sk-...  # Claude用
```

### キーボードショートカット

- `Cmd/Ctrl + Enter`: 現在のセル/セクションを実行
- `Shift + Enter`: 現在のセルを実行して次へ移動
- `Cmd/Ctrl + Shift + Enter`: すべてのコードを実行

### Rのパス

`Rscript`がPATHに含まれていない場合、フルパスを設定してください：

```env
R_PATH=/usr/local/bin/Rscript
```

## 開発

### 型チェック

```bash
npm run lint
```

### 本番ビルド

```bash
npm run build
```

### 一時ファイルのクリーンアップ

一時的なRプロットとスクリプトは`server/temp/`に保存されます。1時間ごとに自動クリーンアップされますが、手動で削除することもできます：

```bash
rm -rf server/temp/*
```

## トラブルシューティング

### Rが見つからない
```
Error: Failed to start R process
```

**解決策**: Rがインストールされ、`Rscript`がPATHに含まれていることを確認するか、`.env`で`R_PATH`を設定してください

### WebSocket接続失敗
```
Socket connection error
```

**解決策**:
1. バックエンドがポート4000で動作していることを確認
2. server/.envの`CLIENT_URL`がフロントエンドのURLと一致することを確認
3. ブラウザコンソールでCORSエラーを確認

### AIが応答しない

**解決策**:
1. `server/.env`で`OPENAI_API_KEY`または`ANTHROPIC_API_KEY`のいずれかが設定されていることを確認
2. サーバーログでAPIエラーを確認
3. APIクレジットがあることを確認

## 実装ノート

AGENTS.mdガイドラインに従っています：
- ✅ ダミー実装なし - すべてのサービスは実際に機能
- ✅ 本物のClaude API統合
- ✅ child_processを介した本物のR実行
- ✅ chokidarによる本物のファイル監視
- ✅ RStudioにインスパイアされたUI（ライトグレー、ミュートブルー）
- ✅ TypeScriptストリクトモードと明示的な型
- ✅ 関数型Reactコンポーネント
- ✅ 2スペースインデント

## 今後の機能強化

- ファイルブラウザとプロジェクト管理
- キーボードショートカット
- ダークテーマサポート
- 複数ファイルタブ
- Rパッケージ管理
- PDF/HTMLエクスポート
- 共同編集
- Electronデスクトップアプリ

## ライセンス

MIT

## 謝辞

- RStudioの優れたUI/UXにインスパイアされました
- React、Monaco Editor、Socket.ioで構築されています
