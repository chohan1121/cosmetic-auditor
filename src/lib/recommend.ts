import type { ActiveTag, HairConcern, HairType, ProductCategory, ProductPick, SkinConcern, SkinType } from "@/types";

/**
 * 成分タグ配列からジェネリック(プチプラ代替)候補を抽出する。
 * タグ一致数 + 同カテゴリ加点(0.5)でスコアリングし上位N件を返す。
 */
export function findGenericPicks(
  tags: ActiveTag[],
  products: ProductPick[],
  category?: ProductCategory,
  domain?: "skin" | "hair",
  limit = 4
): ProductPick[] {
  const scored = products
    .filter((p) => !domain || p.domain === domain)
    .map((p) => {
      const tagMatches = p.tags.filter((t) => tags.includes(t)).length;
      const categoryBonus = category && p.category === category ? 0.5 : 0;
      let score = tagMatches + categoryBonus;
      // 髪ドメインはタグが薄いため、カテゴリ一致のみでも候補に含める
      if (domain === "hair" && tagMatches === 0 && categoryBonus > 0) score = 0.5;
      return { product: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.product);
}

export function findProfilePicks(
  products: ProductPick[],
  category: ProductCategory,
  skinType: SkinType | null,
  concerns: SkinConcern[]
): ProductPick[] {
  return products
    .filter((p) => p.category === category && p.domain === "skin")
    .map((p) => {
      let score = 0;
      if (skinType && p.skinType?.includes(skinType)) score += 2;
      score += p.skinConcern?.filter((c) => concerns.includes(c)).length ?? 0;
      return { product: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((s) => s.product);
}

export function findHairPicks(
  products: ProductPick[],
  category: ProductCategory,
  hairType: HairType | null,
  concerns: HairConcern[]
): ProductPick[] {
  return products
    .filter((p) => p.category === category && p.domain === "hair")
    .map((p) => {
      let score = 0;
      if (hairType && p.hairType?.includes(hairType)) score += 2;
      score += p.hairConcern?.filter((c) => concerns.includes(c)).length ?? 0;
      return { product: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((s) => s.product);
}
