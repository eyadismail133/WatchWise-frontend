import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import site from "../content/site.json";
import { ContentLayout } from "../components/content/ContentLayout";
import { usePageMeta } from "../hooks/usePageMeta";
import { ease } from "../lib/motion";

export default function Faq() {
  usePageMeta(site.faq.title, site.faq.description);
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ContentLayout eyebrow="Help" title={site.faq.title} intro={site.faq.description}>
      <div className="space-y-3">
        {site.faq.items.map((item, i) => {
          const isOpen = open === i;
          return (
            <motion.div
              key={item.q}
              layout
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: ease.out, delay: Math.min(i, 8) * 0.04 }}
              className={`overflow-hidden rounded-2xl border transition-colors ${
                isOpen ? "border-[#d4a843]/30 bg-card/80" : "border-white/[0.07] bg-card/40"
              }`}
            >
              <h2 className="text-base">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold"
                >
                  {item.q}
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="flex-shrink-0 text-[#d4a843]">
                    <ChevronDown className="h-5 w-5" aria-hidden="true" />
                  </motion.span>
                </button>
              </h2>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: ease.out }}
                  >
                    <p className="px-5 pb-5 text-base leading-relaxed text-muted-foreground">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </ContentLayout>
  );
}
