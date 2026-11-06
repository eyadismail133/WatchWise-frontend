import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, BookOpen } from "lucide-react";
import site from "../content/site.json";
import { SectionHeader } from "./ScrollRow";
import { cappedDelay, ease } from "../lib/motion";

export default function HomeGuides() {
  return (
    <section aria-labelledby="guides-heading">
      <SectionHeader
        id="guides-heading"
        title="From the guides"
        icon={BookOpen}
        accent="#10b981"
        subtitle="Short reads to help you choose faster and discover more"
        href="/guides"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {site.guides.slice(0, 3).map((g, i) => (
          <motion.div
            key={g.slug}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            transition={{
              duration: 0.55,
              ease: ease.out,
              delay: cappedDelay(i, 0.08),
            }}
          >
            <Link
              to={`/guides/${g.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-white/[0.07] bg-card/60 p-6 transition-colors hover:border-[#10b981]/40"
            >
              <span className="mb-2 text-xs text-muted-foreground">
                {g.minutes} min read
              </span>
              <h3 className="font-display text-lg font-bold leading-snug group-hover:text-[#e8c866]">
                {g.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {g.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#10b981]">
                Read{" "}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
