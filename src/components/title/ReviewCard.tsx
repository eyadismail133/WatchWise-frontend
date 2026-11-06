import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ExternalLink, Quote, Star } from "lucide-react";
import type { RichTitle } from "../../lib/types";
import { formatDate } from "../../lib/types";
import { ease } from "../../lib/motion";

type Review = RichTitle["reviews"][number];

/** TMDB community review with an expanding body (height:auto animation). */
export function ReviewCard({ review, index = 0 }: { review: Review; index?: number }) {
  const [open, setOpen] = useState(false);
  const long = review.content.length > 420;
  const text = review.content.replace(/\r?\n\s*\r?\n/g, "\n\n").trim();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: ease.out, delay: index * 0.06 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card/70 p-5"
    >
      <Quote className="absolute right-4 top-4 h-10 w-10 text-[#d4a843]/10" aria-hidden="true" />
      <header className="mb-3 flex items-center gap-3">
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#d4a843]/40 to-[#8a6fbf]/40">
          {review.avatar ? (
            <img src={review.avatar} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-bold">
              {review.author.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold">{review.author}</div>
          <div className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</div>
        </div>
        {review.rating !== null && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-[#d4a843]/15 px-2 py-0.5 text-xs font-semibold text-[#e8c866]">
            <Star className="h-3 w-3 fill-current" aria-hidden="true" />
            {review.rating}/10
          </span>
        )}
      </header>

      <motion.div
        layout
        className="relative overflow-hidden"
        animate={{ height: open || !long ? "auto" : 132 }}
        transition={{ duration: 0.5, ease: ease.out }}
      >
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{text}</p>
        <AnimatePresence>
          {long && !open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent"
            />
          )}
        </AnimatePresence>
      </motion.div>

      <div className="mt-3 flex items-center justify-between">
        {long ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#d4a843] hover:text-[#e8c866]"
          >
            {open ? "Show less" : "Read full review"}
            <motion.span animate={{ rotate: open ? 180 : 0 }} className="inline-block">
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </motion.span>
          </button>
        ) : (
          <span />
        )}
        {review.url && (
          <a
            href={review.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            TMDB <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>
    </motion.article>
  );
}
