import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Clock } from "lucide-react";
import site from "../content/site.json";
import { ContentLayout } from "../components/content/ContentLayout";
import { usePageMeta } from "../hooks/usePageMeta";
import { ease, spring } from "../lib/motion";

export default function Guides() {
  usePageMeta("Guides", "Practical guides to choosing what to watch: moods, genres, hidden gems, streaming filters and better watchlists.");
  return (
    <ContentLayout
      eyebrow="Guides"
      title="Watch smarter"
      intro="Short, practical guides written by the WatchWise team to help you spend less time choosing and more time watching."
    >
      <div className="grid gap-4">
        {site.guides.map((g, i) => (
          <motion.div
            key={g.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            transition={{ ...spring.soft, delay: i * 0.05 }}
          >
            <Link
              to={`/guides/${g.slug}`}
              className="group block rounded-2xl border border-white/[0.07] bg-card/60 p-6 transition-colors hover:border-[#d4a843]/40"
            >
              <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {g.minutes} min read
              </div>
              <h2 className="font-display text-xl font-bold group-hover:text-[#e8c866]">{g.title}</h2>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{g.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#d4a843]">
                Read guide
                <motion.span className="inline-flex" transition={{ ease: ease.out }}>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </motion.span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </ContentLayout>
  );
}
