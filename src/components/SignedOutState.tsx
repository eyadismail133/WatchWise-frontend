import { Link } from "react-router";
import { motion } from "motion/react";
import { Compass, LogIn, type LucideIcon } from "lucide-react";
import { PosterWall } from "./PosterWall";
import { ease, spring } from "../lib/motion";

interface SignedOutStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  perks?: string[];
  headingLevel?: 1 | 2;
}

/** Full-bleed, animated sign-in prompt for pages that need an account. */
export function SignedOutState({ icon: Icon, title, description, perks = [], headingLevel = 1 }: SignedOutStateProps) {
  const Heading = headingLevel === 1 ? motion.h1 : motion.h2;
  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: ease.out } },
  };

  return (
    <div className="relative -mt-16 flex min-h-[calc(100vh)] items-center justify-center overflow-hidden px-6 pt-16">
      <PosterWall />
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
        className="relative z-10 max-w-lg text-center"
      >
        <motion.div variants={item} className="relative mx-auto mb-7 h-24 w-24">
          <motion.span
            className="absolute inset-0 rounded-full bg-[#d4a843]/25 blur-2xl"
          />
          <motion.span
            className="absolute inset-0 rounded-full border border-dashed border-[#d4a843]/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          />
          <span className="absolute inset-2 flex items-center justify-center rounded-full border border-white/10 bg-card/80">
            <Icon className="h-9 w-9 text-[#e8c866]" aria-hidden="true" />
          </span>
        </motion.div>
        <Heading variants={item} className="mb-3 font-display text-3xl font-bold md:text-4xl">
          {title}
        </Heading>
        <motion.p variants={item} className="mb-6 leading-relaxed text-muted-foreground">
          {description}
        </motion.p>
        {perks.length > 0 && (
          <motion.ul variants={item} className="mb-8 flex flex-wrap justify-center gap-2">
            {perks.map((p) => (
              <li key={p} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground/80">
                {p}
              </li>
            ))}
          </motion.ul>
        )}
        <motion.div variants={item} className="flex flex-wrap justify-center gap-3">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} transition={spring.snappy}>
            <Link
              to="/login"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#d4a843] px-6 font-semibold text-background shadow-[0_10px_40px_-10px_rgba(212,168,67,0.8)] hover:bg-[#e8c866]"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" /> Sign In
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} transition={spring.snappy}>
            <Link
              to="/discover"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 font-medium hover:bg-white/10"
            >
              <Compass className="h-4 w-4" aria-hidden="true" /> Browse titles
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
