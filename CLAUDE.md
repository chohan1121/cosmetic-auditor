# コスメのホンネ (Cosmetic Auditor v2) — CLAUDE.md

## プロジェクト概要

成分表を貼り付けるだけで「忖度なしのホンネ採点」を返すコスメ分析アプリ。
**完全クライアントサイド** — バックエンド・認証・APIキーは一切不要。

**ミッション**: メーカーへの忖度を排除し、ユーザーの実利(肌とお財布)を最大化する。
トーンは辛口だがUIは明るく親しみやすく。

### 主要機能
| 機能 | 実装 |
|------|------|
| 成分ホンネ分析 | `src/data/ingredients.ts` の辞書 + `src/lib/analyze.ts` のルールエンジン |
| コスパ診断 | `src/data/benchmarks.ts` のカテゴリ相場と比較、ブランド料を算出 |
| マイポーチ相性 | `src/lib/compat.ts` のタグベースルール。zustand persistでlocalStorage保存 |
| 肌アドバイス(今日+週間先読み) | `src/lib/weather.ts` — Open-Meteo API(キー不要)、7日間予報、位置情報は東京フォールバック |
| ジェネリック提案 | `src/data/recommendations.ts` のプチプラ実在品DB(肌 PRODUCT_DB + 髪 HAIR_DB、参考価格)と成分タグ一致でマッチング。`DupeList`(domain: skin/hair)で表示 |
| 肌質・髪質プロフィール | `src/stores/profileStore.ts`(肌質+悩み+髪質+髪悩み、persist)→ `ProfilePage` は肌/髪の2タブ構成でカテゴリ別おすすめ、`CheckPage` にパーソナルメモ連動 |
| 成分組み合わせ事典 | `GuidePage` — `compat.ts` の RULES から相性マトリクス+ルールカードを自動生成 |

## 技術スタック

- React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- Zustand (persist) / React Router v6
- 外部API: Open-Meteo のみ(キー不要)。Supabase・Gemini は **v2 で撤去済み**

## ディレクトリ構造

```
src/
├── pages/            # Home, CheckPage, CostPage, PouchPage, ProfilePage, GuidePage, NotFoundPage
├── components/
│   ├── ui/           # shadcn/ui プリミティブ
│   ├── layout/       # AppLayout (ヘッダー+ボトムナビ5タブ)
│   └── common/       # DupeList (ジェネリック候補リスト)
├── data/             # ingredients(成分辞書), benchmarks(相場), sampleProducts, recommendations(プチプラDB)
├── lib/              # analyze(採点エンジン), compat(相性ルール), weather(現在+週間予報), utils
└── stores/           # pouchStore, profileStore (zustand persist)
```

## コーディング規約

- TypeScript strict。`any` 禁止
- 関数コンポーネント + hooks のみ。propsは `interface`/`type` で明示
- インポートは `@/` エイリアス
- スタイルは Tailwind 優先
- アイコンは絵文字を使用(lucide等のアイコンライブラリは使わない)
- 文言はすべて日本語。「辛口だけど明るい」トーンで統一

## デザイン原則

- モバイルファースト (max-w-md 中央寄せ、ボトムナビ4タブ)
- **明るい配色**: クリーム背景 + コーラルピンク(primary) + ピーチ/ミントのアクセント
- 角丸大きめ (rounded-2xl/3xl)、絵文字を積極活用
- CSS変数は `src/index.css` で定義(shadcn形式)

## コマンド

```bash
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # tsc -b && vite build
npm run lint     # ESLint
```

環境変数は不要。`.env` 系ファイルは残っているが未使用。

## 注意事項

- このフォルダはOneDrive配下。ファイルが「クラウドのみ」に退避されると
  読み取り失敗やdev server激遅の原因になる(attrib +P でピン留め済み)
- `supabase/` ディレクトリはv1の遺物。現行コードからは参照していない
- 成分辞書に新成分を足すときは `INGREDIENT_DICT` に追記し、
  相性判定に関わるものは `ActiveTag` を付与する
