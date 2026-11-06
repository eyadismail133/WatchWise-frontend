import { motion, type HTMLMotionProps } from "motion/react";
import { ease } from "../../lib/motion";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  blur?: boolean;
  amount?: number;
};

/** Fades + lifts content into view the first time it scrolls on screen. */
export function Reveal({
  delay = 0,
  y = 24,
  blur = true,
  amount = 0.15,
  children,
  ...rest
}: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: blur ? "blur(6px)" : "blur(0px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.65, ease: ease.out, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
