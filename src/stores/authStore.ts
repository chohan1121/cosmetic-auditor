import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface AuthState {
  session: Session | null;
  user: User | null;
  status: "loading" | "ready";
  magicLinkSent: boolean;
  error: string | null;
  init: () => void;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetMagicLinkSent: () => void;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  status: "loading",
  magicLinkSent: false,
  error: null,
  init: () => {
    if (initialized) return;
    initialized = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        set({ session: data.session, user: data.session?.user ?? null, status: "ready" });
      })
      .catch(() => {
        // セッション取得に失敗しても未ログイン状態として先に進める(各ページがログイン画面を表示する)
        set({ session: null, user: null, status: "ready" });
      });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, status: "ready" });
    });
  },
  signInWithEmail: async (email) => {
    set({ error: null });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) set({ error: error.message });
    else set({ magicLinkSent: true });
  },
  signOut: async () => {
    await supabase.auth.signOut();
  },
  resetMagicLinkSent: () => set({ magicLinkSent: false, error: null }),
}));
