import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!rawUrl || !anonKey) {
  throw new Error(
    "Supabase の環境変数が設定されていません。VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY を確認してください。"
  );
}

const baseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");

export const supabase = createClient(baseUrl, anonKey);
