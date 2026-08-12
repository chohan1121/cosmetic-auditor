import { motion } from "framer-motion";
import { useState } from "react";
import { ScanBarcode } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, PageHeader } from "@/components/common/Card";
import { AnalysisResultCard } from "@/components/common/AnalysisResultCard";
import { analyzeIngredients, sampleIngredientTexts } from "@/lib/analyze";
import { findGenericPicks } from "@/lib/recommend";
import { useProfileStore } from "@/stores/profileStore";
import { useMasterDataStore } from "@/stores/masterDataStore";
import type { AnalysisResult } from "@/types";

export default function CheckPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const profile = useProfileStore();
  const { ingredients, products } = useMasterDataStore();

  const handleAnalyze = () => {
    if (!text.trim()) return;
    const r = analyzeIngredients(text, ingredients, profile);
    setResult(r);
  };

  const genericPicks = result ? findGenericPicks(result.tags, products, undefined, "skin") : [];

  return (
    <div>
      <PageHeader title="成分ホンネ分析" subtitle="成分表を貼るだけで、広告抜きの採点をチェック" />

      <Card>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="成分表を貼り付けてください(例: 水, グリセリン, ナイアシンアミド...)"
          rows={5}
          className="w-full resize-none rounded-md bg-background/60 p-3 text-sm outline-none placeholder:text-label-secondary focus:ring-2 focus:ring-accent"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {sampleIngredientTexts.map((s, i) => (
            <button
              key={i}
              onClick={() => setText(s)}
              className="rounded-full bg-background px-3 py-1 text-xs text-label-secondary transition hover:bg-separator active:scale-95"
            >
              サンプル{i + 1}
            </button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleAnalyze}
          disabled={!text.trim()}
          className="mt-4 w-full rounded-md bg-accent py-3 text-sm font-medium text-white disabled:opacity-40"
        >
          ホンネ判定する
        </motion.button>
        <Link
          to="/scan"
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-background py-3 text-sm font-medium text-label-secondary active:scale-[0.98]"
        >
          <ScanBarcode size={16} />
          バーコードでスキャンする
        </Link>
      </Card>

      {result && (
        <div className="mt-4">
          <AnalysisResultCard result={result} genericPicks={genericPicks} />
        </div>
      )}
    </div>
  );
}
