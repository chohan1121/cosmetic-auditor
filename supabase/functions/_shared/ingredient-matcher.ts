import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export interface MatchedIngredient {
  ingredient_id: string
  matched_text: string
  confidence: "exact" | "alias" | "fuzzy" | "embedding"
}

interface IngredientMaster {
  id: string
  inci_name: string
  ja_name: string | null
  aliases: string[]
}

export async function matchIngredients(
  supabase: SupabaseClient,
  names: string[],
): Promise<MatchedIngredient[]> {
  if (names.length === 0) return []

  const { data: master, error } = await supabase
    .from("ingredients")
    .select("id, inci_name, ja_name, aliases")

  if (error || !master) return []

  const ingredients = master as IngredientMaster[]
  const results: MatchedIngredient[] = []

  for (const name of names) {
    const normalized = normalize(name)

    // 1. 完全一致 (ja_name, inci_name)
    let hit = ingredients.find(
      (m) =>
        normalize(m.ja_name ?? "") === normalized ||
        normalize(m.inci_name) === normalized,
    )
    if (hit) {
      results.push({ ingredient_id: hit.id, matched_text: name, confidence: "exact" })
      continue
    }

    // 2. aliases 一致
    hit = ingredients.find(
      (m) =>
        Array.isArray(m.aliases) &&
        m.aliases.some((a) => normalize(a) === normalized),
    )
    if (hit) {
      results.push({ ingredient_id: hit.id, matched_text: name, confidence: "alias" })
      continue
    }

    // 3. 部分一致 (4文字以上のみ、誤マッチ防止)
    if (normalized.length >= 4) {
      hit = ingredients.find((m) => {
        const jaName = normalize(m.ja_name ?? "")
        return (
          (jaName.length >= 4 && jaName.includes(normalized)) ||
          (normalized.length >= 4 && normalized.includes(jaName))
        )
      })
      if (hit) {
        results.push({ ingredient_id: hit.id, matched_text: name, confidence: "fuzzy" })
        continue
      }
    }

    // 4. embedding 類似度は Phase 1C で実装予定 → スキップ
  }

  return results
}

function normalize(s: string): string {
  return s
    .normalize("NFKC") // 全角→半角、カタカナ統一
    .toLowerCase()
    .replace(/[\s　・,、・/]/g, "") // 区切り文字除去
    .replace(/[()（）「」【】]/g, "") // 括弧除去
}
