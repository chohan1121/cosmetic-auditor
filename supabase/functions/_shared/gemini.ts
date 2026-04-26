const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set")

export async function generateEmbedding(text: string): Promise<number[]> {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=" + GEMINI_API_KEY

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: {
        parts: [{ text }]
      },
      taskType: "SEMANTIC_SIMILARITY",
      outputDimensionality: 768
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error("Gemini embedding API error: " + response.status + " " + errorText)
  }

  const data = await response.json()
  if (!data.embedding?.values || data.embedding.values.length !== 768) {
    throw new Error("Invalid embedding response shape")
  }

  return data.embedding.values
}

export async function generateContent(
  prompt: string,
  options?: { responseMimeType?: string },
): Promise<string> {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
    GEMINI_API_KEY

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  }
  if (options?.responseMimeType) {
    body.generationConfig = { responseMimeType: options.responseMimeType }
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error("Gemini content API error: " + response.status + " " + errorText)
  }

  const data = await response.json()
  const text: unknown = data.candidates?.[0]?.content?.parts?.[0]?.text
  return typeof text === "string" ? text : ""
}
