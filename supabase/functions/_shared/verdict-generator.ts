// verdict-generator.ts
// 商品の総合評価を生成するモジュール

import { generateContent } from "./gemini.ts";

interface IngredientInfo {
  ingredient_id: string;
  matched_text: string;
  confidence: string;
  ingredient_data: {
    inci_name: string;
    jp_name: string | null;
    function: string[];
    weight_in_synergy: number;
  };
}

interface VerdictResult {
  verdict_text: string;
  overall_score: number;
  safety_score: number;
  efficacy_score: number;
  value_score: number;
}

export async function generateVerdict(
  productName: string,
  brand: string | null,
  priceJpy: number | null,
  matchedIngredients: IngredientInfo[],
): Promise<VerdictResult> {
  // 成分リストを整形
  const ingredientsList =
    matchedIngredients.length > 0
      ? matchedIngredients
          .map((m, idx) => {
            const name =
              m.ingredient_data.jp_name || m.ingredient_data.inci_name;
            const functions = m.ingredient_data.function.join(", ");
            const weight = m.ingredient_data.weight_in_synergy;
            return `${idx + 1}. ${name} (${functions}) [重要度: ${weight}]`;
          })
          .join("\n")
      : "成分情報なし（成分データベースに未登録の成分のみ、または成分表記なし）";

  const prompt = `あなたは化粧品成分の専門家です。以下の商品について、忖度なしの正直な総合評価を日本語で生成してください。

# 商品情報
- 商品名: ${productName}
${brand ? `- ブランド: ${brand}` : ""}
${priceJpy ? `- 価格: ¥${priceJpy.toLocaleString()}` : ""}

# 配合成分（上位から）
${ingredientsList}

# 評価基準
1. **安全性**: 肌刺激性、アレルギーリスク、長期使用の安全性
2. **効果**: 成分の科学的根拠、配合バランス、期待される効果
3. **コスパ**: 価格に対する成分の質、他製品との比較

# 指示
- **正直に** 評価してください。良い点も悪い点もはっきり述べる。
- 成分情報がない場合は、商品名・ブランド・価格帯から推測して評価。
- 誇張せず、科学的根拠に基づいて判断。
- 「まあまあ」「悪くない」などの曖昧表現OK。完璧な商品は稀。
- 3-5文程度で簡潔に。箇条書きNG。
- 必ず最後に10点満点のスコアを以下の形式で出力してください:

スコア: 総合=X, 安全性=Y, 効果=Z, コスパ=W

例:
「保湿成分は充実してるけど、この価格でこの成分構成は正直微妙。似たような製品が半額で買える。アレルギーリスクは低いから安全性は悪くないが、コスパ考えたらリピートはないかな。スコア: 総合=5, 安全性=7, 効果=6, コスパ=3」

では、評価を生成してください。`;

  console.log("🎯 [Verdict] Generating verdict for:", productName);

  const response = await generateContent(prompt);

  console.log("📝 [Verdict] Raw response:", response);

  // スコアを抽出（改善版: 順序に依存しない）
  const extractScore = (label: string): number => {
    const pattern = new RegExp(`${label}[=＝]\\s*([\\d０-９]+)`, "i");
    const match = response.match(pattern);
    if (match) {
      // 全角数字を半角に変換
      const numStr = match[1].replace(/[０-９]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xfee0),
      );
      return parseInt(numStr);
    }
    return 5; // デフォルト値
  };

  const overall = extractScore("総合");
  const safety = extractScore("安全性");
  const efficacy = extractScore("効果");
  const value = extractScore("コスパ");

  // スコア部分を除去したテキスト
  const verdictText = response.replace(/スコア[:：].*$/m, "").trim();

  console.log("✅ [Verdict] Parsed:", {
    overall,
    safety,
    efficacy,
    value,
    text_length: verdictText.length,
  });

  return {
    verdict_text: verdictText,
    overall_score: overall,
    safety_score: safety,
    efficacy_score: efficacy,
    value_score: value,
  };
}
