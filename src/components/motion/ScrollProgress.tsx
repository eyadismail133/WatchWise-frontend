import { motion, useScroll, useSpring } from "motion/react";

/** Thin gold reading-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 40,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="fixed top-0 inset-x-0 h-[2px] z-[70] bg-gradient-to-r from-[#d4a843] via-[#e8c866] to-[#8a6fbf]"
    />
  );
}
