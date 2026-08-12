export type ActiveTag =
  | "retinol"
  | "vitaminC-pure"
  | "vitaminC-derivative"
  | "niacinamide"
  | "aha"
  | "bha"
  | "pha"
  | "uv-filter-chemical"
  | "uv-filter-mineral"
  | "hyaluronic-acid"
  | "ceramide"
  | "peptide"
  | "collagen"
  | "fragrance"
  | "alcohol-denat"
  | "silicone"
  | "mineral-oil"
  | "surfactant-high"
  | "surfactant-mild"
  | "uv-fragrance-free"
  | "oil-plant"
  | "panthenol"
  | "centella"
  | "tranexamic-acid"
  | "arbutin"
  | "azelaic-acid"
  | "glycerin"
  | "squalane"
  | "protein-hydrolyzed";

export type SkinType = "dry" | "oily" | "combination" | "sensitive" | "normal";
export type SkinConcern = "acne" | "aging" | "dullness" | "pigmentation" | "redness";
export type HairType = "dry" | "damaged" | "oily" | "fine";
export type HairConcern = "frizz" | "breakage" | "scalp" | "colorFade" | "volume";

export interface IngredientInfo {
  name: string;
  aliases: string[];
  category: string;
  description: string;
  good: 0 | 1 | 2 | 3;
  caution: 0 | 1 | 2 | 3;
  tags: ActiveTag[];
}

export type Grade = "S" | "A" | "B" | "C" | "D";

export interface MatchedIngredient {
  raw: string;
  info: IngredientInfo | null;
  matchType: "exact" | "partial" | "pattern" | "unknown";
  positionWeight: number;
}

export interface AnalysisResult {
  score: number;
  grade: Grade;
  label: string;
  gradeComment: string;
  honneComment: string;
  goodPoints: string[];
  cautionPoints: string[];
  matched: MatchedIngredient[];
  tags: ActiveTag[];
  personalNote?: string;
}

export type ProductCategory =
  | "lotion"
  | "milk"
  | "serum"
  | "cream"
  | "cleansing"
  | "facewash"
  | "sunscreen"
  | "sheetmask"
  | "shampoo"
  | "hairoil"
  | "hairmilk"
  | "hairmask";

export interface CostResult {
  unitPrice: number;
  benchmarkUnitPrice: number;
  ratio: number;
  tier: { title: string; description: string };
  brandFee: number;
  haagenDazsCount: number;
}

export type CompatLevel = "ng" | "caution" | "good";

export interface CompatRule {
  tagA: ActiveTag;
  tagB: ActiveTag;
  level: CompatLevel;
  title: string;
  reason: string;
  advice: string;
}

export type PouchCategory =
  | "lotion"
  | "milk"
  | "serum"
  | "cream"
  | "cleansing"
  | "facewash"
  | "sunscreen"
  | "shampoo"
  | "hairoil"
  | "hairmilk";

export interface PouchItem {
  id: string;
  name: string;
  category: PouchCategory;
  tags: ActiveTag[];
  createdAt: number;
}

export interface ProfileState {
  skinType: SkinType | null;
  concerns: SkinConcern[];
  hairType: HairType | null;
  hairConcerns: HairConcern[];
}

export interface ProductPick {
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  volume: number;
  tags: ActiveTag[];
  point: string;
  domain: "skin" | "hair";
  skinType?: SkinType[];
  skinConcern?: SkinConcern[];
  hairType?: HairType[];
  hairConcern?: HairConcern[];
}

export interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  uvIndex: number;
}

export interface WeatherAdvice {
  today: { headline: string; tips: string[] };
  week: WeatherDay[];
  lookahead: { title: string; detail: string }[];
}
