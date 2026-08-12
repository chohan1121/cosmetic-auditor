import { Fragment } from "react";
import { motion } from "framer-motion";
import { Card, PageHeader } from "@/components/common/Card";
import { useMasterDataStore } from "@/stores/masterDataStore";
import type { ActiveTag, CompatLevel, CompatRule } from "@/types";

const majorIngredients: { tag: ActiveTag; label: string }[] = [
  { tag: "retinol", label: "レチノール" },
  { tag: "aha", label: "AHA" },
  { tag: "bha", label: "BHA" },
  { tag: "vitaminC-pure", label: "純ビタミンC" },
  { tag: "vitaminC-derivative", label: "VC誘導体" },
  { tag: "niacinamide", label: "ナイアシンアミド" },
  { tag: "alcohol-denat", label: "アルコール" },
  { tag: "ceramide", label: "セラミド" },
  { tag: "hyaluronic-acid", label: "ヒアルロン酸" },
  { tag: "azelaic-acid", label: "アゼライン酸" },
];

const levelColor: Record<CompatLevel, string> = {
  ng: "bg-danger/70",
  caution: "bg-warning/60",
  good: "bg-success/60",
};

function ruleBetween(a: ActiveTag, b: ActiveTag, compatRules: CompatRule[]) {
  return compatRules.find(
    (r) => (r.tagA === a && r.tagB === b) || (r.tagA === b && r.tagB === a)
  );
}

export default function GuidePage() {
  const { compatRules } = useMasterDataStore();
  return (
    <div>
      <PageHeader title="成分組み合わせ事典" subtitle="主要成分同士の相性を早見表でチェック" />

      <Card className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `72px repeat(${majorIngredients.length}, 32px)` }}
          >
            <div />
            {majorIngredients.map((i) => (
              <div
                key={i.tag}
                className="flex h-16 items-end justify-center pb-1 text-[9px] text-label-secondary"
                style={{ writingMode: "vertical-rl" }}
              >
                {i.label}
              </div>
            ))}
            {majorIngredients.map((row, ri) => (
              <Fragment key={row.tag}>
                <div className="flex items-center text-[10px] text-label-secondary">
                  {row.label}
                </div>
                {majorIngredients.map((col, ci) => {
                  const rule = row.tag !== col.tag ? ruleBetween(row.tag, col.tag, compatRules) : undefined;
                  return (
                    <motion.div
                      key={`${row.tag}-${col.tag}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (ri * majorIngredients.length + ci) * 0.006 }}
                      className={
                        "h-8 w-8 rounded-sm " +
                        (row.tag === col.tag
                          ? "bg-separator"
                          : rule
                            ? levelColor[rule.level]
                            : "bg-background")
                      }
                      title={rule?.title}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-label-secondary">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-danger/70" />NG</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-warning/60" />注意</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-success/60" />好相性</span>
        </div>
      </Card>

      <div className="mt-4 space-y-3">
        {compatRules.map((rule, i) => (
          <Card key={rule.title} delay={i * 0.03}>
            <p className="text-sm font-medium">{rule.title}</p>
            <p className="mt-1 text-xs text-label-secondary">{rule.reason}</p>
            <p className="mt-1 text-xs text-accent">→ {rule.advice}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
