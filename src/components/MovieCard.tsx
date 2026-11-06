import { useState, type PointerEvent } from "react";
import { Link } from "react-router";
import { BookmarkPlus, BookmarkCheck, Eye, Star, Film, Check } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

import { trpc } from "@/providers/trpcClient";
import { toast } from "sonner";
import { useLibraryItem, useInvalidateLibrary } from "@/hooks/useLibrary";
import { cappedDelay, ease, spring } from "@/lib/motion";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

export type MediaType = "movie" | "tv" | undefined;

export interface NormalizedTitle {
  id: number;
  title: string;
  type: "movie" | "series";
  description: string;
  genres: string[];
  moods: string[];
  rating: number;
  popularity_score: number;
  hidden_gem_score: number;
  poster_path: string | null;
  backdrop_path: string | null;
  backdrop_hd?: string | null;
  releaseDate: string | null;
  mediaType: MediaType;
  voteCount?: number;
  originalLanguage?: string | null;
}

export type TitleData = NormalizedTitle;

interface MovieCardProps {
  title: TitleData;
  variant?: "default" | "large" | "compact";
  showQuickActions?: boolean;
  userStatus?: "want_to_watch" | "watched" | "skipped" | null;
  userRate?: number;
  index?: number;
  /** Optional caption override (e.g. a character name on a person page). */
  subtitle?: string | null;
  /** Show a big rank numeral behind the poster (top 10 rows). */
  rank?: number;
}

const canHover =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function ratingTone(rating: number) {
  if (rating >= 7.5) return "text-emerald-300 border-emerald-400/30";
  if (rating >= 6) return "text-[#e8c866] border-[#d4a843]/30";
  if (rating > 0) return "text-orange-300 border-orange-400/30";
  return "text-white/60 border-white/10";
}

