import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight, Film, Tv, Radio } from "lucide-react";
import { trpc } from "../providers/trpcClient";
import { MovieCard, type TitleData } from "../components/MovieCard";
import { ErrorState, SkeletonCard } from "../components/ScrollRow";
import { SegmentedControl } from "../components/motion/SegmentedControl";
import { RegionPicker } from "../components/RegionPicker";
import { useRegion } from "../hooks/useRegion";
import { usePageMeta } from "../hooks/usePageMeta";
import { ease } from "../lib/motion";

const grid = "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function startOfWeek(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (copy.getDay() + 6) % 7; // Monday = 0
  copy.setDate(copy.getDate() - day);
  return copy;
}

function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", opts);

function relative(dateIso: string, todayIso: string) {
  const diff = Math.round((Date.parse(dateIso) - Date.parse(todayIso)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return diff > 0 ? `In ${diff} days` : `${-diff} days ago`;
}

/** Week-by-week release calendar for theatrical movies and airing TV. */
export default function Calendar() {
  const [region] = useRegion();
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [offset, setOffset] = useState(0);
  const [direction, setDirection] = useState(0);

  const today = new Date();
  const todayIso = iso(today);
  const weekStart = addDays(startOfWeek(today), offset * 7);
  const weekEnd = addDays(weekStart, 6);
  const from = iso(weekStart);
  const to = iso(weekEnd);

  usePageMeta(
    "Release calendar",
    "See which movies open in theaters near you and which TV shows air new episodes this week, with trailers, ratings and where to watch.",
  );

  const q = trpc.movie.releaseCalendar.useQuery(
    { mediaType, from, to, region: mediaType === "movie" ? region : undefined },
    { staleTime: 30 * 60_000 },
  );
  const results = (q.data?.results ?? []) as TitleData[];

  // Movies: group by date when TMDB's date falls inside the week.
  const days = Array.from({ length: 7 }, (_, i) => iso(addDays(weekStart, i)));
  const byDay = new Map<string, TitleData[]>();
  const other: TitleData[] = [];
  for (const t of results) {
    const d = t.releaseDate ?? "";
    if (mediaType === "movie" && days.includes(d)) byDay.set(d, [...(byDay.get(d) ?? []), t]);
    else other.push(t);
  }

  const go = (delta: number) => {
    setDirection(delta);
    setOffset((o) => (delta === 0 ? 0 : o + delta));
  };

  return (
    <div className="min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: ease.out }}
          className="mb-8"
        >
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#e8c866]">
            <CalendarDays className="h-4 w-4" aria-hidden="true" /> Release calendar
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight">What&apos;s out this week</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Theatrical releases for your country and TV shows with new episodes, week by week.
          </p>
        </motion.header>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <SegmentedControl
            id="calendar-media"
            label="Media type"
            value={mediaType}
            onChange={setMediaType}
            options={[
              { value: "movie", label: "In theaters", icon: Film },
              { value: "tv", label: "On TV", icon: Tv },
            ]}
          />
          {mediaType === "movie" && <RegionPicker />}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous week"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 hover:border-white/25"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.span
                key={from}
                initial={{ opacity: 0, x: direction * 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -20 }}
                transition={{ duration: 0.25 }}
                className="min-w-[11rem] text-center text-sm font-medium tabular-nums"
                aria-live="polite"
              >
                {fmt(weekStart, { month: "short", day: "numeric" })} – {fmt(weekEnd, { month: "short", day: "numeric", year: "numeric" })}
              </motion.span>
            </AnimatePresence>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next week"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 hover:border-white/25"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            {offset !== 0 && (
              <button type="button" onClick={() => go(0)} className="text-xs text-[#d4a843] hover:text-[#e8c866]">
                This week
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${mediaType}-${from}-${region}`}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.35, ease: ease.out }}
          >
            {q.isLoading ? (
              <div className={grid}>{Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} />)}</div>
            ) : q.isError ? (
              <ErrorState message="We couldn't load this week's releases." onRetry={() => q.refetch()} />
            ) : results.length === 0 ? (
              <p className="py-20 text-center text-muted-foreground">No releases found for this week.</p>
            ) : (
              <div className="space-y-10">
                {days
                  .filter((d) => byDay.has(d))
                  .map((d) => (
                    <section key={d} aria-labelledby={`day-${d}`}>
                      <div className="mb-4 flex items-baseline gap-3 border-b border-white/[0.06] pb-2">
                        <h2 id={`day-${d}`} className="font-display text-xl font-bold">
                          {fmt(new Date(`${d}T12:00:00`), { weekday: "long", month: "short", day: "numeric" })}
                        </h2>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            d === todayIso ? "bg-[#d4a843] text-background" : "bg-white/5 text-muted-foreground"
                          }`}
                        >
                          {relative(d, todayIso)}
                        </span>
                      </div>
                      <div className={grid}>
                        {byDay.get(d)!.map((t, i) => (
                          <MovieCard key={`${t.mediaType}-${t.id}`} title={t} index={i} />
                        ))}
                      </div>
                    </section>
                  ))}
                {other.length > 0 && (
                  <section aria-labelledby="other-heading">
                    <div className="mb-4 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                      {mediaType === "tv" ? (
                        <Radio className="h-4 w-4 text-[#e86a5c]" aria-hidden="true" />
                      ) : (
                        <Film className="h-4 w-4 text-[#d4a843]" aria-hidden="true" />
                      )}
                      <h2 id="other-heading" className="font-display text-xl font-bold">
                        {mediaType === "tv" ? "New episodes this week" : `Also opening in ${region}`}
                      </h2>
                    </div>
                    <div className={grid}>
                      {other.map((t, i) => (
                        <MovieCard
                          key={`${t.mediaType}-${t.id}`}
                          title={t}
                          index={i}
                          subtitle={mediaType === "tv" ? "New episodes" : undefined}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
