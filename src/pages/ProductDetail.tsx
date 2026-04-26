import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom"; // useLocation 追加
import { ArrowLeft, ExternalLink, PackageSearch } from "lucide-react";

interface ProductIngredient {
  position: number;
  matched_text: string;
  match_confidence: "exact" | "alias" | "fuzzy" | "embedding";
  ingredient: {
    id: string;
    inci_name: string;
    jp_name: string;
    function: string[];
    weight_in_synergy: number;
  };
}

interface ProductVerdict {
  id: string;
  verdict_text: string;
  overall_score: number;
  safety_score: number;
  efficacy_score: number;
  value_score: number;
  created_at: string;
}

interface Product {
  id: string;
  jan_code: string;
  product_name: string;
  brand: string | null;
  price_jpy: number | null;
  image_url: string | null;
  raw_ingredient_text: string | null;
  source: string;
  source_url: string | null;
  created_at: string;
  product_ingredients: ProductIngredient[];
  product_verdicts?: ProductVerdict[]; // 配列だが通常1件
}

const CONFIDENCE_LABEL: Record<string, string> = {
  exact: "完全一致",
  alias: "別名",
  fuzzy: "部分一致",
  embedding: "AI",
};

const CONFIDENCE_COLOR: Record<string, string> = {
  exact: "bg-emerald-900/60 text-emerald-300",
  alias: "bg-sky-900/60 text-sky-300",
  fuzzy: "bg-amber-900/60 text-amber-300",
  embedding: "bg-violet-900/60 text-violet-300",
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // 追加
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Scan.tsx から navigate で渡されたデータを使う
    const stateProduct = location.state?.product as Product | undefined;

    if (stateProduct) {
      // データがあればそのまま使用
      if (stateProduct.product_ingredients) {
        stateProduct.product_ingredients.sort(
          (a, b) => a.position - b.position,
        );
      }

      // 🔍 デバッグログ追加
      console.log("📦 Product data received:", stateProduct);
      console.log("📊 Product verdicts:", stateProduct.product_verdicts);
      console.log("📊 Verdicts length:", stateProduct.product_verdicts?.length);

      setProduct(stateProduct);
      setLoading(false);
    } else {
      // データがなければエラー
      setError("商品データが渡されていません");
      setLoading(false);
    }
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <p className="text-sm text-zinc-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-950">
        <header className="flex items-center gap-3 px-4 pb-2 pt-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="戻る"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ArrowLeft size={20} />
          </button>
        </header>
        <div className="mx-auto flex w-full max-w-[480px] flex-1 items-center justify-center px-4">
          <div className="text-center">
            <PackageSearch size={48} className="mx-auto mb-3 text-zinc-600" />
            <p className="text-zinc-300">
              {error ?? "製品が見つかりませんでした"}
            </p>
            <button
              onClick={() => navigate("/scan")}
              className="mt-4 rounded bg-emerald-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-300"
            >
              スキャンに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  const unmatchedIngredients = product ? getUnmatched(product) : [];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pb-2 pt-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="line-clamp-1 flex-1 text-base font-bold text-zinc-100">
          {product.product_name}
        </h1>
      </header>

      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-4 px-4 pb-8">
        {/* Product card */}
        <div className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.product_name}
              className="h-20 w-20 flex-shrink-0 rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800">
              <PackageSearch size={28} className="text-zinc-600" />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="font-semibold text-zinc-100 leading-tight">
              {product.product_name}
            </p>
            {product.brand && (
              <p className="text-sm text-zinc-400">{product.brand}</p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {product.price_jpy != null && (
                <span className="text-sm font-medium text-emerald-400">
                  ¥{product.price_jpy.toLocaleString()}
                </span>
              )}
              {product.jan_code && (
                <span className="text-xs text-zinc-600">
                  {product.jan_code}
                </span>
              )}
            </div>
            {product.source_url && (
              <a
                href={product.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
              >
                <ExternalLink size={11} />
                <span>{product.source}</span>
              </a>
            )}
          </div>
        </div>

        {/* Verdict section */}
        {product.product_verdicts && product.product_verdicts.length > 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                総合評価
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-emerald-400">
                  {product.product_verdicts[0].overall_score}
                </span>
                <span className="text-xs text-zinc-600">/ 10</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">
              {product.product_verdicts[0].verdict_text}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                <p className="text-xs text-zinc-600">安全性</p>
                <p className="mt-0.5 text-sm font-semibold text-zinc-300">
                  {product.product_verdicts[0].safety_score}/10
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                <p className="text-xs text-zinc-600">効果</p>
                <p className="mt-0.5 text-sm font-semibold text-zinc-300">
                  {product.product_verdicts[0].efficacy_score}/10
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                <p className="text-xs text-zinc-600">コスパ</p>
                <p className="mt-0.5 text-sm font-semibold text-zinc-300">
                  {product.product_verdicts[0].value_score}/10
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
              総合評価
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              評価を生成中... しばらくお待ちください
            </p>
          </div>
        )}

        {/* Matched ingredients */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">成分リスト</h2>
            <span className="text-xs text-zinc-500">
              {product.product_ingredients?.length ?? 0}件マッチ
            </span>
          </div>

          {!product.product_ingredients ||
          product.product_ingredients.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-6 text-center">
              <p className="text-sm text-zinc-500">
                マッチした成分がありません
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {product.product_ingredients?.map((pi) => (
                <li
                  key={pi.ingredient.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-zinc-100">
                        {pi.ingredient.jp_name ?? pi.ingredient.inci_name}
                      </p>
                      {pi.ingredient.jp_name && (
                        <p className="text-xs text-zinc-500">
                          {pi.ingredient.inci_name}
                        </p>
                      )}
                      {pi.ingredient.function &&
                        pi.ingredient.function.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {pi.ingredient.function.map((fn) => (
                              <span
                                key={fn}
                                className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                              >
                                {fn}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <span className="text-xs text-zinc-600">
                        #{pi.position}
                      </span>
                      {pi.match_confidence && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${CONFIDENCE_COLOR[pi.match_confidence] ?? "bg-zinc-800 text-zinc-400"}`}
                        >
                          {CONFIDENCE_LABEL[pi.match_confidence] ??
                            pi.match_confidence}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Unmatched ingredients */}
        {unmatchedIngredients.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-500">
                未マッチ成分
              </h2>
              <span className="text-xs text-zinc-600">
                {unmatchedIngredients.length}件
              </span>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {unmatchedIngredients.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-500"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function getUnmatched(product: Product): string[] {
  if (!product.raw_ingredient_text) return [];
  if (!product.product_ingredients || product.product_ingredients.length === 0)
    return [];

  const matchedTexts = new Set(
    product.product_ingredients
      .map((pi) => pi.matched_text?.trim().toLowerCase())
      .filter(Boolean),
  );
  const all = product.raw_ingredient_text
    .split(/[,、・／/\n]/)
    .map((s) => s.replace(/[()（）「」【】\s　]/g, "").trim())
    .filter((s) => s.length > 1);
  return all.filter((s) => !matchedTexts.has(s.toLowerCase()));
}
