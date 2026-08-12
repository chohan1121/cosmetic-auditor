import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import type { ActiveTag, CompatLevel, IngredientInfo, ProductCategory, ProductPick } from "@/types";
import type { CompatRule } from "@/types";

interface IngredientRow {
  name: string;
  aliases: string[];
  category: string;
  description: string;
  good: 0 | 1 | 2 | 3;
  caution: 0 | 1 | 2 | 3;
  tags: ActiveTag[];
}

interface CompatRuleRow {
  tag_a: ActiveTag;
  tag_b: ActiveTag;
  level: CompatLevel;
  title: string;
  reason: string;
  advice: string;
}

interface ProductRow {
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  volume: number;
  tags: ActiveTag[];
  point: string;
  domain: "skin" | "hair";
  skin_type: string[];
  skin_concern: string[];
  hair_type: string[];
  hair_concern: string[];
}

interface BenchmarkRow {
  category: ProductCategory;
  label: string;
  unit_price: number;
}

interface MasterDataState {
  ingredients: IngredientInfo[];
  compatRules: CompatRule[];
  products: ProductPick[];
  benchmarkUnitPrice: Partial<Record<ProductCategory, number>>;
  categoryLabels: Partial<Record<ProductCategory, string>>;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  load: () => Promise<void>;
}

export const useMasterDataStore = create<MasterDataState>((set, get) => ({
  ingredients: [],
  compatRules: [],
  products: [],
  benchmarkUnitPrice: {},
  categoryLabels: {},
  status: "idle",
  error: null,
  load: async () => {
    if (get().status === "loading" || get().status === "ready") return;
    set({ status: "loading", error: null });
    try {
      const [ingredientsRes, compatRulesRes, productsRes, benchmarksRes] = await Promise.all([
        supabase.from("ingredients").select("name, aliases, category, description, good, caution, tags"),
        supabase.from("compat_rules").select("tag_a, tag_b, level, title, reason, advice"),
        supabase
          .from("products")
          .select("name, brand, category, price, volume, tags, point, domain, skin_type, skin_concern, hair_type, hair_concern"),
        supabase.from("benchmarks").select("category, label, unit_price"),
      ]);

      for (const res of [ingredientsRes, compatRulesRes, productsRes, benchmarksRes]) {
        if (res.error) throw new Error(res.error.message);
      }

      const ingredients: IngredientInfo[] = (ingredientsRes.data as IngredientRow[]).map((r) => ({
        name: r.name,
        aliases: r.aliases ?? [],
        category: r.category,
        description: r.description,
        good: r.good,
        caution: r.caution,
        tags: r.tags ?? [],
      }));

      const compatRules: CompatRule[] = (compatRulesRes.data as CompatRuleRow[]).map((r) => ({
        tagA: r.tag_a,
        tagB: r.tag_b,
        level: r.level,
        title: r.title,
        reason: r.reason,
        advice: r.advice,
      }));

      const products: ProductPick[] = (productsRes.data as ProductRow[]).map((r) => ({
        name: r.name,
        brand: r.brand,
        category: r.category,
        price: r.price,
        volume: r.volume,
        tags: r.tags ?? [],
        point: r.point,
        domain: r.domain,
        skinType: (r.skin_type ?? []) as ProductPick["skinType"],
        skinConcern: (r.skin_concern ?? []) as ProductPick["skinConcern"],
        hairType: (r.hair_type ?? []) as ProductPick["hairType"],
        hairConcern: (r.hair_concern ?? []) as ProductPick["hairConcern"],
      }));

      const benchmarkUnitPrice: Partial<Record<ProductCategory, number>> = {};
      const categoryLabels: Partial<Record<ProductCategory, string>> = {};
      (benchmarksRes.data as BenchmarkRow[]).forEach((r) => {
        benchmarkUnitPrice[r.category] = r.unit_price;
        categoryLabels[r.category] = r.label;
      });

      set({ ingredients, compatRules, products, benchmarkUnitPrice, categoryLabels, status: "ready" });
    } catch (e) {
      set({ status: "error", error: e instanceof Error ? e.message : "マスターデータの取得に失敗しました" });
    }
  },
}));
