import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { lookupProduct } from "../_shared/product-lookup.ts";
import { extractIngredients } from "../_shared/ingredient-extractor.ts";
import { matchIngredients } from "../_shared/ingredient-matcher.ts";
import { computeIngredientVector } from "../_shared/vector-compose.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("═══════════════════════════════════════");
    console.log("📥 [START] analyze-barcode invoked");

    const body: unknown = await req.json();
    console.log("📦 [0] Request body:", JSON.stringify(body));

    if (typeof body !== "object" || body === null || !("jan" in body)) {
      console.error("❌ [0] Missing jan field in body");
      return jsonError("Missing jan field", 400);
    }
    const jan = String((body as Record<string, unknown>).jan);
    console.log("🔢 [1] JAN received:", jan);

    if (!/^\d{8,13}$/.test(jan)) {
      console.error("❌ [1] Invalid JAN format:", jan);
      return jsonError("Invalid JAN code (8–13 digits required)", 400);
    }

    console.log("🔑 [1.5] Creating Supabase client...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing environment variables");
      console.error("SUPABASE_URL:", supabaseUrl ? "exists" : "MISSING");
      console.error(
        "SUPABASE_SERVICE_ROLE_KEY:",
        supabaseKey ? "exists" : "MISSING",
      );
      return jsonError("サーバー設定エラー", 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("✅ [1.5] Supabase client created");

    console.log("🔍 [2] Checking cache for JAN:", jan);

    const { data: cached, error: cacheError } = await supabase
      .from("products")
      .select(
        `
    id,
    jan_code,
    product_name,
    brand,
    price_jpy,
    image_url,
    raw_ingredient_text,
    source,
    source_url,
    created_at,
    product_ingredients(
      position,
      matched_text,
      match_confidence,
      ingredient:ingredients(
        id,
        inci_name,
        jp_name,
        function,
        weight_in_synergy
      )
    )
  `,
      )
      .eq("jan_code", jan)
      .maybeSingle();

    if (cacheError) {
      console.error("❌ [2] Cache check error:", cacheError);
    }

    console.log("📊 [2] Cache result:", cached ? "HIT" : "MISS");

    if (cached) {
      console.log("✅ [2] Returning cached product:", cached.id);
      return jsonOk({ product: cached, cached: true });
    }

    console.log("⚪ [2] Cache MISS, proceeding to lookup...");
    console.log("🔍 [3] Looking up product info...");
    const productInfo = await lookupProduct(jan);
    console.log("📦 [3] Product info result:", JSON.stringify(productInfo));

    if (!productInfo) {
      console.error("❌ [3] Product not found for JAN:", jan);
      return jsonError("Product not found for JAN: " + jan, 404);
    }
    console.log("✅ [3] Product found:", productInfo.name);

    console.log("🔍 [4] Extracting ingredients...");
    console.log(
      "📝 [4] Raw text:",
      (productInfo.ingredients_text ?? "").substring(0, 100) + "...",
    );
    const ingredientNames = await extractIngredients(
      productInfo.ingredients_text ?? "",
    );
    console.log("✅ [4] Extracted:", ingredientNames.length, "ingredients");
    console.log("📋 [4] First 5:", JSON.stringify(ingredientNames.slice(0, 5)));

    console.log("🔍 [5] Matching ingredients...");
    const matched = await matchIngredients(supabase, ingredientNames);
    console.log("✅ [5] Matched:", matched.length, "/", ingredientNames.length);

    console.log("🔍 [6] Computing vector...");
    const vector = await computeIngredientVector(supabase, matched);
    console.log(
      "✅ [6] Vector computed:",
      vector ? `dim=${vector.length}` : "null",
    );

    console.log("💾 [7] Saving to database...");
    console.log(
      "📝 [7] Insert data:",
      JSON.stringify({
        jan_code: jan,
        product_name: productInfo.name,
        brand: productInfo.brand,
        price_jpy: productInfo.price_jpy,
        has_vector: !!vector,
      }),
    );

    const { data: saved, error: saveError } = await supabase
      .from("products")
      .insert({
        jan_code: jan,
        product_name: productInfo.name,
        brand: productInfo.brand ?? null,
        price_jpy: productInfo.price_jpy ?? null,
        image_url: productInfo.image_url ?? null,
        source: productInfo.source,
        source_url: productInfo.source_url ?? null,
        raw_ingredient_text: productInfo.ingredients_text ?? null,
        ingredient_vector: vector,
      })
      .select()
      .single();

    if (saveError) {
      console.error("❌ [7] Save error:", JSON.stringify(saveError, null, 2));
      // 競合挿入 (duplicate key) の場合はDBから返す
      if (saveError.code === "23505") {
        console.log("⚪ [7] Duplicate key — fetching existing");
        const { data: fallback } = await supabase
          .from("products")
          .select("*")
          .eq("jan_code", jan)
          .single();
        return jsonOk({ product: fallback, cached: true });
      }
      throw saveError;
    }
    console.log("✅ [7] Product saved with ID:", saved.id);

    if (matched.length > 0) {
      console.log("💾 [8] Saving product_ingredients...");
      const links = matched.map((m, idx) => ({
        product_id: saved.id,
        ingredient_id: m.ingredient_id,
        position: idx + 1,
        matched_text: m.matched_text,
        match_confidence: m.confidence,
      }));
      console.log("📝 [8] Inserting", links.length, "links");
      const { error: linkError } = await supabase
        .from("product_ingredients")
        .insert(links);
      if (linkError) {
        console.error("❌ [8] Link error:", JSON.stringify(linkError));
        const minLinks = links.map(
          ({ product_id, ingredient_id, position }) => ({
            product_id,
            ingredient_id,
            position,
          }),
        );
        const { error: retryError } = await supabase
          .from("product_ingredients")
          .insert(minLinks);
        if (retryError)
          console.error("❌ [8] Retry link error:", JSON.stringify(retryError));
      } else {
        console.log("✅ [8] Links saved");
      }
    }

    console.log("🔍 [9] Fetching full product...");
    const { data: full, error: fetchError } = await supabase
      .from("products")
      .select(
        `
    id,
    jan_code,
    product_name,
    brand,
    price_jpy,
    image_url,
    raw_ingredient_text,
    source,
    source_url,
    created_at,
    product_ingredients (
      position,
      matched_text,
      match_confidence,
      ingredient:ingredients (
        id,
        inci_name,
        jp_name,
        function,
        weight_in_synergy
      )
    )
  `,
      )
      .eq("id", saved.id)
      .single();

    if (fetchError) {
      console.error("❌ [9] Fetch error:", JSON.stringify(fetchError));
      throw fetchError;
    }

    console.log("✅ [9] Full product fetched");
    console.log("🎉 [END] Success! Returning product:", full.id);
    console.log("═══════════════════════════════════════");

    return jsonOk({ product: full, cached: false });
  } catch (e) {
    console.error("═══════════════════════════════════════");
    console.error("💥 [ERROR] Fatal error occurred");
    console.error("Type:", e instanceof Error ? e.constructor.name : typeof e);
    console.error("Message:", e instanceof Error ? e.message : String(e));
    console.error("Stack:", e instanceof Error ? e.stack : "N/A");
    console.error("Full error:", JSON.stringify(e, null, 2));
    console.error("═══════════════════════════════════════");
    return jsonError(
      e instanceof Error ? e.message : "不明なエラーが発生しました",
      500,
    );
  }
});

function jsonOk(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
