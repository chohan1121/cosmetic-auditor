import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, TriangleAlert } from "lucide-react";
import { Card } from "@/components/common/Card";
import { ScoreRing } from "@/components/common/ScoreRing";
import type { AnalysisResult, ProductPick } from "@/types";

export function AnalysisResultCard({
  result,
  genericPicks,
}: {
  result: AnalysisResult;
  genericPicks: ProductPick[];
}) {
  return (
    <motion.div
      key={result.score}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <Card className="flex flex-col items-center text-center">
        <ScoreRing score={result.score} grade={result.grade} />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-3 text-lg font-semibold"
        >
          {result.label}
        </motion.p>
        <p className="mt-1 text-sm text-label-secondary">{result.gradeComment}</p>
        <p className="mt-4 text-sm leading-relaxed">{result.honneComment}</p>
        {result.personalNote && (
          <div className="mt-3 w-full rounded-md bg-accent/10 p-3 text-left text-xs text-label">
            <span className="font-medium text-accent">あなた向けメモ　</span>
            {result.personalNote}
          </div>
        )}
      </Card>

      {result.goodPoints.length > 0 && (
        <Card delay={0.05}>
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 size={16} /> 良い点
          </div>
          <ul className="space-y-1.5 text-sm text-label-secondary">
            {result.goodPoints.map((g, i) => (
              <motion.li
                key={g}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                • {g}
              </motion.li>
            ))}
          </ul>
        </Card>
      )}

      {result.cautionPoints.length > 0 && (
        <Card delay={0.1}>
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-warning">
            <TriangleAlert size={16} /> 注意点
          </div>
          <ul className="space-y-1.5 text-sm text-label-secondary">
            {result.cautionPoints.map((c, i) => (
              <motion.li
                key={c}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
              >
                • {c}
              </motion.li>
            ))}
          </ul>
        </Card>
      )}

      <Card delay={0.15}>
        <p className="mb-3 text-sm font-medium">検出成分</p>
        <div className="flex flex-wrap gap-1.5">
          {result.matched.map((m, i) => (
            <motion.span
              key={`${m.raw}-${i}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.02 }}
              className={
                "rounded-full px-2.5 py-1 text-xs " +
                (m.matchType === "unknown"
                  ? "bg-separator text-label-secondary"
                  : m.info && m.info.caution >= 2
                    ? "bg-danger/10 text-danger"
                    : m.info && m.info.good >= 2
                      ? "bg-success/10 text-success"
                      : "bg-background text-label-secondary")
              }
            >
              {m.raw}
            </motion.span>
          ))}
        </div>
      </Card>

      {genericPicks.length > 0 && (
        <Card delay={0.2}>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-medium">
            <Sparkles size={16} className="text-accent" /> 似た系統のプチプラ候補
          </div>
          <div className="space-y-3">
            {genericPicks.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className="flex items-center justify-between border-b border-separator pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-label-secondary">{p.brand}</p>
                </div>
                <p className="text-sm font-medium">¥{p.price.toLocaleString()}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
