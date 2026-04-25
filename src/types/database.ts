// ⚠️ このファイルは自動生成されます。手動編集しないでください。
// 生成コマンド:
//   npx supabase gen types typescript --project-id eezdhtbjnodfnraskjko --schema public > src/types/database.ts
//
// 現在は暫定プレースホルダーです。Supabase CLI ログイン後に上書きしてください。

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
