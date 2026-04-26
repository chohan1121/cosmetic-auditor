import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z
    .string()
    .url('VITE_SUPABASE_URL は有効なURLである必要があります')
    .refine((url) => url.includes('.supabase.co'), {
      message: 'VITE_SUPABASE_URL は .supabase.co を含む必要があります',
    })
    .transform((url) =>
      url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, ''),
    ),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(100, 'VITE_SUPABASE_ANON_KEY は最低100文字必要です'),
  VITE_OPENWEATHER_API_KEY: z
    .string()
    .min(32, 'VITE_OPENWEATHER_API_KEY は最低32文字必要です'),
})

const result = envSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_OPENWEATHER_API_KEY: import.meta.env.VITE_OPENWEATHER_API_KEY,
})

if (!result.success) {
  const message = result.error.issues
    .map((issue) => `  [${issue.path.join('.')}] ${issue.message}`)
    .join('\n')
  throw new Error(`環境変数の検証に失敗しました:\n${message}`)
}

export const env = result.data
