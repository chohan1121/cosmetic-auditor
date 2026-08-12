import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Moon, Sun, Sparkles, Trash2, CircleAlert, Ban, ThumbsUp } from "lucide-react";
import { Card, PageHeader } from "@/components/common/Card";
import { LoginPrompt } from "@/components/common/LoginPrompt";
import { Link } from "react-router-dom";
import { getDictionaryIndex, matchToken, tokenize } from "@/lib/analyze";
import { buildRoutine, checkPouchCompat } from "@/lib/compat";
import { findGenericPicks } from "@/lib/recommend";
import { pouchCategoryOptions as categoryOptions } from "@/lib/constants";
import { usePouchStore } from "@/stores/pouchStore";
import { useMasterDataStore } from "@/stores/masterDataStore";
import { useAuthStore } from "@/stores/authStore";
import type { ActiveTag, PouchCategory } from "@/types";

const quickTags: { value: ActiveTag; label: string }[] = [
  { value: "retinol", label: "レチノール" },
  { value: "aha", label: "AHA" },
  { value: "bha", label: "BHA" },
  { value: "vitaminC-pure", label: "ピュアビタミンC" },
  { value: "vitaminC-derivative", label: "ビタミンC誘導体" },
  { value: "niacinamide", label: "ナイアシンアミド" },
  { value: "alcohol-denat", label: "アルコール" },
  { value: "ceramide", label: "セラミド" },
  { value: "hyaluronic-acid", label: "ヒアルロン酸" },
  { value: "azelaic-acid", label: "アゼライン酸" },
  { value: "centella", label: "ツボクサ" },
  { value: "tranexamic-acid", label: "トラネキサム酸" },
];

const levelStyle = {
  ng: { icon: Ban, bg: "bg-danger/10", text: "text-danger" },
  caution: { icon: CircleAlert, bg: "bg-warning/10", text: "text-warning" },
  good: { icon: ThumbsUp, bg: "bg-success/10", text: "text-success" },
};

