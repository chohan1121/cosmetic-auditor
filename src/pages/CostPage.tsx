import { motion } from "framer-motion";
import { useState } from "react";
import { IceCreamCone } from "lucide-react";
import { Card, PageHeader } from "@/components/common/Card";
import { calcCost } from "@/lib/cost";
import { useMasterDataStore } from "@/stores/masterDataStore";
import type { CostResult, ProductCategory } from "@/types";

export default function CostPage() {
  const { categoryLabels, benchmarkUnitPrice } = useMasterDataStore();
  const [category, setCategory] = useState<ProductCategory>("lotion");
  const [price, setPrice] = useState("");
  const [volume, setVolume] = useState("");
  const [result, setResult] = useState<CostResult | null>(null);

  const handleCalc = () => {
    const p = Number(price);
    const v = Number(volume);
    if (!p || !v) return;
    setResult(calcCost(category, p, v, benchmarkUnitPrice));
  };

  const gaugePercent = result ? Math.min(100, (result.ratio / 8) * 100) : 0;

  return (
    <div>
      <PageHeader title="コスパ診断" subtitle="価格のうち「中身」と「ブランド料」を分離" />

      <Card>
        <label className="mb-1 block text-xs text-label-secondary">カテゴリ</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory)}
          className="mb-3 w-full rounded-md bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-accent"
        >
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-label-secondary">価格(円)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="3300"
              className="w-full rounded-md bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-label-secondary">容量(ml/g)</label>
            <input
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="120"
              className="w-full rounded-md bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleCalc}
          disabled={!price || !volume}
          className="mt-4 w-full rounded-md bg-accent py-3 text-sm font-medium text-white disabled:opacity-40"
        >
          診断する
        </motion.button>
      </Card>

      {result && (
          <motion.div
            key={`${result.unitPrice}-${category}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 space-y-4"
          >
            <Card className="text-center">
              <motion.p
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="text-2xl font-bold text-accent"
              >
                {result.tier.title}
              </motion.p>
              <p className="mt-1 text-sm text-label-secondary">{result.tier.description}</p>

              <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-background">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${gaugePercent}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-accent"
                />
              </div>
              <p className="mt-2 text-xs text-label-secondary">
                相場の{result.ratio}倍(単価 ¥{result.unitPrice}/相場 ¥{result.benchmarkUnitPrice})
              </p>
            </Card>

            <Card delay={0.1} className="flex items-center justify-between">
              <div>
                <p className="text-xs text-label-secondary">推定ブランド料</p>
                <p className="text-xl font-semibold">¥{result.brandFee.toLocaleString()}</p>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 14 }}
                className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-2 text-sm font-medium text-accent"
              >
                <IceCreamCone size={16} />
                ハーゲンダッツ{result.haagenDazsCount}個分
              </motion.div>
            </Card>
          </motion.div>
        )}
    </div>
  );
}
