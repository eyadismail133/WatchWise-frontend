import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, RefreshCw, type LucideIcon } from "lucide-react";
import { ease, spring } from "../lib/motion";

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  accent?: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  actions?: ReactNode;
  id?: string;
}

export function SectionHeader({
  title,
  icon: Icon,
  accent = "#d4a843",
  subtitle,
  href,
  hrefLabel = "View all",
  actions,
  id,
}: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: ease.out }}
        className="min-w-0"
      >
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${accent}1f`, color: accent }}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
          <h2 id={id} className="font-display text-xl font-bold tracking-tight md:text-2xl">
            {title}
          </h2>
        </div>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </motion.div>
      <div className="flex items-center gap-3">
        {actions}
        {href && (
          <Link
            to={href}
            className="group/link flex items-center gap-1 text-sm font-medium text-[#d4a843] hover:text-[#e8c866]"
          >
            {hrefLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function SkeletonCard({ wide = false }: { wide?: boolean }) {
  return (
    <div aria-hidden="true">
      <div className="shimmer rounded-xl" style={{ aspectRatio: wide ? "16/9" : "2/3" }} />
      <div className="shimmer mt-2.5 h-3 w-3/4 rounded" />
      <div className="shimmer mt-1.5 h-2.5 w-1/2 rounded" />
    </div>
  );
}

export function ErrorState({
  message = "We couldn't load this section.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d4a843]/40 px-3 py-1.5 text-xs font-medium text-[#d4a843] hover:bg-[#d4a843]/10"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}

interface ScrollRowProps extends SectionHeaderProps {
  children: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyLabel?: string;
  itemClassName?: string;
  skeletonCount?: number;
  wide?: boolean;
  className?: string;
}

/**
 * Horizontal, snap-scrolling shelf with arrow controls that only appear when
 * there is more to see. Works with touch, trackpad, mouse and keyboard.
 */
export function ScrollRow({
  children,
  isLoading,
  isError,
  onRetry,
  isEmpty,
  emptyLabel = "Nothing here yet.",
  skeletonCount = 8,
  wide = false,
  className = "",
  ...header
}: ScrollRowProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    update();
    const el = scroller.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, isLoading, children]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const headingId = header.id ?? `row-${header.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const itemWidth = wide ? "w-[78vw] sm:w-[22rem]" : "w-[38vw] sm:w-44 lg:w-48";

  return (
    <section aria-labelledby={headingId} className={`relative ${className}`}>
      <SectionHeader {...header} id={headingId} />

      {isError ? (
        <ErrorState onRetry={onRetry} />
      ) : isEmpty && !isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="group/row relative">
          <div
            ref={scroller}
            onScroll={update}
            className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 pt-1 md:-mx-2 md:px-2"
          >
            {isLoading
              ? Array.from({ length: skeletonCount }, (_, i) => (
                  <div key={i} className={`flex-shrink-0 snap-start ${itemWidth}`}>
                    <SkeletonCard wide={wide} />
                  </div>
                ))
              : children}
          </div>

          {[
            { dir: -1 as const, show: canLeft, Icon: ChevronLeft, side: "left-0 -translate-x-1/3" },
            { dir: 1 as const, show: canRight, Icon: ChevronRight, side: "right-0 translate-x-1/3" },
          ].map(({ dir, show, Icon, side }) => (
            <motion.button
              key={dir}
              type="button"
              aria-label={dir === 1 ? `Scroll ${header.title} right` : `Scroll ${header.title} left`}
              onClick={() => scrollBy(dir)}
              initial={false}
              animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              transition={spring.snappy}
              tabIndex={show ? 0 : -1}
              className={`absolute top-[38%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white shadow-xl backdrop-blur-md md:flex ${side} ${
                show ? "" : "pointer-events-none"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          ))}
        </div>
      )}
    </section>
  );
}

/** Wrapper for a single shelf item so widths and snapping stay consistent. */
export function RowItem({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={`flex-shrink-0 snap-start ${wide ? "w-[78vw] sm:w-[22rem]" : "w-[38vw] sm:w-44 lg:w-48"}`}>
      {children}
    </div>
  );
}
