import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { CalendarDays, ChevronDown, Clock, Star, Tv } from "lucide-react";
import { trpc } from "../../providers/trpcClient";
import type { RichTitle } from "../../lib/types";
import { formatDate, formatRuntime } from "../../lib/types";
import { cappedDelay, ease, spring } from "../../lib/motion";
import { ErrorState } from "../ScrollRow";

type Season = RichTitle["seasons"][number];

/** Season picker + animated episode list for TV shows. */
export function SeasonGuide({ tvId, seasons }: { tvId: number; seasons: Season[] }) {
  const regular = seasons.filter((s) => s.seasonNumber > 0);
  const initial = (regular.length ? regular : seasons).at(-1)?.seasonNumber ?? 1;
  const [seasonNumber, setSeasonNumber] = useState(initial);
  const [expanded, setExpanded] = useState<number | null>(null);

  const season = trpc.movie.season.useQuery(
    { tvId, seasonNumber },
    { staleTime: 10 * 60_000 },
  );

  const summary = seasons.find((s) => s.seasonNumber === seasonNumber);

  return (
    <div>
      <LayoutGroup id="season-picker">
        <div role="tablist" aria-label="Seasons" className="scrollbar-hide -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
          {seasons.map((s) => {
            const active = s.seasonNumber === seasonNumber;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSeasonNumber(s.seasonNumber);
                  setExpanded(null);
                }}
                className={`relative isolate whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "border-transparent text-background" : "border-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="season-pill"
                    transition={spring.layout}
                    className="absolute inset-0 -z-10 rounded-full bg-[#d4a843]"
                  />
                )}
                {s.seasonNumber === 0 ? "Specials" : `S${s.seasonNumber}`}
                <span className={`ml-1.5 text-xs ${active ? "text-background/70" : "text-muted-foreground/70"}`}>
                  {s.episodeCount} ep
                </span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <AnimatePresence mode="wait">
        <motion.div
          key={seasonNumber}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: ease.out }}
        >
          {summary && (
            <div className="mb-6 flex gap-4 rounded-2xl border border-white/[0.07] bg-card/60 p-4">
              {summary.poster && (
                <img src={summary.poster} alt="" className="hidden h-36 w-24 flex-shrink-0 rounded-lg object-cover sm:block" />
              )}
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold">{summary.name}</h3>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {summary.airDate && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> {formatDate(summary.airDate)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Tv className="h-3.5 w-3.5" aria-hidden="true" /> {summary.episodeCount} episodes
                  </span>
                  {summary.rating > 0 && (
                    <span className="flex items-center gap-1 text-[#e8c866]">
                      <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> {summary.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                {summary.overview && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-4">{summary.overview}</p>
                )}
              </div>
            </div>
          )}

          {season.isLoading ? (
            <div className="space-y-3" aria-hidden="true">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="shimmer aspect-video w-40 flex-shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2 py-2">
                    <div className="shimmer h-4 w-1/2 rounded" />
                    <div className="shimmer h-3 w-full rounded" />
                    <div className="shimmer h-3 w-4/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : season.isError ? (
            <ErrorState message="Couldn't load this season." onRetry={() => season.refetch()} />
          ) : (
            <ol className="space-y-3">
              {(season.data?.episodes ?? []).map((ep, i) => {
                const isOpen = expanded === ep.id;
                const upcoming = ep.airDate ? new Date(ep.airDate) > new Date() : false;
                return (
                  <motion.li
                    key={ep.id}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: ease.out, delay: cappedDelay(i, 0.035) }}
                    className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card/50 transition-colors hover:border-[#d4a843]/30"
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : ep.id)}
                      aria-expanded={isOpen}
                      className="flex w-full gap-4 p-3 text-left"
                    >
                      <div className="relative aspect-video w-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:w-44">
                        {ep.still ? (
                          <img src={ep.still} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                            <Tv className="h-6 w-6" aria-hidden="true" />
                          </div>
                        )}
                        <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold">
                          E{ep.episodeNumber}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold leading-snug">{ep.name}</h4>
                          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="mt-0.5 flex-shrink-0 text-muted-foreground">
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                          </motion.span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {ep.airDate && <span>{formatDate(ep.airDate)}</span>}
                          {ep.runtime ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" aria-hidden="true" /> {formatRuntime(ep.runtime)}
                            </span>
                          ) : null}
                          {ep.rating > 0 && (
                            <span className="flex items-center gap-1 text-[#e8c866]">
                              <Star className="h-3 w-3 fill-current" aria-hidden="true" /> {ep.rating.toFixed(1)}
                            </span>
                          )}
                          {upcoming && <span className="rounded bg-[#8a6fbf]/25 px-1.5 text-[#c4b1ea]">Upcoming</span>}
                          {ep.episodeType === "finale" && (
                            <span className="rounded bg-[#e86a5c]/20 px-1.5 text-[#f39a8f]">Season finale</span>
                          )}
                          {ep.episodeType === "mid_season" && (
                            <span className="rounded bg-[#d4a843]/20 px-1.5 text-[#e8c866]">Mid-season finale</span>
                          )}
                        </div>
                        {!isOpen && ep.overview && (
                          <p className="mt-1.5 hidden text-sm text-muted-foreground line-clamp-2 sm:block">{ep.overview}</p>
                        )}
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: ease.out }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 px-4 pb-4">
                            <p className="text-sm leading-relaxed text-foreground/85">
                              {ep.overview || "No synopsis available yet."}
                            </p>
                            {ep.directors.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Directed by <span className="text-foreground">{ep.directors.join(", ")}</span>
                              </p>
                            )}
                            {ep.guestStars.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {ep.guestStars.map((g) => (
                                  <span key={g.id} className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 text-xs">
                                    <span className="h-6 w-6 overflow-hidden rounded-full bg-muted">
                                      {g.image && <img src={g.image} alt="" className="h-full w-full object-cover" />}
                                    </span>
                                    {g.name}
                                    {g.character && <span className="text-muted-foreground">as {g.character}</span>}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
