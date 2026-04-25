const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

export interface GeminiTextRequest {
  prompt: string
  model?: string
}

export interface GeminiVisionRequest {
  prompt: string
  imageBase64: string
  mimeType?: string
  model?: string
}

export async function geminiText({ prompt, model = 'gemini-1.5-flash' }: GeminiTextRequest): Promise<string> {
  const res = await fetch(
    `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  )
  if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function geminiVision({
  prompt,
  imageBase64,
  mimeType = 'image/jpeg',
  model = 'gemini-1.5-flash',
}: GeminiVisionRequest): Promise<string> {
  const res = await fetch(
    `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
      }),
    },
  )
  if (!res.ok) throw new Error(`Gemini Vision API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}
