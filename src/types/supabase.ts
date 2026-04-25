// このファイルは `npx supabase gen types typescript --local > src/types/supabase.ts` で自動生成します
// 初期スキーマに合わせた手動定義 (マイグレーション適用後に上書き推奨)

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
      products: {
        Row: {
          id: string
          created_at: string
          jan_code: string | null
          name: string
          brand: string | null
          category: string | null
          price_jpy: number | null
          image_url: string | null
          amazon_url: string | null
          raw_ingredient_text: string | null
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      ingredients: {
        Row: {
          id: string
          inci_name: string
          ja_name: string | null
          functions: string[]
          safety_score: number | null
          irritation_risk: 'low' | 'medium' | 'high' | null
          embedding: string | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['ingredients']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['ingredients']['Insert']>
      }
      product_ingredients: {
        Row: {
          product_id: string
          ingredient_id: string
          position: number
          concentration_pct: number | null
        }
        Insert: Database['public']['Tables']['product_ingredients']['Row']
        Update: Partial<Database['public']['Tables']['product_ingredients']['Insert']>
      }
      user_closet: {
        Row: {
          id: string
          user_id: string
          product_id: string
          added_at: string
          is_active: boolean
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['user_closet']['Row'], 'id' | 'added_at'>
        Update: Partial<Database['public']['Tables']['user_closet']['Insert']>
      }
      generic_matches: {
        Row: {
          id: string
          source_product_id: string
          match_product_id: string
          similarity_score: number
          price_ratio: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['generic_matches']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['generic_matches']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      irritation_risk: 'low' | 'medium' | 'high'
    }
  }
}
