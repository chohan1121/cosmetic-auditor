import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import type { PouchItem } from "@/types";

interface PouchRow {
  id: string;
  name: string;
  category: PouchItem["category"];
  tags: PouchItem["tags"];
  created_at: string;
}

interface PouchStore {
  items: PouchItem[];
  status: "idle" | "loading" | "ready" | "error";
  load: (userId: string) => Promise<void>;
  reset: () => void;
  addItem: (userId: string, item: Omit<PouchItem, "id" | "createdAt">) => Promise<boolean>;
  removeItem: (id: string) => Promise<boolean>;
}

export const usePouchStore = create<PouchStore>((set) => ({
  items: [],
  status: "idle",
  load: async (userId) => {
    set({ status: "loading" });
    const { data, error } = await supabase
      .from("user_pouch_items")
      .select("id, name, category, tags, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) {
      set({ status: "error" });
      return;
    }
    const items: PouchItem[] = (data as PouchRow[]).map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      tags: r.tags ?? [],
      createdAt: new Date(r.created_at).getTime(),
    }));
    set({ items, status: "ready" });
  },
  reset: () => set({ items: [], status: "idle" }),
  addItem: async (userId, item) => {
    const { data, error } = await supabase
      .from("user_pouch_items")
      .insert({ user_id: userId, name: item.name, category: item.category, tags: item.tags })
      .select("id, name, category, tags, created_at")
      .single();
    if (error || !data) return false;
    const row = data as PouchRow;
    set((state) => ({
      items: [
        ...state.items,
        {
          id: row.id,
          name: row.name,
          category: row.category,
          tags: row.tags ?? [],
          createdAt: new Date(row.created_at).getTime(),
        },
      ],
    }));
    return true;
  },
  removeItem: async (id) => {
    const { error } = await supabase.from("user_pouch_items").delete().eq("id", id);
    if (error) return false;
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    return true;
  },
}));
