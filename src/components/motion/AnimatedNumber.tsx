import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { ease } from "../../lib/motion";

/** Counts up from 0 the first time it scrolls into view. */
export function AnimatedNumber({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, { duration: 1.4, ease: ease.out });
    return () => controls.stop();
  }, [inView, value, mv]);

  return (
    <motion.span ref={ref} className={className} aria-label={value.toFixed(decimals)}>
      {text}
    </motion.span>
  );
}
