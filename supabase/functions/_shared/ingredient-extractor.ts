import { generateContent } from "./gemini.ts"

// 区切り文字で分割できる単純なリスト形式と判定するヒューリスティック
function isSimpleList(text: string): boolean {
  const delimiters = (text.match(/[,、・/]/g) ?? []).length
  const lines = text.split(/\n/).length
  // 区切り文字が多い or 改行が少ない → 単純なリスト形式
  return delimiters >= 2 || lines <= 2
}

function simpleSplit(text: string): string[] {
  return text
    .split(/[,、・／/\n]/)
    .map((s) => s.replace(/[()（）「」【】\s　]/g, "").trim())
    .filter((s) => s.length > 1)
}

export async function extractIngredients(rawText: string): Promise<string[]> {
  if (!rawText || rawText.trim().length < 5) return []

  // 単純なリスト形式はGemini不要
  if (isSimpleList(rawText)) {
    return simpleSplit(rawText)
  }

  // OCRテキストなど複雑な形式のみGeminiで構造化
  const prompt = `以下は化粧品の全成分表示テキストです。配合順を保ったまま、個別成分名のJSON配列として抽出してください。

ルール:
- 「,」「、」「・」「/」で区切られた成分を分離
- 括弧書きの注釈(例: 「(防腐剤)」「(着色剤)」)は除去
- 成分名はそのまま保持(正規化しない)
- 出力はJSON配列のみ。説明文・マークダウン不要

テキスト:
${rawText}

出力例: ["水", "グリセリン", "BG", "ヒアルロン酸Na"]`

  try {
    const response = await generateContent(prompt, { responseMimeType: "application/json" })
    const parsed: unknown = JSON.parse(response)
    if (!Array.isArray(parsed)) return simpleSplit(rawText)
    const result = parsed
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    return result.length > 0 ? result : simpleSplit(rawText)
  } catch {
    return simpleSplit(rawText)
  }
}
