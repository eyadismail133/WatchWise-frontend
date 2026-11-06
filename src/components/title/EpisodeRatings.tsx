import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trophy, TrendingDown, Star } from "lucide-react";
import { trpc } from "../../providers/trpcClient";
import { ErrorState } from "../ScrollRow";
import { formatDate } from "../../lib/types";
import { ease } from "../../lib/motion";

function tone(rating: number, aired: boolean, votes: number) {
  if (!aired || votes === 0) return "bg-white/[0.04] text-muted-foreground/50 border-white/[0.06]";
  if (rating >= 9) return "bg-emerald-400/90 text-black border-emerald-300";
  if (rating >= 8) return "bg-emerald-600/80 text-white border-emerald-500/60";
  if (rating >= 7) return "bg-[#d4a843]/80 text-black border-[#e8c866]/60";
  if (rating >= 6) return "bg-orange-500/70 text-white border-orange-400/50";
  return "bg-red-600/70 text-white border-red-500/50";
}

const LEGEND = [
  { label: "9+", cls: "bg-emerald-400/90" },
  { label: "8–9", cls: "bg-emerald-600/80" },
  { label: "7–8", cls: "bg-[#d4a843]/80" },
  { label: "6–7", cls: "bg-orange-500/70" },
  { label: "<6", cls: "bg-red-600/70" },
  { label: "Unaired", cls: "bg-white/[0.06]" },
];

type Hovered = { season: number; episode: number; name: string; rating: number; airDate: string | null; type: string | null } | null;

/** Season × episode heatmap of TMDB audience scores. */
export function EpisodeRatings({ tvId }: { tvId: number }) {
  const q = trpc.movie.episodeRatings.useQuery({ tvId }, { staleTime: 30 * 60_000 });
  const [hovered, setHovered] = useState<Hovered>(null);

  if (q.isLoading) {
    return <div className="shimmer h-48 rounded-2xl" aria-hidden="true" />;
  }
  if (q.isError || !q.data) {
    return <ErrorState message="Couldn't load episode ratings." onRetry={() => q.refetch()} />;
  }

  const { seasons, best, worst, average } = q.data;
  const maxEpisodes = Math.max(1, ...seasons.map((s) => s.episodes.length));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {average !== null && (
          <div className="rounded-2xl border border-white/[0.07] bg-card/60 p-4">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
              <Star className="h-3.5 w-3.5" aria-hidden="true" /> Average episode
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-[#e8c866]">{average.toFixed(1)}</div>
          </div>
        )}
        {best && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-emerald-300">
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> Highest rated
            </div>
            <div className="mt-1 truncate font-semibold">
              S{best.seasonNumber}·E{best.episodeNumber} {best.name}
            </div>
            <div className="text-sm text-emerald-300">{best.rating.toFixed(1)}</div>
          </div>
        )}
        {worst && worst !== best && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-red-300">
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" /> Lowest rated
            </div>
            <div className="mt-1 truncate font-semibold">
              S{worst.seasonNumber}·E{worst.episodeNumber} {worst.name}
            </div>
            <div className="text-sm text-red-300">{worst.rating.toFixed(1)}</div>
          </div>
        )}
      </div>

      <div className="scrollbar-hide overflow-x-auto rounded-2xl border border-white/[0.07] bg-card/40 p-4">
        <table className="border-separate border-spacing-1" aria-label="Episode ratings by season">
          <thead>
            <tr>
              <th className="sr-only">Season</th>
              {Array.from({ length: maxEpisodes }, (_, i) => (
                <th key={i} scope="col" className="w-10 text-center text-[10px] font-medium text-muted-foreground">
                  E{i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {seasons.map((s, si) => (
              <tr key={s.seasonNumber}>
                <th scope="row" className="pr-2 text-right text-xs font-semibold text-muted-foreground">
                  S{s.seasonNumber}
                </th>
                {s.episodes.map((e, ei) => {
                  const label = `Season ${s.seasonNumber} episode ${e.episodeNumber}, ${e.name}: ${
                    e.aired && e.voteCount > 0 ? e.rating.toFixed(1) : "not rated yet"
                  }`;
                  return (
                    <td key={e.episodeNumber} className="p-0">
                      <motion.button
                        type="button"
                        aria-label={label}
                        initial={{ opacity: 0, scale: 0.4 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.18, zIndex: 2 }}
                        transition={{ duration: 0.35, ease: ease.out, delay: Math.min(si * 0.05 + ei * 0.015, 0.8) }}
                        onMouseEnter={() =>
                          setHovered({ season: s.seasonNumber, episode: e.episodeNumber, name: e.name, rating: e.rating, airDate: e.airDate, type: e.episodeType })
                        }
                        onFocus={() =>
                          setHovered({ season: s.seasonNumber, episode: e.episodeNumber, name: e.name, rating: e.rating, airDate: e.airDate, type: e.episodeType })
                        }
                        onClick={() =>
                          setHovered({ season: s.seasonNumber, episode: e.episodeNumber, name: e.name, rating: e.rating, airDate: e.airDate, type: e.episodeType })
                        }
                        className={`relative flex h-9 w-10 items-center justify-center rounded-md border text-[11px] font-bold tabular-nums ${tone(e.rating, e.aired, e.voteCount)} ${
                          e.episodeType === "finale" ? "ring-1 ring-white/60" : ""
                        }`}
                      >
                        {e.aired && e.voteCount > 0 ? e.rating.toFixed(1) : "–"}
                      </motion.button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-sm ${l.cls}`} aria-hidden="true" /> {l.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm ring-1 ring-white/60" aria-hidden="true" /> Finale
          </span>
        </div>
        <AnimatePresence mode="wait">
          {hovered && (
            <motion.p
              key={`${hovered.season}-${hovered.episode}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              aria-live="polite"
              className="text-sm"
            >
              <span className="text-[#e8c866]">
                S{hovered.season}·E{hovered.episode}
              </span>{" "}
              {hovered.name}
              {hovered.airDate && <span className="text-muted-foreground"> · {formatDate(hovered.airDate)}</span>}
              {hovered.type === "finale" && <span className="text-muted-foreground"> · finale</span>}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
