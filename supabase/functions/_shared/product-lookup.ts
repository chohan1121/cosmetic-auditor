export interface ProductLookupResult {
  jan: string
  name: string
  brand?: string
  price_jpy?: number
  ingredients_text?: string
  image_url?: string
  source: "yahoo" | "rakuten" | "mock"
  source_url?: string
}

export async function lookupProduct(jan: string): Promise<ProductLookupResult | null> {
  const yahooClientId = Deno.env.get("YAHOO_CLIENT_ID")
  if (yahooClientId) {
    return await lookupYahoo(jan, yahooClientId)
  }
  console.log("ℹ️ Using mock provider (Yahoo API not configured)")
  return lookupMock(jan)
}

async function lookupYahoo(jan: string, clientId: string): Promise<ProductLookupResult | null> {
  const url = new URL("https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch")
  url.searchParams.set("appid", clientId)
  url.searchParams.set("jan_code", jan)
  url.searchParams.set("results", "1")
  url.searchParams.set("fields", "name,brand,price,image,url,description")

  const res = await fetch(url.toString())
  if (!res.ok) return null

  const data: unknown = await res.json()
  if (
    typeof data !== "object" ||
    data === null ||
    !("hits" in data) ||
    !Array.isArray((data as Record<string, unknown>).hits) ||
    (data as { hits: unknown[] }).hits.length === 0
  ) {
    return null
  }

  const hit = (data as { hits: Record<string, unknown>[] }).hits[0]
  const price = hit.price
  return {
    jan,
    name: String(hit.name ?? ""),
    brand: hit.brand ? String((hit.brand as Record<string, unknown>).name ?? "") : undefined,
    price_jpy: typeof price === "number" ? price : undefined,
    image_url: hit.image ? String((hit.image as Record<string, unknown>).medium ?? "") : undefined,
    source_url: typeof hit.url === "string" ? hit.url : undefined,
    // Yahoo API の description から全成分テキストを抽出するのは精度が低いため空にする
    // OCR フォールバックか手動入力を想定
    ingredients_text: undefined,
    source: "yahoo",
  }
}

// 開発・デモ用モックデータ
const MOCK_DB: Record<string, ProductLookupResult> = {
  // ニベアクリーム 169g
  "4901301278203": {
    jan: "4901301278203",
    name: "ニベアクリーム 169g",
    brand: "ニベア",
    price_jpy: 698,
    source: "mock",
    source_url: "https://www.nivea.co.jp/products/face-care/nivea-cream",
    ingredients_text:
      "水、ミネラルオイル、ワセリン、グリセリン、ラノリンアルコール、パラフィン、スクワラン、ユーカリ葉油、ステアリン酸マグネシウム",
  },
  // キュレル 潤浸保湿フェイスクリーム
  "4901301339621": {
    jan: "4901301339621",
    name: "キュレル 潤浸保湿フェイスクリーム",
    brand: "キュレル",
    price_jpy: 1650,
    source: "mock",
    source_url: "https://www.curel.jp/products/moisturizing/face-cream/",
    ingredients_text:
      "水、グリセリン、BG、セラミドNP、セラミドAP、セラミドEOP、カルボマー、水酸化K、フィトステロールズ、コレステロール、セラミドNG、ジメチコン、ヒアルロン酸Na、クエン酸Na、クエン酸、フェノキシエタノール",
  },
  // 無印良品 敏感肌用化粧水 さっぱりタイプ 200ml
  "4549337608645": {
    jan: "4549337608645",
    name: "無印良品 敏感肌用化粧水 さっぱりタイプ",
    brand: "無印良品",
    price_jpy: 690,
    source: "mock",
    source_url: "https://www.muji.com/jp/ja/store/cmdty/detail/4549337608645",
    ingredients_text:
      "水、BG、グリセリン、EDTA-2Na、カルボマー、水酸化Na、ヒアルロン酸Na、ユズ果実エキス、アセチルヒアルロン酸Na、フェノキシエタノール、ヒドロキシプロピルメチルセルロース",
  },
}

// テスト用エントリ (デバッグ目的)
MOCK_DB["0000000000001"] = {
  jan: "0000000000001",
  name: "テスト化粧水",
  brand: "テストブランド",
  price_jpy: 1000,
  source: "mock",
  ingredients_text: "水、グリセリン、BG、ヒアルロン酸Na",
}

function lookupMock(jan: string): ProductLookupResult | null {
  const available = Object.keys(MOCK_DB)
  console.log("ℹ️ Available mock JANs:", available)
  console.log("ℹ️ Looking up JAN:", jan)
  const result = MOCK_DB[jan] ?? null
  if (!result) console.warn("⚠️ JAN not found in mock data:", jan)
  return result
}
