# Cosmetic Auditor — CLAUDE.md

## プロジェクト概要

化粧品のJANコード・成分写真をスキャンし、成分分析・ジェネリック判定・
気候連動アドバイス・コスパ監査を行うWebアプリ。

**ミッション**: メーカーへの忖度を排除し、ユーザーの実利を最大化する。

### 主要機能
| 機能 | 説明 |
|------|------|
| スキャン | JANコードスキャン (@zxing) + 成分OCR (Gemini Vision) |
| 成分分析 | 成分の安全性・機能・刺激性を評価 |
| ジェネリック判定 | 同等成分の安価な代替品を提示 |
| シナジー/コンフリクト | 手持ちアイテムとの相性分析 |
| 気候連動アドバイス | 現在地の気象データに基づくスキンケア提案 |
| コスパ監査 | ブランド料 vs 実力コストの可視化 |

## 技術スタック

- **フロント**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **バックエンド**: Supabase (Auth, Postgres + pgvector, Edge Functions)
- **LLM**: Gemini 1.5 Flash (Edge Functions 内から呼び出し)
- **スキャナ**: @zxing/library (バーコード), Gemini Vision API (OCR)
- **状態管理**: Zustand
- **ルーティング**: React Router v6

## ディレクトリ構造

```
src/
├── pages/          # ルートレベルページコンポーネント
├── features/       # 機能ごとのモジュール
│   ├── scan/       # スキャン機能 (barcode, OCR)
│   ├── ingredients/# 成分分析
│   ├── generic/    # ジェネリック判定
│   ├── synergy/    # シナジー/コンフリクト
│   ├── closet/     # マイコスメ管理
│   ├── weather/    # 気候連動アドバイス
│   └── audit/      # コスパ監査
├── lib/            # 外部サービスクライアント (supabase.ts 等)
├── components/
│   ├── ui/         # shadcn/ui コンポーネント
│   ├── layout/     # Header, Footer, Layout
│   └── common/     # 汎用コンポーネント
├── hooks/          # カスタムフック
├── stores/         # Zustand ストア
└── types/          # TypeScript 型定義

supabase/
├── migrations/     # DB マイグレーション SQL
└── functions/      # Edge Functions (Deno)
    ├── analyze-barcode/
    ├── analyze-ocr/
    ├── find-generic/
    ├── audit-verdict/
    ├── scrape-amazon/
    └── _shared/    # 共有ユーティリティ
```

## コーディング規約

### 全般
- **言語**: TypeScript strict モード必須。`any` 禁止
- **コンポーネント**: 関数コンポーネント + React hooks のみ使用
- **命名**:
  - コンポーネント: PascalCase (`ScanPage.tsx`)
  - フック: camelCase, `use` プレフィックス (`useBarcode.ts`)
  - 型/インターフェース: PascalCase (`type Product = ...`)
  - ストア: camelCase (`useProductStore.ts`)
- **インポート**: `@/` エイリアスを使用 (`import { supabase } from '@/lib/supabase'`)
- **コメント**: 自明でないロジックにのみ記述。日本語 OK

### React
- props の型は `interface` で明示的に定義
- `useEffect` の依存配列は省略しない
- 状態は Zustand に集約、ローカル state は UI 状態のみ

### Supabase Edge Functions
- Deno ランタイム。`import` は URL または `npm:` プレフィックス
- GEMINI_API_KEY は Edge Function 側の環境変数のみ。フロントに渡さない
- CORS ヘッダーを `_shared/cors.ts` で共通化

### セキュリティ
- ユーザー入力は必ずサニタイズ
- RLS (Row Level Security) を全テーブルで有効化
- `.env` は絶対にコミットしない

## コマンド一覧

```bash
# 開発
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # 本番ビルド
npm run preview      # 本番ビルドをローカルでプレビュー
npm run lint         # ESLint

# Supabase
npx supabase start           # ローカル Supabase 起動
npx supabase db push         # マイグレーション適用
npx supabase functions serve # Edge Functions ローカル実行
npx supabase gen types typescript --local > src/types/supabase.ts
                             # 型定義自動生成

# shadcn/ui コンポーネント追加
npx shadcn@latest add button
npx shadcn@latest add card
# など
```

## 環境変数

`.env.example` を `.env.local` にコピーして値を設定してください。

| 変数名 | 用途 | 公開範囲 |
|--------|------|----------|
| `VITE_SUPABASE_URL` | Supabase プロジェクト URL | フロント |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名キー | フロント |
| `VITE_OPENWEATHER_API_KEY` | OpenWeatherMap API | フロント |
| `GEMINI_API_KEY` | Gemini API キー | Edge Function のみ |
