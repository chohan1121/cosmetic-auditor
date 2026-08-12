import type { AnalysisResult, ActiveTag, Grade, IngredientInfo, MatchedIngredient, ProfileState } from "@/types";

/** 成分表テキストをトークン配列に分割する。 */
export function tokenize(raw: string): string[] {
  let text = raw.trim();
  // 「成分:」「成分表示:」等の接頭辞を除去
  text = text.replace(/^(全成分|成分表示|成分)\s*[:：]?\s*/u, "");
  // 全角記号・英数字を半角化
  text = text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
  text = text.replace(/、/g, ",").replace(/\n/g, ",");

  return text
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function buildDictionaryIndex(ingredients: IngredientInfo[]): { name: string; info: IngredientInfo }[] {
  const index: { name: string; info: IngredientInfo }[] = [];
  for (const info of ingredients) {
    index.push({ name: info.name, info });
    for (const alias of info.aliases) {
      index.push({ name: alias, info });
    }
  }
  return index;
}

let cachedIngredients: IngredientInfo[] | null = null;
let cachedIndex: { name: string; info: IngredientInfo }[] = [];

/** ingredients配列の参照が変わらない限り(masterDataStoreは読み込み後に安定参照)、辞書indexの再構築を省く。 */
export function getDictionaryIndex(ingredients: IngredientInfo[]): { name: string; info: IngredientInfo }[] {
  if (ingredients !== cachedIngredients) {
    cachedIngredients = ingredients;
    cachedIndex = buildDictionaryIndex(ingredients);
  }
  return cachedIndex;
}

interface PatternRule {
  test: RegExp;
  good: 0 | 1 | 2 | 3;
  caution: 0 | 1 | 2 | 3;
  tags: ActiveTag[];
  label: string;
}

/** 辞書にない成分名を語尾パターンから推定するフォールバックルール(8種)。 */
const patternRules: PatternRule[] = [
  { test: /エキス$/u, good: 1, caution: 0, tags: [], label: "植物・生体エキス系(推定)" },
  { test: /(油|オイル)$/u, good: 1, caution: 0, tags: ["oil-plant"], label: "オイル系(推定)" },
  { test: /(酸Na|酸ナトリウム)$/u, good: 0, caution: 1, tags: [], label: "酸の塩・洗浄/pH調整系(推定)" },
  { test: /アルコール$/u, good: 0, caution: 1, tags: [], label: "アルコール系(推定)" },
  { test: /パラベン$/u, good: 0, caution: 1, tags: [], label: "防腐剤系(推定)" },
  { test: /ペプチド$/u, good: 2, caution: 0, tags: ["peptide"], label: "ペプチド系(推定)" },
  { test: /^PEG-?\d*/u, good: 0, caution: 0, tags: [], label: "合成基剤系(推定)" },
  { test: /(コーン|シロキサン)$/u, good: 0, caution: 0, tags: ["silicone"], label: "シリコン系(推定)" },
];

export function matchToken(
  raw: string,
  dictionaryIndex: { name: string; info: IngredientInfo }[]
): MatchedIngredient {
  const cleaned = raw.replace(/[()（）%0-9.]/g, "").trim() || raw;

  // 1. 完全一致
  const exact = dictionaryIndex.find((d) => d.name === raw || d.name === cleaned);
  if (exact) {
    return { raw, info: exact.info, matchType: "exact", positionWeight: 1 };
  }

  // 2. 部分一致(3文字以上)
  if (cleaned.length >= 3) {
    const partial = dictionaryIndex.find(
      (d) => d.name.length >= 3 && (cleaned.includes(d.name) || d.name.includes(cleaned))
    );
    if (partial) {
      return { raw, info: partial.info, matchType: "partial", positionWeight: 1 };
    }
  }

  // 3. パターン推定
  for (const rule of patternRules) {
    if (rule.test.test(cleaned)) {
      const info: IngredientInfo = {
        name: raw,
        aliases: [],
        category: "推定",
        description: rule.label,
        good: rule.good,
        caution: rule.caution,
        tags: rule.tags,
      };
      return { raw, info, matchType: "pattern", positionWeight: 1 };
    }
  }

  return { raw, info: null, matchType: "unknown", positionWeight: 1 };
}

function gradeOf(score: number): { grade: Grade; label: string; comment: string } {
  if (score >= 85) return { grade: "S", label: "実力派", comment: "広告抜きで良い処方。" };
  if (score >= 70) return { grade: "A", label: "優等生", comment: "しっかり中身のある処方。" };
  if (score >= 55) return { grade: "B", label: "堅実", comment: "派手さはないけど悪くない。" };
  if (score >= 40) return { grade: "C", label: "雰囲気重視", comment: "中身より使用感・イメージ寄り。" };
  return { grade: "D", label: "広告の勝利", comment: "その価格、イメージ料かも。" };
}

const skinTypeNote: Record<string, string> = {
  dry: "乾燥肌向けには保湿・バリア系(セラミド/ヒアルロン酸)の有無をチェック。",
  oily: "脂性肌向けにはナイアシンアミドやBHAなど皮脂・毛穴系成分の有無に注目。",
  combination: "混合肌には部位ごとの使い分けがしやすい処方かがポイント。",
  sensitive: "敏感肌には香料・アルコール・強い酸の有無を優先してチェック。",
  normal: "普通肌なら幅広い成分を許容できるが、刺激成分の重ねすぎには注意。",
};

export function analyzeIngredients(
  rawText: string,
  ingredients: IngredientInfo[],
  profile?: ProfileState | null
): AnalysisResult {
  const dictionaryIndex = getDictionaryIndex(ingredients);
  const tokens = tokenize(rawText);
  const matched = tokens.map((t) => matchToken(t, dictionaryIndex));

  const n = matched.length || 1;
  let weightedGood = 0;
  let weightedCaution = 0;
  const tagSet = new Set<ActiveTag>();
  const goodPoints: string[] = [];
  const cautionPoints: string[] = [];

  matched.forEach((m, i) => {
    const weight = i < n / 3 ? 1.0 : i < (2 * n) / 3 ? 0.7 : 0.4;
    m.positionWeight = weight;
    if (!m.info) return;
    weightedGood += m.info.good * weight;
    weightedCaution += m.info.caution * weight;
    m.info.tags.forEach((t) => tagSet.add(t));

    if (m.info.good >= 2 && !goodPoints.some((g) => g.includes(m.info!.name))) {
      goodPoints.push(`${m.info.name}: ${m.info.description}`);
    }
    if (m.info.caution >= 2 && !cautionPoints.some((c) => c.includes(m.info!.name))) {
      cautionPoints.push(`${m.info.name}: ${m.info.description}`);
    }
  });

  const rawScore = 38 + weightedGood * 4 - weightedCaution * 4;
  const score = Math.round(Math.min(98, Math.max(5, rawScore)));
  const { grade, label, comment: gradeComment } = gradeOf(score);

  const unknownCount = matched.filter((m) => m.matchType === "unknown").length;
  const knownRatio = 1 - unknownCount / n;

  let honneComment: string;
  if (score >= 85) {
    honneComment = "配合順の前半に実力派成分がしっかり並んでいる。広告文句なしでも評価できる中身。";
  } else if (score >= 70) {
    honneComment = "実力派成分が要所に配合されている。価格に見合う中身と言えそう。";
  } else if (score >= 55) {
    honneComment = "突出した実力派はないが、大きな刺激懸念もない堅実な処方。";
  } else if (score >= 40) {
    honneComment = "使用感を整える成分が中心で、実力を裏付ける成分は控えめ。パッケージの印象で選ばない方がいい。";
  } else {
    honneComment = "配合順の前半に刺激懸念のある成分が目立つ、または実力派成分がほぼ見当たらない。価格の大半はイメージ料の可能性。";
  }
  if (knownRatio < 0.5) {
    honneComment += "(辞書未収載の成分が多く、判定は参考値にとどまる)";
  }

  let personalNote: string | undefined;
  if (profile?.skinType) {
    personalNote = skinTypeNote[profile.skinType];
    const hasCeramide = tagSet.has("ceramide");
    const hasNiacinamide = tagSet.has("niacinamide");
    if (profile.skinType === "dry" && hasCeramide) {
      personalNote += " このアイテムはセラミド系配合であなたの肌質と好相性。";
    }
    if (profile.concerns?.includes("acne") && hasNiacinamide) {
      personalNote += " ナイアシンアミド配合で、気になっているニキビ・毛穴ケアにも寄与しそう。";
    }
  }

  return {
    score,
    grade,
    label,
    gradeComment,
    honneComment,
    goodPoints: goodPoints.slice(0, 5),
    cautionPoints: cautionPoints.slice(0, 5),
    matched,
    tags: Array.from(tagSet),
    personalNote,
  };
}

export const sampleIngredientTexts = [
  "水, グリセリン, ナイアシンアミド, セラミドNP, ヒアルロン酸Na, パンテノール, ツボクサエキス, フェノキシエタノール",
  "水, エタノール, 香料, BG, アスコルビン酸, トコフェロール, クエン酸",
  "水, グリセリン, ラウリル硫酸Na, 香料, エタノール, パラベン",
  "水, レチノール, スクワラン, ツボクサエキス, セラミドAP, パンテノール, グリセリン",
  "水, BG, グリセリン, ミネラルオイル, ジメチコン, 香料, フェノキシエタノール",
];
