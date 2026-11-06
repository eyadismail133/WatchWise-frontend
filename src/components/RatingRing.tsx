import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { ease } from "../lib/motion";

interface RatingRingProps {
  value: number; // 0-10
  size?: number;
  label?: string;
  votes?: number | null;
}

/** SVG score ring that draws itself and counts up when it scrolls into view. */
export function RatingRing({ value, size = 64, label = "Score", votes }: RatingRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const progress = useMotionValue(0);
  const display = useTransform(progress, (v) => (v * 10).toFixed(1));
  const pct = Math.max(0, Math.min(1, value / 10));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(progress, pct, { duration: 1.4, ease: ease.out });
    return () => controls.stop();
  }, [inView, pct, progress]);

  const stroke = size * 0.09;
  const r = (size - stroke) / 2;
  const color = value >= 7.5 ? "#34d399" : value >= 6 ? "#e8c866" : value > 0 ? "#fb923c" : "#6b7280";

  return (
    <div ref={ref} className="flex items-center gap-3" role="img" aria-label={`${label}: ${value.toFixed(1)} out of 10`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            style={{ pathLength: progress, filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        </svg>
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-bold tabular-nums"
          style={{ fontSize: size * 0.27 }}
        >
          {display}
        </motion.span>
      </div>
      <div aria-hidden="true" className="leading-tight">
        <div className="text-xs uppercase tracking-widest text-white/60">{label}</div>
        {typeof votes === "number" && votes > 0 && (
          <div className="text-xs text-white/50">{new Intl.NumberFormat("en", { notation: "compact" }).format(votes)} votes</div>
        )}
      </div>
    </div>
  );
}
