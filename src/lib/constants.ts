import type { PouchCategory } from "@/types";

/** マイポーチで選べるカテゴリ(PouchPage・ScanPageで共有)。 */
export const pouchCategoryOptions: { value: PouchCategory; label: string }[] = [
  { value: "lotion", label: "化粧水" },
  { value: "milk", label: "乳液" },
  { value: "serum", label: "美容液" },
  { value: "cream", label: "クリーム" },
  { value: "cleansing", label: "クレンジング" },
  { value: "facewash", label: "洗顔料" },
  { value: "sunscreen", label: "日焼け止め" },
  { value: "shampoo", label: "シャンプー" },
  { value: "hairoil", label: "ヘアオイル" },
  { value: "hairmilk", label: "ヘアミルク" },
];
