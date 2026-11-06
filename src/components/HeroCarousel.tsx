import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { Info, Sparkles, Star, TrendingUp, Flame } from "lucide-react";
import { Button } from "./ui/button";
import type { TitleData } from "./MovieCard";
import { ease } from "../lib/motion";
import homeBackground from "../../assets/home background.png";

const SLIDE_MS = 7000;

interface HeroCarouselProps {
  slides: TitleData[];
  isLoading?: boolean;
}

/**
 * Cinematic home hero: crossfading backdrops with a slow Ken Burns zoom,
 * scroll parallax, staggered copy and a poster rail that doubles as the
 * slide picker with a live progress bar. Autoplay pauses on hover/focus.
 */
export function HeroCarousel({ slides, isLoading }: HeroCarouselProps) {
  const ref = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const count = slides.length;
  const active = count ? slides[index % count] : null;

  useEffect(() => {
    if (count < 2 || paused || reduce) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [index, count, paused, reduce]);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const background = active?.backdrop_hd ?? active?.backdrop_path ?? null;
  const year = active?.releaseDate?.slice(0, 4);
  const mediaType = active?.mediaType === "tv" ? "tv" : "movie";

  return (
    <section
      ref={ref}
      aria-roledescription="carousel"
      aria-label="Featured titles"
      className="relative -mt-16 flex min-h-[600px] h-[92vh] max-h-[960px] w-full items-end overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Backdrop layer */}
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={background ?? "fallback"}
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.2, ease: ease.inOut },
              scale: { duration: SLIDE_MS / 1000 + 2, ease: "linear" },
            }}
            className="absolute inset-0"
          >
            <img
              src={background ?? homeBackground}
              alt=""
              className="h-full w-full object-cover object-[center_20%]"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </motion.div>

      {/* Copy */}
      <motion.div
        style={{ y: contentY, opacity: fade }}
        className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 sm:pb-28 md:px-8 lg:pb-32"
      >
        <AnimatePresence mode="wait" initial={false}>
          {active ? (
            <motion.div
              key={`${active.mediaType}-${active.id}`}
              initial="hidden"
              animate="show"
              exit="exit"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
                exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
              }}
              className="max-w-2xl"
            >
              <motion.div
                variants={line}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4a843]/30 bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#e8c866] backdrop-blur"
              >
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                #{(index % count) + 1} Trending today
              </motion.div>
              <motion.h1
                variants={line}
                className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white text-balance drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)] sm:text-5xl lg:text-7xl"
              >
                {active.title}
              </motion.h1>
              <motion.div variants={line} className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/80">
                {active.rating > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-[#e8c866]">
                    <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                    {active.rating.toFixed(1)}
                  </span>
                )}
                {year && <span>{year}</span>}
                <span className="rounded border border-white/25 px-1.5 py-0.5 text-[11px] uppercase tracking-wider">
                  {mediaType === "tv" ? "Series" : "Movie"}
                </span>
                {active.genres.slice(0, 3).map((g) => (
                  <span key={g} className="text-white/70">
                    {g}
                  </span>
                ))}
              </motion.div>
              {active.description && (
                <motion.p
                  variants={line}
                  className="mt-4 max-w-xl text-base leading-relaxed text-white/75 line-clamp-3 md:text-lg"
                >
                  {active.description}
                </motion.p>
              )}
              <motion.div variants={line} className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-[#d4a843] px-6 font-semibold text-background shadow-[0_10px_40px_-10px_rgba(212,168,67,0.8)] hover:bg-[#e8c866]"
                >
                  <Link to={`/title/${mediaType}/${active.id}`}>
                    <Info className="mr-2 h-4 w-4" aria-hidden="true" />
                    More info
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/25 bg-white/5 px-6 text-white backdrop-blur hover:bg-white/15"
                >
                  <Link to="/discover">
                    <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                    Ask the AI
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl"
            >
              <p className="mb-3 font-display text-xl font-bold uppercase tracking-widest text-[#d4a843]">
                WatchWise
              </p>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
                The right movie. <br />
                <span className="font-normal text-muted-foreground">Right now.</span>
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground/90 md:text-lg">
                Skip the endless scrolling. Our AI surfaces cinematic picks tailored to your mood —
                with trailers, cast, crew and where to watch.
              </p>
              <div className="mt-8">
                <Button asChild size="lg" className="rounded-full bg-[#d4a843] text-background hover:bg-[#e8c866]">
                  <Link to="/discover">
                    <TrendingUp className="mr-2 h-4 w-4" aria-hidden="true" />
                    {isLoading ? "Loading picks…" : "Explore Trending"}
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Poster rail / slide picker */}
      {count > 1 && (
        <div className="absolute bottom-16 right-4 z-20 hidden items-end gap-3 lg:flex lg:right-8">
          {slides.map((s, i) => {
            const isActive = i === index % count;
            return (
              <motion.button
                key={`${s.mediaType}-${s.id}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show ${s.title}`}
                aria-current={isActive}
                animate={{ width: isActive ? 96 : 56, opacity: isActive ? 1 : 0.55 }}
                whileHover={{ opacity: 1, y: -4 }}
                transition={{ duration: 0.45, ease: ease.out }}
                className="relative overflow-hidden rounded-lg border border-white/15 shadow-xl"
                style={{ aspectRatio: "2/3" }}
              >
                {s.poster_path && <img src={s.poster_path} alt="" className="h-full w-full object-cover" />}
                <span className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
                  {isActive && (
                    <motion.span
                      key={`${index}-${paused}`}
                      className="block h-full bg-[#d4a843]"
                      initial={{ width: "0%" }}
                      animate={{ width: paused || reduce ? "0%" : "100%" }}
                      transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                    />
                  )}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Mobile dots */}
      {count > 1 && (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 lg:hidden">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              className="p-1"
            >
              <motion.span
                className="block h-1.5 rounded-full bg-white/40"
                animate={{ width: i === index % count ? 22 : 6, backgroundColor: i === index % count ? "#d4a843" : "rgba(255,255,255,0.4)" }}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

const line = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: ease.out } },
};
