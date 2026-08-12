export interface ScannedProduct {
  barcode: string;
  name: string;
  brand: string;
  ingredientsText: string | null;
  imageUrl: string | null;
}

interface OBFResponse {
  status?: number;
  status_verbose?: string;
  product?: {
    product_name?: string;
    brands?: string;
    ingredients_text?: string;
    ingredients_text_ja?: string;
    ingredients_text_en?: string;
    image_front_url?: string;
  };
}

/**
 * Open Beauty Facts(Open Food Factsの化粧品版、無料・APIキー不要)から
 * バーコードで商品情報・成分表を取得する。
 */
export async function fetchProductByBarcode(barcode: string): Promise<ScannedProduct | null> {
  const url = `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(
    barcode
  )}.json?fields=product_name,brands,ingredients_text,ingredients_text_ja,ingredients_text_en,image_front_url`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("商品情報の取得に失敗しました");
  const data = (await res.json()) as OBFResponse;

  if (!data.product) return null;

  const p = data.product;
  const ingredientsText = p.ingredients_text_ja || p.ingredients_text || p.ingredients_text_en || null;

  return {
    barcode,
    name: p.product_name?.trim() || "商品名不明",
    brand: p.brands?.trim() || "",
    ingredientsText: ingredientsText?.trim() || null,
    imageUrl: p.image_front_url || null,
  };
}
