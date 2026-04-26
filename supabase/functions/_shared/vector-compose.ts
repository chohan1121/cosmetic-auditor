import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import type { MatchedIngredient } from "./ingredient-matcher.ts"

const VECTOR_DIM = 768

interface IngredientWithEmbedding {
  id: string
  embedding: unknown
  weight_in_synergy: number | null
}

export async function computeIngredientVector(
  supabase: SupabaseClient,
  matched: MatchedIngredient[],
): Promise<string | null> {
  if (matched.length === 0) return null

  const ids = matched.map((m) => m.ingredient_id)
  const { data, error } = await supabase
    .from("ingredients")
    .select("id, embedding, weight_in_synergy")
    .in("id", ids)

  if (error || !data) return null

  const map = new Map(
    (data as IngredientWithEmbedding[]).map((d) => [d.id, d]),
  )

  const summed = new Array<number>(VECTOR_DIM).fill(0)
  let totalWeight = 0

  matched.forEach((m, idx) => {
    const ing = map.get(m.ingredient_id)
    if (!ing?.embedding) return

    const emb = parseEmbedding(ing.embedding)
    if (!emb || emb.length !== VECTOR_DIM) return

    // 配合順減衰 × シナジー重み
    const positionWeight = Math.exp(-idx / 10)
    const synergyWeight = Number(ing.weight_in_synergy ?? 1.0)
    const weight = positionWeight * synergyWeight

    for (let i = 0; i < VECTOR_DIM; i++) {
      summed[i] += emb[i] * weight
    }
    totalWeight += weight
  })

  if (totalWeight === 0) return null

  // 平均化 + L2 正規化
  const avg = summed.map((v) => v / totalWeight)
  const norm = Math.sqrt(avg.reduce((s, v) => s + v * v, 0))
  const normalized = norm > 0 ? avg.map((v) => v / norm) : avg

  return `[${normalized.join(",")}]`
}

function parseEmbedding(raw: unknown): number[] | null {
  if (Array.isArray(raw)) return (raw as unknown[]).map(Number)
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) return (parsed as unknown[]).map(Number)
    } catch {
      return null
    }
  }
  return null
}
