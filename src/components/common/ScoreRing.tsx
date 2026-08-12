import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import type { Grade } from "@/types";

const gradeColor: Record<Grade, string> = {
  S: "#E23D6B",
  A: "#FF6482",
  B: "#FF9F0A",
  C: "#98989D",
  D: "#6E6E73",
};

export function ScoreRing({ score, grade }: { score: number; grade: Grade }) {
  const size = 168;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useMotionValue(0);
  const strokeDashoffset = useTransform(progress, (v) => circumference * (1 - v / 98));
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const controls = animate(progress, score, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    });
    return controls.stop;
  }, [score, progress]);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" stroke="var(--color-separator)" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          stroke={gradeColor[grade]}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 15 }}
          className="text-4xl font-bold"
          style={{ color: gradeColor[grade] }}
        >
          {grade}
        </motion.span>
        <motion.span className="text-sm text-label-secondary">{displayScore}</motion.span>
      </div>
    </div>
  );
}
