import { Link } from "react-router";
import { usePageMeta } from "../hooks/usePageMeta";
import { motion } from "motion/react";
import { Clapperboard, Home, Search } from "lucide-react";
import { ease, spring } from "../lib/motion";

export default function NotFound() {
  usePageMeta("Page not found");
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="text-center">
        <motion.div
          initial={{ rotate: -25, scale: 0.6, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={spring.bouncy}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#d4a843]/10"
        >
          <motion.span
            animate={{ rotate: [0, -14, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.4 }}
            className="inline-flex origin-bottom-left"
          >
            <Clapperboard className="h-10 w-10 text-[#d4a843]" aria-hidden="true" />
          </motion.span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: ease.out, delay: 0.1 }}
          className="font-display text-8xl font-bold text-gradient md:text-9xl"
        >
          404
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-3 text-lg text-muted-foreground"
        >
          Page not found — this scene ended up on the cutting-room floor.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-center gap-3"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#d4a843] px-5 py-2.5 text-sm font-semibold text-background hover:bg-[#e8c866]"
          >
            <Home className="h-4 w-4" aria-hidden="true" /> Back to Home
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm hover:border-white/30"
          >
            <Search className="h-4 w-4" aria-hidden="true" /> Search
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
