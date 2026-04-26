import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { generateEmbedding } from "../_shared/gemini.ts"

interface RequestBody {
  ingredient_id?: string
  batch_all_missing?: boolean
  limit?: number
}

interface IngredientRow {
  id: string
  inci_name: string
  ja_name: string | null
  category: string | null
  functions: string[] | null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const body: RequestBody = await req.json()

    let targets: IngredientRow[] = []

    if (body.ingredient_id) {
      const { data, error } = await supabaseAdmin
        .from("ingredients")
        .select("id, inci_name, ja_name, category, functions")
        .eq("id", body.ingredient_id)
        .single()
      if (error) throw error
      targets = [data]
    } else if (body.batch_all_missing) {
      let query = supabaseAdmin
        .from("ingredients")
        .select("id, inci_name, ja_name, category, functions")
        .is("embedding", null)
      if (body.limit) query = query.limit(body.limit)
      const { data, error } = await query
      if (error) throw error
      targets = data ?? []
    } else {
      throw new Error("Either ingredient_id or batch_all_missing must be provided")
    }

    const results: { id: string; success: boolean; error?: string }[] = []

    for (const target of targets) {
      try {
        const functionsText = (target.functions ?? []).join(", ")
        const text = `Cosmetic ingredient: ${target.inci_name} (${target.ja_name ?? ""}). Category: ${target.category ?? "unknown"}. Functions: ${functionsText}.`

        const embedding = await generateEmbedding(text)

        const { error: updateError } = await supabaseAdmin
          .from("ingredients")
          .update({ embedding: `[${embedding.join(",")}]` })
          .eq("id", target.id)

        if (updateError) throw updateError

        results.push({ id: target.id, success: true })
      } catch (e) {
        results.push({
          id: target.id,
          success: false,
          error: e instanceof Error ? e.message : String(e)
        })
      }

      // Gemini無料枠レート制限対策 (15 req/min)
      await new Promise(r => setTimeout(r, 5000))
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
