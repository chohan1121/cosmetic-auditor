import type { CostResult, ProductCategory } from "@/types";

const HAAGEN_DAZS_PRICE = 350;

function tierOf(ratio: number): { title: string; description: string } {
  if (ratio <= 1) return { title: "超堅実", description: "相場以下。中身がしっかり価格に反映されている。" };
  if (ratio <= 2) return { title: "適正圏内", description: "相場の範囲内。妥当な価格設定。" };
  if (ratio <= 4) return { title: "ちょい贅沢", description: "相場の2〜4倍。ブランド価値もそれなりに乗っている。" };
  if (ratio <= 8) return { title: "ブランド料しっかり", description: "相場の4〜8倍。中身以上にブランド料を払っている。" };
  return { title: "ほぼイメージ課金", description: "相場の8倍超。価格の大半がイメージ料の可能性。" };
}

export function calcCost(
  category: ProductCategory,
  price: number,
  volume: number,
  benchmarkUnitPrice: Partial<Record<ProductCategory, number>>
): CostResult {
  const safeVolume = volume > 0 ? volume : 1;
  const unitPrice = price / safeVolume;
  const benchmark = benchmarkUnitPrice[category] ?? 1;
  const ratio = unitPrice / benchmark;
  const brandFee = Math.max(0, price - benchmark * safeVolume);
  const haagenDazsCount = Math.floor(brandFee / HAAGEN_DAZS_PRICE);

  return {
    unitPrice: Math.round(unitPrice * 10) / 10,
    benchmarkUnitPrice: benchmark,
    ratio: Math.round(ratio * 10) / 10,
    tier: tierOf(ratio),
    brandFee: Math.round(brandFee),
    haagenDazsCount,
  };
}
