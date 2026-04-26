import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initError: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  initError: null,

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null, session: null })
  },

  initialize: async () => {
    set({ loading: true, initError: null })
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase getSession timeout (5s). URL or network error.')), 5000),
      )
      const { data: { session }, error } = await Promise.race([
        supabase.auth.getSession(),
        timeout,
      ])
      if (error) throw error
      set({ session, user: session?.user ?? null })

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null })
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      set({ initError: msg })
    } finally {
      set({ loading: false })
    }
  },
}))
