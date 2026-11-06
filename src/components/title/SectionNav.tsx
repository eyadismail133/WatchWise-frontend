import { useEffect, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { spring } from "../../lib/motion";

export interface SectionLink {
  id: string;
  label: string;
}

/** Sticky in-page navigation with a scroll-spy underline that glides between sections. */
export function SectionNav({ sections }: { sections: SectionLink[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        const best = sections.find((s) => (visible.get(s.id) ?? 0) > 0);
        if (best) setActive(best.id);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: [0, 0.01, 0.25] },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top, behavior: "smooth" });
    setActive(id);
  };

  return (
    <div className="sticky top-14 z-30 -mx-4 border-b border-white/[0.06] bg-background/80 px-4 backdrop-blur-xl md:-mx-6 md:px-6">
      <LayoutGroup id="section-nav">
        <nav aria-label="On this page" className="scrollbar-hide flex gap-1 overflow-x-auto">
          {sections.map((s) => {
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => jump(s.id)}
                aria-current={isActive ? "true" : undefined}
                className={`relative whitespace-nowrap px-3 py-3.5 text-sm font-medium transition-colors ${
                  isActive ? "text-[#e8c866]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
                {isActive && (
                  <motion.span
                    layoutId="section-underline"
                    transition={spring.layout}
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#d4a843] shadow-[0_0_12px_rgba(212,168,67,0.8)]"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </LayoutGroup>
    </div>
  );
}
