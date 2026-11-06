import { motion, type HTMLMotionProps } from "motion/react";
import { ease } from "../../lib/motion";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  amount?: number;
};

/** Fades + lifts content into view the first time it scrolls on screen. */
export function Reveal({
  delay = 0,
  y = 24,
  amount = 0.15,
  children,
  ...rest
}: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.65, ease: ease.out, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
