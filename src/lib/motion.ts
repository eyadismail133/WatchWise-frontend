import type { Transition, Variants } from "motion/react";

/**
 * WatchWise motion tokens. Every animation in the app should pull its timing
 * from here so the whole product moves with one "cinematic" personality:
 * slow, confident entrances; quick, quiet exits; springy micro-interactions.
 */
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  cinematic: [0.16, 1, 0.3, 1],
} as const;

export const spring = {
  snappy: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 },
  soft: { type: "spring", stiffness: 180, damping: 24 },
  layout: { type: "spring", bounce: 0.18, visualDuration: 0.45 },
  bouncy: { type: "spring", stiffness: 300, damping: 15 },
} satisfies Record<string, Transition>;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: ease.out },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: ease.out } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: ease.out } },
};

export const staggerParent = (stagger = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/** Cap stagger delays so long lists never crawl in. */
export const cappedDelay = (index: number, step = 0.045, max = 12) =>
  Math.min(index, max) * step;

export const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: ease.out } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.22, ease: ease.inOut } },
};
