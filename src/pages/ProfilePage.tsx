import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { Card, PageHeader } from "@/components/common/Card";
import { LoginPrompt } from "@/components/common/LoginPrompt";
import { findHairPicks, findProfilePicks } from "@/lib/recommend";
import { useProfileStore } from "@/stores/profileStore";
import { useMasterDataStore } from "@/stores/masterDataStore";
import { useAuthStore } from "@/stores/authStore";
import type { HairConcern, HairType, ProductCategory, SkinConcern, SkinType } from "@/types";

const skinTypes: { value: SkinType; label: string }[] = [
  { value: "dry", label: "乾燥肌" },
  { value: "oily", label: "脂性肌" },
  { value: "combination", label: "混合肌" },
  { value: "sensitive", label: "敏感肌" },
  { value: "normal", label: "普通肌" },
];
const skinConcerns: { value: SkinConcern; label: string }[] = [
  { value: "acne", label: "ニキビ・毛穴" },
  { value: "aging", label: "エイジング" },
  { value: "dullness", label: "くすみ" },
  { value: "pigmentation", label: "シミ・色素沈着" },
  { value: "redness", label: "赤み・ゆらぎ" },
];
const hairTypes: { value: HairType; label: string }[] = [
  { value: "dry", label: "乾燥髪" },
  { value: "damaged", label: "ダメージ髪" },
  { value: "oily", label: "脂性頭皮" },
  { value: "fine", label: "軟毛・猫っ毛" },
];
const hairConcerns: { value: HairConcern; label: string }[] = [
  { value: "frizz", label: "広がり・うねり" },
  { value: "breakage", label: "切れ毛・枝毛" },
  { value: "scalp", label: "頭皮の悩み" },
  { value: "colorFade", label: "カラー退色" },
  { value: "volume", label: "ボリューム不足" },
];
const skinCategories: ProductCategory[] = ["lotion", "milk", "serum", "cream"];
const hairCategories: ProductCategory[] = ["shampoo", "hairoil", "hairmilk"];

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={
        "rounded-full px-3.5 py-2 text-xs transition " +
        (active ? "bg-accent text-white" : "bg-background text-label-secondary")
      }
    >
      {label}
    </motion.button>
  );
}

export default function ProfilePage() {
  const [tab, setTab] = useState<"skin" | "hair">("skin");
  const profile = useProfileStore();
  const { products, categoryLabels } = useMasterDataStore();
  const { user, signOut } = useAuthStore();

  useEffect(() => {
    if (user) profile.load(user.id);
    else profile.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return (
      <div>
        <PageHeader title="わたし" subtitle="肌質・髪質を登録してパーソナライズ" />
        <LoginPrompt description="肌質・髪質プロフィールはアカウントに紐付けて保存されます。ログインすると端末をまたいで同期されます。" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <PageHeader title="わたし" subtitle="肌質・髪質を登録してパーソナライズ" />
        <button
          onClick={() => signOut()}
          className="flex shrink-0 items-center gap-1 rounded-full bg-background px-3 py-1.5 text-xs text-label-secondary active:scale-95"
        >
          <LogOut size={13} />
          ログアウト
        </button>
      </div>
      <p className="-mt-4 mb-4 truncate text-xs text-label-secondary">{user.email}</p>

      <div className="mb-4 flex rounded-full bg-background p-1">
        {(["skin", "hair"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative flex-1 rounded-full py-2 text-sm font-medium"
          >
            {tab === t && (
              <motion.div
                layoutId="profile-tab"
                className="absolute inset-0 rounded-full bg-surface shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className={`relative ${tab === t ? "text-label" : "text-label-secondary"}`}>
              {t === "skin" ? "肌" : "髪"}
            </span>
          </button>
        ))}
      </div>

      {tab === "skin" ? (
          <motion.div
            key="skin"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <Card>
              <p className="mb-2 text-sm font-medium">肌質</p>
              <div className="flex flex-wrap gap-2">
                {skinTypes.map((s) => (
                  <Chip
                    key={s.value}
                    label={s.label}
                    active={profile.skinType === s.value}
                    onClick={() => profile.setSkinType(user.id, s.value)}
                  />
                ))}
              </div>
              <p className="mb-2 mt-4 text-sm font-medium">悩み(複数選択可)</p>
              <div className="flex flex-wrap gap-2">
                {skinConcerns.map((c) => (
                  <Chip
                    key={c.value}
                    label={c.label}
                    active={profile.concerns.includes(c.value)}
                    onClick={() => profile.toggleConcern(user.id, c.value)}
                  />
                ))}
              </div>
            </Card>

            {profile.skinType && (
              <Card delay={0.1}>
                <p className="mb-3 text-sm font-medium">カテゴリ別おすすめ</p>
                <div className="space-y-4">
                  {skinCategories.map((cat) => {
                    const picks = findProfilePicks(products, cat, profile.skinType, profile.concerns);
                    if (picks.length === 0) return null;
                    return (
                      <div key={cat}>
                        <p className="mb-1.5 text-xs font-medium text-label-secondary">
                          {categoryLabels[cat]}
                        </p>
                        {picks.map((p) => (
                          <div key={p.name} className="flex items-center justify-between py-1">
                            <p className="text-sm">{p.name}</p>
                            <p className="text-xs text-label-secondary">¥{p.price.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="hair"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <Card>
              <p className="mb-2 text-sm font-medium">髪質</p>
              <div className="flex flex-wrap gap-2">
                {hairTypes.map((h) => (
                  <Chip
                    key={h.value}
                    label={h.label}
                    active={profile.hairType === h.value}
                    onClick={() => profile.setHairType(user.id, h.value)}
                  />
                ))}
              </div>
              <p className="mb-2 mt-4 text-sm font-medium">悩み(複数選択可)</p>
              <div className="flex flex-wrap gap-2">
                {hairConcerns.map((c) => (
                  <Chip
                    key={c.value}
                    label={c.label}
                    active={profile.hairConcerns.includes(c.value)}
                    onClick={() => profile.toggleHairConcern(user.id, c.value)}
                  />
                ))}
              </div>
            </Card>

            <Card delay={0.05}>
              <p className="mb-1 text-sm font-medium">オイル vs ミルク、どっちを選ぶ?</p>
              <p className="text-xs leading-relaxed text-label-secondary">
                ヘアオイルは毛先の質感補正と保護膜づくりが得意で、パサつき・広がりが強い髪向き。
                ヘアミルクは水分バランスを整えるのが得意で、根元から軽く仕上げたい猫っ毛・細毛向き。
                迷ったら「重さで悩む→ミルク」「まとまらなさで悩む→オイル」を目安に。
              </p>
            </Card>

            {profile.hairType && (
              <Card delay={0.1}>
                <p className="mb-3 text-sm font-medium">カテゴリ別おすすめ</p>
                <div className="space-y-4">
                  {hairCategories.map((cat) => {
                    const picks = findHairPicks(products, cat, profile.hairType, profile.hairConcerns);
                    if (picks.length === 0) return null;
                    return (
                      <div key={cat}>
                        <p className="mb-1.5 text-xs font-medium text-label-secondary">
                          {categoryLabels[cat]}
                        </p>
                        {picks.map((p) => (
                          <div key={p.name} className="flex items-center justify-between py-1">
                            <p className="text-sm">{p.name}</p>
                            <p className="text-xs text-label-secondary">¥{p.price.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </motion.div>
        )}
    </div>
  );
}
