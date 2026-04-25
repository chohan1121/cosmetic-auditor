# Cosmetic Auditor

> メーカーへの忖度を排除し、あなたの美容コストを最適化するWebアプリ

化粧品のJANコードや成分表をスキャンするだけで、成分の安全性評価・ジェネリック代替品の提案・
気候に合わせたスキンケアアドバイス・コスパ診断を即座に行います。

## 主要機能

- **バーコードスキャン** — JANコードから製品情報を自動取得
- **成分OCR解析** — 成分表の写真をGemini Visionで解析
- **ジェネリック判定** — 同等成分の安価な代替品を提示
- **シナジー/コンフリクト分析** — 手持ちコスメとの相性チェック
- **気候連動アドバイス** — 今日の天気・湿度に合わせたケア提案
- **コスパ監査** — ブランド料と実力コストの差を可視化

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| バックエンド | Supabase (Auth, Postgres + pgvector, Edge Functions) |
| LLM | Google Gemini 1.5 Flash |
| バーコードスキャン | @zxing/library |
| 状態管理 | Zustand |
| ルーティング | React Router v6 |

## セットアップ

### 必要なもの

- Node.js 18+
- Supabase CLI
- Gemini API キー
- OpenWeatherMap API キー

### 手順

```bash
# 1. リポジトリをクローン
git clone <repo-url>
cd cosmetic-auditor

# 2. 依存パッケージをインストール
npm install

# 3. 環境変数を設定
cp .env.example .env.local
# .env.local を編集して各キーを設定

# 4. Supabase をローカルで起動
npx supabase start

# 5. マイグレーションを適用
npx supabase db push

# 6. 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:5173 を開いてください。

## プロジェクト構成

詳細は [CLAUDE.md](./CLAUDE.md) を参照してください。

## ライセンス

MIT