export default function PouchPage() {
  const { items, status: pouchStatus, load, addItem, removeItem } = usePouchStore();
  const { ingredients, products, compatRules } = useMasterDataStore();
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PouchCategory>("lotion");
  const [tags, setTags] = useState<ActiveTag[]>([]);
  const [ingredientText, setIngredientText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (user) load(user.id);
  }, [user, load]);

  const toggleTag = (t: ActiveTag) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const detectFromText = () => {
    if (!ingredientText.trim()) return;
    const dictionaryIndex = getDictionaryIndex(ingredients);
    const detected = new Set<ActiveTag>();
    tokenize(ingredientText).forEach((tok) => {
      const m = matchToken(tok, dictionaryIndex);
      m.info?.tags.forEach((t) => detected.add(t));
    });
    setTags(Array.from(detected));
  };

  const handleAdd = async () => {
    if (!name.trim() || !user) return;
    setActionError("");
    const ok = await addItem(user.id, { name, category, tags });
    if (!ok) {
      setActionError("登録に失敗しました。通信状況を確認してもう一度お試しください。");
      return;
    }
    setName("");
    setTags([]);
    setIngredientText("");
  };

  const handleRemove = async (id: string) => {
    setActionError("");
    const ok = await removeItem(id);
    if (!ok) setActionError("削除に失敗しました。通信状況を確認してもう一度お試しください。");
  };

  const compatCards = checkPouchCompat(items, compatRules);
  const routine = buildRoutine(items);

  if (!user) {
    return (
      <div>
        <PageHeader title="マイポーチ" subtitle="手持ちコスメの相性をまとめてチェック" />
        <LoginPrompt description="マイポーチはアカウントに紐付けて保存されます。ログインすると端末をまたいで同期されます。" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="マイポーチ" subtitle="手持ちコスメの相性をまとめてチェック" />
      {pouchStatus === "loading" && (
        <p className="mb-3 text-xs text-label-secondary">読み込み中...</p>
      )}

      <Card>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="アイテム名(例: 薬用美白化粧水)"
          className="mb-3 w-full rounded-md bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as PouchCategory)}
          className="mb-3 w-full rounded-md bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-accent"
        >
          {categoryOptions.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <textarea
          value={ingredientText}
          onChange={(e) => setIngredientText(e.target.value)}
          placeholder="成分表を貼り付けると自動でタグ判定(任意)"
          rows={2}
          className="mb-2 w-full resize-none rounded-md bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          onClick={detectFromText}
          className="mb-3 text-xs text-accent underline underline-offset-2"
        >
          成分表からタグを自動判定
        </button>

        <p className="mb-1.5 text-xs text-label-secondary">クイックタグ選択</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {quickTags.map((t) => (
            <button
              key={t.value}
              onClick={() => toggleTag(t.value)}
              className={
                "rounded-full px-3 py-1.5 text-xs transition active:scale-95 " +
                (tags.includes(t.value)
                  ? "bg-accent text-white"
                  : "bg-background text-label-secondary")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {actionError && <p className="mb-2 text-xs text-danger">{actionError}</p>}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleAdd}
          disabled={!name.trim()}
          className="w-full rounded-md bg-accent py-3 text-sm font-medium text-white disabled:opacity-40"
        >
          ポーチに追加
        </motion.button>
      </Card>

      {items.length > 0 && (
        <Card delay={0.05} className="mt-4">
          <p className="mb-3 text-sm font-medium">登録アイテム({items.length})</p>
          <div className="space-y-2">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="flex cursor-pointer items-center justify-between rounded-md bg-background/60 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-label-secondary">
                        {categoryOptions.find((c) => c.value === item.category)?.label}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                      className="rounded-full p-1.5 text-label-secondary hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {expandedId === item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-3 py-2"
                      >
                        {findGenericPicks(item.tags, products, undefined, undefined, 2).map((p) => (
                          <p key={p.name} className="text-xs text-label-secondary">
                            似た系統: {p.name}({p.brand}) ¥{p.price.toLocaleString()}
                          </p>
                        ))}
                        {item.tags.length === 0 && (
                          <p className="text-xs text-label-secondary">タグ未設定のためジェネリック候補なし</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      )}

      {compatCards.length > 0 && (
        <Card delay={0.1} className="mt-4">
          <p className="mb-3 text-sm font-medium">相性チェック</p>
          <div className="space-y-2.5">
            {compatCards.map((c, i) => {
              const style = levelStyle[c.rule.level];
              const Icon = style.icon;
              return (
                <motion.div
                  key={`${c.itemA.id}-${c.itemB.id}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`rounded-md p-3 ${style.bg}`}
                >
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${style.text}`}>
                    <Icon size={15} /> {c.rule.title}
                  </div>
                  <p className="mt-1 text-xs text-label-secondary">
                    {c.itemA.name} × {c.itemB.name}
                  </p>
                  <p className="mt-1 text-xs">{c.rule.reason}</p>
                  <p className="mt-0.5 text-xs text-label-secondary">→ {c.rule.advice}</p>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}

      {items.length > 0 && (
        <Card delay={0.15} className="mt-4">
          <p className="mb-3 text-sm font-medium">ルーティン提案</p>
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-warning">
                <Sun size={14} /> 朝
              </div>
              <p className="text-xs text-label-secondary">
                {routine.morning.map((i) => i.name).join("、") || "該当なし"}
              </p>
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-label">
                <Moon size={14} /> 夜
              </div>
              <p className="text-xs text-label-secondary">
                {routine.night.map((i) => i.name).join("、") || "該当なし"}
              </p>
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-accent">
                <Sparkles size={14} /> いつでも
              </div>
              <p className="text-xs text-label-secondary">
                {routine.anytime.map((i) => i.name).join("、") || "該当なし"}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Link to="/guide" className="mt-4 block text-center text-xs text-accent underline underline-offset-2">
        成分組み合わせ事典を見る
      </Link>
    </div>
  );
}
