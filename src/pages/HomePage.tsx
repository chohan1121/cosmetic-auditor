import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CloudSun, FlaskConical, ScanBarcode, ShoppingBag, User, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, PageHeader } from "@/components/common/Card";
import { fetchWeatherAdvice } from "@/lib/weather";
import type { WeatherAdvice } from "@/types";

const features = [
  { to: "/check", label: "成分ホンネ分析", desc: "広告抜きの採点", icon: FlaskConical },
  { to: "/scan", label: "バーコードスキャン", desc: "商品→成分を自動判定", icon: ScanBarcode },
  { to: "/cost", label: "コスパ診断", desc: "中身とブランド料を分離", icon: Wallet },
  { to: "/pouch", label: "マイポーチ", desc: "相性チェック", icon: ShoppingBag },
  { to: "/profile", label: "わたし", desc: "肌質・髪質プロフィール", icon: User },
];

export default function HomePage() {
  const [weather, setWeather] = useState<WeatherAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWeatherAdvice()
      .then(setWeather)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="コスメのホンネ" subtitle="メーカーへの忖度なし、あなたの実利を最大化" />

      <Card>
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <CloudSun size={16} className="text-accent" /> 今日の肌アドバイス
        </div>
        {loading && (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                className="h-3 flex-1 rounded-full bg-separator"
              />
            ))}
          </div>
        )}
        {error && <p className="text-sm text-label-secondary">天気情報を取得できませんでした。</p>}
        {weather && (
          <div>
            <p className="text-sm">{weather.today.headline}</p>
            <ul className="mt-2 space-y-1">
              {weather.today.tips.map((tip, i) => (
                <motion.li
                  key={tip}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="text-xs text-label-secondary"
                >
                  • {tip}
                </motion.li>
              ))}
            </ul>

            <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
              {weather.week.map((d, i) => (
                <motion.div
                  key={d.date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex min-w-14 flex-col items-center rounded-md bg-background/60 px-2 py-2 text-center"
                >
                  <span className="text-[10px] text-label-secondary">
                    {new Date(d.date).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                  </span>
                  <span className="mt-1 text-xs font-medium">{Math.round(d.tempMax)}°</span>
                  <span className="text-[10px] text-label-secondary">{Math.round(d.tempMin)}°</span>
                  <span className="mt-1 text-[10px] text-accent">UV{Math.round(d.uvIndex)}</span>
                </motion.div>
              ))}
            </div>

            {weather.lookahead.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {weather.lookahead.map((l, i) => (
                  <motion.div
                    key={l.title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="rounded-md bg-accent/10 px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-accent">{l.title}</span>
                    <span className="ml-1 text-label-secondary">{l.detail}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {features.map((f, i) => (
          <motion.div
            key={f.to}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.96 }}
          >
            <Link
              to={f.to}
              className="flex h-full flex-col justify-between rounded-lg border border-separator bg-surface p-4"
            >
              <f.icon size={20} className="text-accent" />
              <div className="mt-3">
                <p className="text-sm font-medium">{f.label}</p>
                <p className="mt-0.5 text-xs text-label-secondary">{f.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <Link
        to="/guide"
        className="mt-4 block text-center text-xs text-accent underline underline-offset-2"
      >
        成分組み合わせ事典を見る
      </Link>
    </div>
  );
}
