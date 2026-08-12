import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import type { HairConcern, HairType, ProfileState, SkinConcern, SkinType } from "@/types";

interface ProfileRow {
  skin_type: SkinType | null;
  concerns: SkinConcern[];
  hair_type: HairType | null;
  hair_concerns: HairConcern[];
}

interface ProfileStore extends ProfileState {
  status: "idle" | "loading" | "ready" | "error";
  load: (userId: string) => Promise<void>;
  reset: () => void;
  setSkinType: (userId: string, t: SkinType) => void;
  toggleConcern: (userId: string, c: SkinConcern) => void;
  setHairType: (userId: string, t: HairType) => void;
  toggleHairConcern: (userId: string, c: HairConcern) => void;
}

async function persistProfile(userId: string, state: ProfileState) {
  await supabase.from("user_beauty_profiles").upsert(
    {
      user_id: userId,
      skin_type: state.skinType,
      concerns: state.concerns,
      hair_type: state.hairType,
      hair_concerns: state.hairConcerns,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  skinType: null,
  concerns: [],
  hairType: null,
  hairConcerns: [],
  status: "idle",
  load: async (userId) => {
    set({ status: "loading" });
    const { data, error } = await supabase
      .from("user_beauty_profiles")
      .select("skin_type, concerns, hair_type, hair_concerns")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      set({ status: "error" });
      return;
    }
    const row = data as ProfileRow | null;
    set({
      skinType: row?.skin_type ?? null,
      concerns: row?.concerns ?? [],
      hairType: row?.hair_type ?? null,
      hairConcerns: row?.hair_concerns ?? [],
      status: "ready",
    });
  },
  reset: () => set({ skinType: null, concerns: [], hairType: null, hairConcerns: [], status: "idle" }),
  setSkinType: (userId, t) => {
    set({ skinType: t });
    persistProfile(userId, { ...get(), skinType: t });
  },
  toggleConcern: (userId, c) => {
    const next = get().concerns.includes(c)
      ? get().concerns.filter((x) => x !== c)
      : [...get().concerns, c];
    set({ concerns: next });
    persistProfile(userId, { ...get(), concerns: next });
  },
  setHairType: (userId, t) => {
    set({ hairType: t });
    persistProfile(userId, { ...get(), hairType: t });
  },
  toggleHairConcern: (userId, c) => {
    const next = get().hairConcerns.includes(c)
      ? get().hairConcerns.filter((x) => x !== c)
      : [...get().hairConcerns, c];
    set({ hairConcerns: next });
    persistProfile(userId, { ...get(), hairConcerns: next });
  },
}));