export function MovieCard({
  title,
  variant = "default",
  showQuickActions = true,
  userStatus,
  userRate,
  index = 0,
  subtitle,
  rank,
}: MovieCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);

  const isLarge = variant === "large";
  const isCompact = variant === "compact";

  const year = title.releaseDate?.split("-")?.[0] || "—";
  const rating = typeof title.rating === "number" ? title.rating : 0;

  const tmdbId = title.id;
  const mediaType: "movie" | "tv" =
    title.mediaType === "tv"
      ? "tv"
      : title.mediaType === "movie"
        ? "movie"
        : title.type === "series"
          ? "tv"
          : "movie";

  const { item: watchlistItem, isAuthenticated } = useLibraryItem(tmdbId, mediaType);
  const invalidate = useInvalidateLibrary();
  const ref = { tmdbId, mediaType };

  const addToWatchlist = trpc.watchlist.add.useMutation({
    onSuccess: (_data, vars) => {
      invalidate(ref);
      toast.success(vars && vars.status === "watched" ? "Marked as watched" : "Added to watchlist");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateWatchlist = trpc.watchlist.update.useMutation({
    onSuccess: () => invalidate(ref),
    onError: (err) => toast.error(err.message),
  });

  const removeWatchlist = trpc.watchlist.remove.useMutation({
    onSuccess: () => {
      invalidate(ref);
      toast.success("Removed from your library");
    },
    onError: (err) => toast.error(err.message),
  });

  const isPending =
    addToWatchlist.isPending || updateWatchlist.isPending || removeWatchlist.isPending;

  const status = watchlistItem?.status ?? userStatus ?? null;
  const isInWatchlist = status === "want_to_watch";
  const isWatched = status === "watched";
  const currentUserRating =
    userRate !== undefined ? userRate : (watchlistItem?.userRating ?? 0);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      toast.error("Sign in to use watchlist and favorites");
      return;
    }
    if (isPending) return;
    action();
  };

  const handleAddToWatchlist = () =>
    requireAuth(() => {
      if (isInWatchlist && watchlistItem) {
        removeWatchlist.mutate({ id: watchlistItem.id });
      } else if (watchlistItem) {
        updateWatchlist.mutate({ id: watchlistItem.id, status: "want_to_watch" });
      } else {
        addToWatchlist.mutate({ tmdbId, mediaType, status: "want_to_watch" });
      }
    });

  const handleMarkWatched = () =>
    requireAuth(() => {
      if (isWatched && watchlistItem) {
        removeWatchlist.mutate({ id: watchlistItem.id });
      } else if (watchlistItem) {
        updateWatchlist.mutate({ id: watchlistItem.id, status: "watched" });
        setRatingDialogOpen(true);
      } else {
        addToWatchlist.mutate(
          { tmdbId, mediaType, status: "watched" },
          { onSuccess: () => setRatingDialogOpen(true) },
        );
      }
    });

  const handleRate = () => {
    if (watchlistItem && userRating > 0) {
      updateWatchlist.mutate({ id: watchlistItem.id, userRating });
      toast.success(`Rated ${userRating}/5`);
    }
    setRatingDialogOpen(false);
  };

  // --- 3D tilt + glare (fine pointers only, no re-renders) ---
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [7, -7]), spring.soft);
  const rotateY = useSpring(useTransform(px, [0, 1], [-9, 9]), spring.soft);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.22), transparent 55%)`;

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!canHover) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onPointerLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  // Cards are ~180px wide: ask TMDB for right-sized posters instead of w500.
  const imageSrc = isLarge
    ? (title.backdrop_path ?? title.poster_path)
    : (title.poster_path?.replace("/w500/", "/w342/") ?? null);
  const srcSet = !isLarge && title.poster_path?.includes("/w500/")
    ? ["w185 185w", "w342 342w", "w500 500w"].map((v) => title.poster_path!.replace("/w500/", `/${v.split(" ")[0]}/`) + ` ${v.split(" ")[1]}`).join(", ")
    : undefined;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.55, ease: ease.out, delay: cappedDelay(index, 0.04, 10) }}
        className="relative group [perspective:1000px]"
      >
        {typeof rank === "number" && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-3 bottom-10 z-0 font-display text-[7rem] leading-none font-bold text-transparent [-webkit-text-stroke:2px_rgba(212,168,67,0.55)] select-none"
          >
            {rank}
          </span>
        )}

        <motion.div
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          whileHover={canHover ? { y: -6 } : undefined}
          whileTap={{ scale: 0.97 }}
          transition={spring.snappy}
          style={canHover ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
          className={`relative z-10 ${typeof rank === "number" ? "ml-8" : ""}`}
        >
          <Link
            to={`/title/${mediaType}/${title.id}`}
            className="block rounded-xl focus-visible:outline-offset-4"
            aria-label={`${title.title} (${year})`}
          >
            <div
              className={`relative overflow-hidden rounded-xl bg-card ring-1 transition-[box-shadow,ring-color] duration-500 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] group-hover:shadow-[0_24px_60px_-18px_rgba(212,168,67,0.35)] ${
                isInWatchlist || isWatched
                  ? "ring-[#d4a843]/60"
                  : "ring-white/[0.06] group-hover:ring-[#d4a843]/40"
              }`}
              style={{ aspectRatio: isLarge ? "16/9" : "2/3" }}
            >
              {imageSrc ? (
                <>
                  {!loaded && <div className="absolute inset-0 shimmer" aria-hidden="true" />}
                  <img
                    src={imageSrc}
                    srcSet={srcSet}
                    sizes={isLarge ? "(min-width: 640px) 352px, 78vw" : "(min-width: 1024px) 192px, (min-width: 640px) 176px, 38vw"}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setLoaded(true)}
                    className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.07] ${
                      loaded ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1a1824] via-card to-[#14121c] p-3 text-center">
                  <Film className="h-8 w-8 text-[#d4a843]/40" aria-hidden="true" />
                  <span className="font-display text-xs text-white/50 line-clamp-3">{title.title}</span>
                </div>
              )}

              {/* readability gradient + hover deepen */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100" />

              {/* glare follows the pointer */}
              {canHover && (
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 mix-blend-overlay"
                  style={{ background: glare }}
                />
              )}

              {/* rating chip */}
              {rating > 0 && (
                <div
                  className={`absolute left-2 top-2 flex items-center gap-1 rounded-full border bg-black/60 px-2 py-0.5 text-[11px] font-semibold ${ratingTone(rating)}`}
                >
                  <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                  {rating.toFixed(1)}
                </div>
              )}

              {/* personal rating */}
              {currentUserRating > 0 && isWatched && (
                <div className="absolute left-2 top-8 flex items-center gap-0.5 rounded-full bg-[#d4a843] px-1.5 py-0.5 text-[10px] font-bold text-black">
                  <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                  {currentUserRating}/5
                </div>
              )}

              {/* hover synopsis */}
              {!isCompact && (
                <div className="absolute inset-x-0 bottom-0 translate-y-3 p-3 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:hidden">
                  {title.genres.length > 0 && (
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {title.genres.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/90"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                  {title.description && (
                    <p className="text-[11px] leading-snug text-white/75 line-clamp-3">
                      {title.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-2.5 px-0.5">
              <h3
                className={`font-body font-semibold leading-tight text-foreground transition-colors group-hover:text-[#e8c866] line-clamp-1 ${
                  isLarge ? "text-base" : isCompact ? "text-xs" : "text-sm"
                }`}
              >
                {title.title}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                {subtitle ?? (
                  <>
                    {year} · {mediaType === "tv" ? "Series" : "Movie"}
                  </>
                )}
              </p>
            </div>
          </Link>

          {/* status badge + quick actions live outside the link (no nested interactive elements) */}
          {showQuickActions && (
            <div
              className={`absolute right-2 top-2 flex flex-col gap-1.5 ${
                status ? "" : "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-within:opacity-100"
              } transition-opacity duration-300`}
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.08 }}
                transition={spring.snappy}
                onClick={handleAddToWatchlist}
                disabled={isPending}
                aria-pressed={isInWatchlist}
                aria-label={isInWatchlist ? `Remove ${title.title} from watchlist` : `Add ${title.title} to watchlist`}
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors disabled:opacity-60 ${
                  isInWatchlist
                    ? "border-[#d4a843] bg-[#d4a843] text-black"
                    : "border-white/20 bg-black/50 text-white hover:bg-[#d4a843] hover:text-black"
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isInWatchlist ? "on" : "off"}
                    initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={spring.bouncy}
                  >
                    {isInWatchlist ? (
                      <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.08 }}
                transition={spring.snappy}
                onClick={handleMarkWatched}
                disabled={isPending}
                aria-pressed={isWatched}
                aria-label={isWatched ? `Unmark ${title.title} as watched` : `Mark ${title.title} as watched`}
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors disabled:opacity-60 ${
                  isWatched
                    ? "border-emerald-400 bg-emerald-500 text-white"
                    : "border-white/20 bg-black/50 text-white hover:bg-emerald-500"
                }`}
              >
                {isWatched ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>

      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Rate &quot;{title.title}&quot;</DialogTitle>
            <DialogDescription>
              How would you rate this {mediaType === "tv" ? "series" : "movie"}?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div
              className="flex items-center justify-center gap-2"
              onMouseLeave={() => setHoverStar(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const lit = star <= (hoverStar || userRating);
                return (
                  <motion.button
                    key={star}
                    type="button"
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    aria-pressed={star === userRating}
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setHoverStar(star)}
                    whileHover={{ scale: 1.2, rotate: -8 }}
                    whileTap={{ scale: 0.85 }}
                    animate={lit ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                    transition={spring.bouncy}
                    className="p-1"
                  >
                    <Star
                      className={`h-9 w-9 transition-colors ${
                        lit ? "fill-[#e8c866] text-[#e8c866]" : "text-muted-foreground"
                      }`}
                    />
                  </motion.button>
                );
              })}
            </div>

            <Button
              onClick={handleRate}
              disabled={userRating === 0}
              className="mt-6 w-full bg-[#d4a843] text-background hover:bg-[#e8c866]"
            >
              Submit Rating
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
