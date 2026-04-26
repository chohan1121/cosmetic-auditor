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

| 領域               | 技術                                                    |
| ------------------ | ------------------------------------------------------- |
| フロントエンド     | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| バックエンド       | Supabase (Auth, Postgres + pgvector, Edge Functions)    |
| LLM                | Google Gemini 1.5 Flash                                 |
| バーコードスキャン | @zxing/library                                          |
| 状態管理           | Zustand                                                 |
| ルーティング       | React Router v6                                         |

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

# 🧴 Cosmetic Auditor

忖度なし化粧品成分分析アプリ

## 📱 実装済み機能

### ✅ Phase 1B: JANスキャン → 商品詳細

- バーコードスキャン（カメラ使用）
- 手動JAN入力
- Yahoo Shopping API連携
- 商品情報取得・表示
- 成分マッチング（ベクトル検索）

### ✅ Phase 1C-1: 総合評価生成

- **AI評価生成**（Gemini API）
- 忖度なしの正直レビュー
- 4つのスコア表示（総合・安全性・効果・コスパ）
- 成分0件でも商品名・価格から評価

### 🚧 Phase 1C-2: クローゼット機能（次回実装）

## 🚀 クイックスタート

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数設定
cp .env.example .env
# .envを編集してSupabase情報を設定

# 3. 開発サーバー起動
npm run dev
```

## ⚙️ セットアップ詳細

### Supabase設定

1. **マイグレーション実行**
   - `supabase/migrations/` の各ファイルを順番に実行

2. **Secrets設定** (Dashboard → Settings → Edge Functions)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `YAHOO_CLIENT_ID`

3. **Edge Functionデプロイ**
   ```bash
   supabase functions deploy analyze-barcode
   ```

## 🛠️ 技術スタック

- React + TypeScript
- Supabase (PostgreSQL + Edge Functions)
- Gemini API
- TailwindCSS

## 📝 次のフェーズ

- Phase 1C-2: クローゼット機能
- Phase 2: シナジー分析
- Phase 3: ジェネリック提案
