import { useMemo, useState } from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import { useParams, Link, useSearchParams, useNavigate } from "react-router";
import { motion, useScroll, useTransform } from "motion/react";
import {
  BookmarkPlus,
  BookmarkCheck,
  Eye,
  Share2,
  Star,
  Play,
  ChevronLeft,
  Clock,
  Globe,
  Heart,
  Film,
  Images,
  Clapperboard,
  Users,
  ThumbsUp,
  Layers,
  ExternalLink,
  CalendarDays,
  Tv,
  Hash,
  Sparkles,
  MessageSquareQuote,
} from "lucide-react";
import { toast } from "sonner";

import { CommentsSection } from "../components/CommentsSection";
import { trpc } from "../providers/trpcClient";
import { MovieCard, type TitleData } from "../components/MovieCard";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { RowItem, ScrollRow, SectionHeader } from "../components/ScrollRow";
import { PersonCard } from "../components/PersonCard";
import { RatingRing } from "../components/RatingRing";
import { TrailerDialog } from "../components/TrailerDialog";
import { Lightbox } from "../components/Lightbox";
import { Reveal } from "../components/motion/Reveal";
import { SectionNav, type SectionLink } from "../components/title/SectionNav";
import { WatchProviders } from "../components/title/WatchProviders";
import { ReviewCard } from "../components/title/ReviewCard";
import { SeasonGuide } from "../components/title/SeasonGuide";
import { EpisodeRatings } from "../components/title/EpisodeRatings";
import { RegionPicker } from "../components/RegionPicker";
import { useRegion } from "../hooks/useRegion";
import {
  formatDate,
  formatMoney,
  formatRuntime,
  type RichTitle,
} from "../lib/types";
import { cappedDelay, ease, spring } from "../lib/motion";

const heroLine = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: ease.out } },
};

export default function TitleDetail() {
  const { id, mediaType: mediaTypeParam } = useParams<{
    id: string;
    mediaType?: string;
  }>();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [region] = useRegion();

  const tmdbId = parseInt(id || "0", 10);
  const mediaType: "movie" | "tv" =
    mediaTypeParam === "tv"
      ? "tv"
      : mediaTypeParam === "movie"
        ? "movie"
        : searchParams.get("mediaType") === "tv"
          ? "tv"
          : "movie";

  const titleQuery = trpc.movie.details.useQuery(
    { id: tmdbId, mediaType, region },
    { enabled: tmdbId > 0 },
  );

  const similarQuery = trpc.movie.similar.useQuery(
    { id: tmdbId, mediaType, page: 1 },
    { enabled: tmdbId > 0 },
  );

  const watchlistQuery = trpc.watchlist.getByTitle.useQuery(
    { tmdbId, mediaType },
    { enabled: isAuthenticated && tmdbId > 0 },
  );

  const favoriteQuery = trpc.favorite.isFavorite.useQuery(
    { tmdbId, mediaType },
    { enabled: isAuthenticated && tmdbId > 0 },
  );

  const utils = trpc.useUtils();

  const invalidateWatchlist = () => {
    utils.watchlist.getByTitle.invalidate({ tmdbId, mediaType });
    utils.watchlist.list.invalidate();
    utils.watchlist.statusMap?.invalidate();
  };

  const addToWatchlist = trpc.watchlist.add.useMutation({
    onSuccess: () => {
      invalidateWatchlist();
      toast.success("Added to watchlist");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateWatchlist = trpc.watchlist.update.useMutation({
    onSuccess: invalidateWatchlist,
    onError: (err) => toast.error(err.message),
  });

  const addFavorite = trpc.favorite.add.useMutation({
    onSuccess: () => {
      utils.favorite.isFavorite.invalidate({ tmdbId, mediaType });
      toast.success("Added to favorites");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeFavorite = trpc.favorite.remove.useMutation({
    onSuccess: () => {
      utils.favorite.isFavorite.invalidate({ tmdbId, mediaType });
      toast.success("Removed from favorites");
    },
    onError: (err) => toast.error(err.message),
  });

  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [failedSources, setFailedSources] = useState<Record<string, boolean>>({});
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [expandedCast, setExpandedCast] = useState(false);

  // Page-scroll parallax (no target ref, so loading/error states are safe).
  const { scrollY } = useScroll();
  const heroImageY = useTransform(scrollY, [0, 800], ["0%", "18%"]);
  const heroImageScale = useTransform(scrollY, [0, 800], [1, 1.08]);

  const title = titleQuery.data as RichTitle | undefined;
  usePageMeta(
    title ? `${title.title}${title.releaseYear ? ` (${title.releaseYear})` : ""}` : undefined,
    title
      ? `${title.description || title.title} Cast, trailers, ratings and where to watch ${title.title}.`
      : undefined,
  );
  const similar = (similarQuery.data?.results ?? []) as TitleData[];
  const watchlistItem = watchlistQuery.data;
  const isFavorite = favoriteQuery.data?.isFavorite ?? false;

  const sections = useMemo<SectionLink[]>(() => {
    if (!title) return [];
    const list: SectionLink[] = [{ id: "overview", label: "Overview" }];
    if ((title.castCards?.length ?? 0) > 0 || (title.crewHighlights?.length ?? 0) > 0)
      list.push({ id: "cast", label: "Cast & Crew" });
    if (mediaType === "tv" && (title.seasons?.length ?? 0) > 0) list.push({ id: "seasons", label: "Season guide" });
    if (mediaType === "tv" && (title.seasons?.some((x) => x.seasonNumber > 0) ?? false))
      list.push({ id: "ratings", label: "Episode ratings" });
    if ((title.videos?.length ?? 0) > 0) list.push({ id: "videos", label: "Videos" });
    if ((title.gallery?.backdrops?.length ?? 0) > 0) list.push({ id: "photos", label: "Photos" });
    if ((title.reviews?.length ?? 0) > 0) list.push({ id: "reviews", label: "Reviews" });
    list.push({ id: "discussion", label: "Discussion" });
    if ((title.recommendations?.length ?? 0) > 0 || similar.length > 0)
      list.push({ id: "more", label: "More like this" });
    return list;
  }, [title, mediaType, similar.length]);

  if (titleQuery.isLoading) {
    return (
      <div className="min-h-screen" aria-busy="true">
        <div className="relative -mt-16 h-[70vh] min-h-[480px] w-full shimmer" />
        <div className="mx-auto -mt-40 max-w-6xl space-y-4 px-4 md:px-8">
          <div className="shimmer h-12 w-2/3 rounded-lg" />
          <div className="shimmer h-4 w-1/3 rounded" />
          <div className="shimmer h-4 w-1/2 rounded" />
        </div>
      </div>
    );
  }

  if (!title) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Film className="mx-auto mb-4 h-14 w-14 text-[#d4a843]/40" aria-hidden="true" />
          <h2 className="mb-2 font-display text-2xl font-bold">Title Not Found</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {titleQuery.isError && titleQuery.error?.data?.code !== "NOT_FOUND"
              ? "We couldn't reach the catalog. Please try again."
              : "This title doesn't exist or was removed."}
          </p>
          <div className="flex justify-center gap-3">
            {titleQuery.isError && titleQuery.error?.data?.code !== "NOT_FOUND" && (
              <Button variant="outline" onClick={() => titleQuery.refetch()}>
                Retry
              </Button>
            )}
            <Link to="/" className="inline-flex items-center rounded-md bg-[#d4a843] px-4 py-2 text-sm font-medium text-background hover:bg-[#e8c866]">
              Go back home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      toast.error("Sign in to use watchlist and favorites");
      return;
    }
    action();
  };

  const watchlistBusy = addToWatchlist.isPending || updateWatchlist.isPending;
  const favoriteBusy = addFavorite.isPending || removeFavorite.isPending;

  const handleAddToWatchlist = () => {
    requireAuth(() => {
      if (watchlistBusy) return;
      if (watchlistItem) {
        if (watchlistItem.status !== "want_to_watch") {
          updateWatchlist.mutate({ id: watchlistItem.id, status: "want_to_watch" });
        }
        return;
      }
      addToWatchlist.mutate({ tmdbId, mediaType, status: "want_to_watch" });
    });
  };

  const handleMarkWatched = () => {
    requireAuth(() => {
      if (watchlistBusy) return;
      if (watchlistItem) {
        updateWatchlist.mutate({ id: watchlistItem.id, status: "watched" });
        setRatingDialogOpen(true);
      } else {
        addToWatchlist.mutate(
          { tmdbId, mediaType, status: "watched" },
          { onSuccess: () => setRatingDialogOpen(true) },
        );
      }
    });
  };

  const handleToggleFavorite = () => {
    requireAuth(() => {
      if (favoriteBusy) return;
      if (isFavorite) removeFavorite.mutate({ tmdbId, mediaType });
      else addFavorite.mutate({ tmdbId, mediaType });
    });
  };

  const handleRate = () => {
    if (watchlistItem && userRating > 0) {
      updateWatchlist.mutate({ id: watchlistItem.id, userRating });
    }
    setRatingDialogOpen(false);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: title.title, text: `Check out ${title.title} on WatchWise`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied");
      }
    } catch {
      // user cancelled sharing
    }
  };

  // ---- artwork fallback chain: backdrop → poster → illustrated fallback ----
  const backdropSrc = title.backdrop_hd ?? title.backdrop_path;
  const posterSrc = title.poster_path;
  const currentImageSrc =
    backdropSrc && !failedSources[backdropSrc]
      ? backdropSrc
      : posterSrc && !failedSources[posterSrc]
        ? posterSrc
        : null;
  const isPortraitPoster = Boolean(currentImageSrc && currentImageSrc === posterSrc);
  const handleImageError = () => {
    if (currentImageSrc) setFailedSources((prev) => ({ ...prev, [currentImageSrc]: true }));
  };

  const castCards = title.castCards ?? [];
  const crew = title.crewHighlights ?? [];
  const videos = title.videos ?? [];
  const backdrops = title.gallery?.backdrops ?? [];
  const posters = title.gallery?.posters ?? [];
  const reviews = title.reviews ?? [];
  const recommendations = (title.recommendations ?? []) as TitleData[];
  const keywords = title.keywords ?? [];
  const logo = title.gallery?.logo ?? null;
  const runtime = formatRuntime(title.runtime);
  const status = watchlistItem?.status;
  const visibleCast = expandedCast ? castCards : castCards.slice(0, 12);

  type Fact = { label: string; value: string | number | null };
  const facts: Fact[] = [
    title.status ? { label: "Status", value: title.status } : null,
    title.releaseDate ? { label: mediaType === "tv" ? "First aired" : "Released", value: formatDate(title.releaseDate) ?? title.releaseYear } : title.releaseYear ? { label: "Released", value: title.releaseYear } : null,
    mediaType === "tv" && title.lastAirDate ? { label: "Last aired", value: formatDate(title.lastAirDate) } : null,
    runtime ? { label: "Runtime", value: runtime } : null,
    title.language ? { label: "Language", value: title.language } : null,
    title.country ? { label: "Country", value: title.country } : null,
    title.originalTitle && title.originalTitle !== title.title ? { label: "Original title", value: title.originalTitle } : null,
    mediaType === "tv" && title.numberOfSeasons ? { label: "Seasons", value: title.numberOfSeasons } : null,
    mediaType === "tv" && title.numberOfEpisodes ? { label: "Episodes", value: title.numberOfEpisodes } : null,
    title.director ? { label: mediaType === "tv" ? "Created by" : "Director", value: title.director } : null,
    title.budget ? { label: "Budget", value: formatMoney(title.budget) } : null,
    title.revenue ? { label: "Box office", value: formatMoney(title.revenue) } : null,
    (title.spokenLanguages?.length ?? 0) > 1 ? { label: "Spoken", value: title.spokenLanguages!.slice(0, 4).join(", ") } : null,
  ].filter((f): f is Fact => f !== null);

  const externalLinks = [
    title.externalIds?.imdb ? { label: "IMDb", href: `https://www.imdb.com/title/${title.externalIds.imdb}` } : null,
    { label: "TMDB", href: `https://www.themoviedb.org/${mediaType}/${title.id}` },
    title.homepage ? { label: "Official site", href: title.homepage } : null,
    title.externalIds?.instagram ? { label: "Instagram", href: `https://instagram.com/${title.externalIds.instagram}` } : null,
    title.externalIds?.twitter ? { label: "X / Twitter", href: `https://x.com/${title.externalIds.twitter}` } : null,
  ].filter((l): l is { label: string; href: string } => l !== null);

  const companies = [
    ...(title.networks ?? []).map((c) => ({ ...c, kind: "network" as const })),
    ...(title.productionCompanies ?? []).map((c) => ({ ...c, kind: "company" as const })),
  ].slice(0, 8);

  return (
    <div className="min-h-screen">
      {/* ================= HERO ================= */}
      <section
        data-testid="detail-hero"
        className="relative -mt-16 flex min-h-[560px] w-full flex-col justify-between overflow-hidden border-b border-white/[0.06] bg-card/40 pt-16 md:min-h-[640px] lg:min-h-[720px]"
      >
        {currentImageSrc ? (
          <motion.div
            style={{ y: heroImageY, scale: heroImageScale }}
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <motion.img
              data-testid="detail-hero-image"
              key={currentImageSrc}
              src={currentImageSrc}
              alt=""
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: isPortraitPoster ? 0.55 : 1, scale: 1 }}
              transition={{ duration: 1.4, ease: ease.cinematic }}
              className={`h-full w-full ${
                isPortraitPoster ? "object-contain object-top blur-[2px] md:object-right-top" : "object-cover object-[center_25%]"
              }`}
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          </motion.div>
        ) : (
          <div
            data-testid="detail-hero-fallback"
            className="pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center bg-gradient-to-br from-card/80 via-background to-card/40"
          >
            <div className="p-6 text-center text-muted-foreground/30">
              <Film className="mx-auto mb-2 h-20 w-20 stroke-[1.2]" aria-hidden="true" />
              <span className="text-sm font-semibold uppercase tracking-widest">No Artwork Available</span>
            </div>
          </div>
        )}

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 md:px-8">
          <Link
            to="/"
            onClick={(e) => {
              if (window.history.length > 1) {
                e.preventDefault();
                navigate(-1);
              }
            }}
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3.5 py-1.5 text-sm font-medium text-white/90 transition-all hover:bg-black/60 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            Back
          </Link>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-end gap-8 px-4 pb-10 pt-10 sm:px-6 md:px-8 md:pb-14">
          {/* Floating poster */}
          {posterSrc && !failedSources[posterSrc] && (
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.9, ease: ease.out, delay: 0.1 }}
              whileHover={{ rotate: 1.5, scale: 1.02 }}
              className="hidden w-56 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] md:block lg:w-64"
            >
              <img src={posterSrc} alt={`${title.title} poster`} className="aspect-[2/3] w-full object-cover" />
            </motion.div>
          )}

          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
            className="min-w-0 flex-1"
          >
            {status && (
              <motion.span
                variants={heroLine}
                className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                  status === "watched"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : status === "want_to_watch"
                      ? "bg-[#8a6fbf]/25 text-[#c4b1ea]"
                      : "bg-red-500/20 text-red-400"
                }`}
              >
                {status === "watched" ? "Watched" : status === "want_to_watch" ? "In Your Watchlist" : "Skipped"}
              </motion.span>
            )}

            <motion.h1 variants={heroLine} className="mb-3 max-w-3xl font-display text-3xl font-bold leading-[1.05] text-white text-balance sm:text-4xl md:text-6xl">
              {logo ? (
                <img
                  src={logo}
                  alt={title.title}
                  className="max-h-28 w-auto max-w-[min(100%,28rem)] object-contain object-left drop-shadow-[0_6px_30px_rgba(0,0,0,0.7)] md:max-h-36"
                />
              ) : (
                title.title
              )}
            </motion.h1>

            {title.tagline && (
              <motion.p variants={heroLine} className="mb-3 max-w-2xl text-base italic text-white/70 md:text-lg">
                “{title.tagline}”
              </motion.p>
            )}

            <motion.div variants={heroLine} className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/80">
              {title.certification && (
                <span className="rounded border border-white/30 px-1.5 py-0.5 text-xs font-semibold">{title.certification}</span>
              )}
              {title.releaseYear && <span>{title.releaseYear}</span>}
              <span className="capitalize">{title.type}</span>
              {runtime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {runtime}
                </span>
              )}
              {title.language && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  {title.language}
                </span>
              )}
              <span className="font-bold text-[#e8c866]">{title.rating.toFixed(1)}/10</span>
            </motion.div>

            <motion.div variants={heroLine} className="mb-6 flex max-w-2xl flex-wrap gap-2">
              {(title.genreList?.length ? title.genreList : title.genres.map((g, i) => ({ id: i, name: g }))).map((g) => (
                <span
                  key={g.name}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/90"
                >
                  {g.name}
                </span>
              ))}
            </motion.div>

            <motion.div variants={heroLine} className="flex flex-wrap items-center gap-3">
              {title.trailerKey && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={spring.snappy}
                  onClick={() => setVideoKey(title.trailerKey ?? null)}
                  className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#d4a843] pl-2 pr-5 font-semibold text-background shadow-[0_10px_40px_-10px_rgba(212,168,67,0.9)]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background/20">
                    <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  </span>
                  Play Trailer
                </motion.button>
              )}
              <Button
                onClick={handleAddToWatchlist}
                disabled={watchlistBusy}
                variant={status === "want_to_watch" ? "default" : "outline"}
                className={`h-11 rounded-full ${
                  status === "want_to_watch"
                    ? "bg-[#8a6fbf] hover:bg-[#9a7fcf]"
                    : "border-white/25 bg-white/5 text-white hover:bg-white/15"
                }`}
              >
                {status === "want_to_watch" ? (
                  <BookmarkCheck className="mr-2 h-4 w-4" />
                ) : (
                  <BookmarkPlus className="mr-2 h-4 w-4" />
                )}
                {status === "want_to_watch" ? "Saved" : "Add to Watchlist"}
              </Button>
              <Button
                onClick={handleMarkWatched}
                disabled={watchlistBusy}
                variant={status === "watched" ? "default" : "outline"}
                className={`h-11 rounded-full ${
                  status === "watched"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "border-white/25 bg-white/5 text-white hover:bg-white/15"
                }`}
              >
                <Eye className="h-4 w-4 sm:mr-2" />
                <span className="sr-only sm:not-sr-only">{status === "watched" ? "Watched" : "Mark Watched"}</span>
              </Button>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={handleToggleFavorite}
                  disabled={favoriteBusy}
                  variant={isFavorite ? "default" : "outline"}
                  aria-pressed={isFavorite}
                  className={`h-11 rounded-full ${
                    isFavorite
                      ? "bg-[#e86a5c] hover:bg-[#f07a6c]"
                      : "border-white/25 bg-white/5 text-white hover:bg-white/15"
                  }`}
                >
                  <motion.span
                    key={String(isFavorite)}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: [0.5, 1.35, 1] }}
                    transition={{ duration: 0.45 }}
                    className="inline-flex sm:mr-2"
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                  </motion.span>
                  <span className="sr-only sm:not-sr-only">{isFavorite ? "Favorited" : "Add to Favorites"}</span>
                </Button>
              </motion.div>
              <Button
                variant="outline"
                className="h-11 rounded-full border-white/25 bg-white/5 text-white hover:bg-white/15"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 sm:mr-2" />
                <span className="sr-only sm:not-sr-only">Share</span>
              </Button>
            </motion.div>

            {(title.watchProviders || title.imdbRating) && (
              <motion.div variants={heroLine} className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <RatingRing value={title.rating} votes={title.voteCount} label="User score" />
                <WatchProviders providers={title.watchProviders} compact />
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
        {sections.length > 1 && <SectionNav sections={sections} />}

        {/* ================= OVERVIEW ================= */}
        <div id="overview" className="grid scroll-mt-32 grid-cols-1 gap-10 py-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <Reveal>
              <h2 className="mb-3 font-display text-xl font-bold">Synopsis</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {title.description || "No synopsis available."}
              </p>
            </Reveal>

            {/* Next / last episode for TV */}
            {mediaType === "tv" && (title.nextEpisode || title.lastEpisode) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { ep: title.nextEpisode, label: "Next episode", accent: "#8a6fbf" },
                  { ep: title.lastEpisode, label: "Latest episode", accent: "#d4a843" },
                ]
                  .filter((x) => x.ep)
                  .map(({ ep, label, accent }, i) => (
                    <Reveal key={label} delay={i * 0.08} className="overflow-hidden rounded-2xl border border-white/[0.07] bg-card/60">
                      {ep!.still && <img src={ep!.still} alt="" className="aspect-video w-full object-cover" loading="lazy" />}
                      <div className="p-4">
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: accent }}>
                          {label}
                        </div>
                        <div className="font-semibold">
                          S{ep!.seasonNumber} · E{ep!.episodeNumber} — {ep!.name}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> {formatDate(ep!.airDate) ?? "TBA"}
                        </div>
                      </div>
                    </Reveal>
                  ))}
              </div>
            )}

            {keywords.length > 0 && (
              <Reveal>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  <Hash className="h-4 w-4" aria-hidden="true" /> Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((k, i) => (
                    <motion.span
                      key={k.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: cappedDelay(i, 0.02, 24) }}
                    >
                      <Link
                        to={`/browse/keyword/${k.id}?type=${mediaType}`}
                        className="block rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-[#d4a843]/40 hover:text-[#e8c866]"
                      >
                        {k.name}
                      </Link>
                    </motion.span>
                  ))}
                </div>
              </Reveal>
            )}

            {title.collection && (
              <Reveal>
                <Link
                  to={`/collection/${title.collection.id}`}
                  className="group relative flex min-h-[180px] items-end overflow-hidden rounded-3xl border border-white/10"
                >
                  {title.collection.backdrop && (
                    <img
                      src={title.collection.backdrop}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
                  <div className="relative p-6">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#e8c866]">
                      <Layers className="h-4 w-4" aria-hidden="true" /> Part of a collection
                    </div>
                    <div className="font-display text-2xl font-bold">{title.collection.name}</div>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm text-white/80 group-hover:text-white">
                      View the whole saga →
                    </span>
                  </div>
                </Link>
              </Reveal>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Reveal className="rounded-2xl border border-white/[0.07] bg-card/70 p-5">
              <h3 className="mb-4 font-display text-lg font-bold">Details</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="capitalize">{title.type}</dd>
                </div>
                {facts.map((f) => (
                  <div key={f.label} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{f.label}</dt>
                    <dd className="text-right">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal className="rounded-2xl border border-white/[0.07] bg-card/70 p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-bold">Where to watch</h3>
                <RegionPicker />
              </div>
              {title.watchProviders && title.watchProviders.region !== region && (
                <p className="mb-3 text-xs text-muted-foreground">
                  No offers listed for {region}; showing {title.watchProviders.region}.
                </p>
              )}
              <WatchProviders providers={title.watchProviders} />
            </Reveal>

            {companies.length > 0 && (
              <Reveal className="rounded-2xl border border-white/[0.07] bg-card/70 p-5">
                <h3 className="mb-4 font-display text-lg font-bold">{mediaType === "tv" ? "Networks & studios" : "Studios"}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {companies.map((c) => (
                    <Link
                      key={`${c.kind}-${c.id}`}
                      to={`/browse/${c.kind}/${c.id}?type=${mediaType}`}
                      className="flex h-16 items-center justify-center rounded-xl bg-white/90 p-2 transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(212,168,67,0.6)]"
                      title={`More from ${c.name}`}
                    >
                      {c.logo ? (
                        <img src={c.logo} alt={c.name} className="max-h-10 max-w-full object-contain" loading="lazy" />
                      ) : (
                        <span className="text-center text-xs font-semibold text-black/80">{c.name}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}

            {externalLinks.length > 0 && (
              <Reveal className="flex flex-wrap gap-2">
                {externalLinks.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[#d4a843]/40 hover:text-[#e8c866]"
                  >
                    {l.label} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ))}
              </Reveal>
            )}
          </div>
        </div>

        {/* ================= CAST & CREW ================= */}
        {(castCards.length > 0 || crew.length > 0 || title.directorCard) && (
          <section id="cast" aria-labelledby="cast-heading" className="cv-auto scroll-mt-32 py-8">
            <SectionHeader
              id="cast-heading"
              title="Cast & Crew"
              icon={Users}
              accent="#f472b6"
              subtitle={castCards.length ? `${castCards.length} top-billed cast` : undefined}
            />
            {castCards.length > 0 && (
              <motion.div layout className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-6">
                {visibleCast.map((actor, i) => (
                  <PersonCard
                    key={actor.id}
                    id={actor.id}
                    name={actor.name}
                    image={actor.image}
                    caption={actor.character}
                    index={i}
                    size="sm"
                  />
                ))}
              </motion.div>
            )}
            {castCards.length > 12 && (
              <div className="mt-6 text-center">
                <Button variant="outline" className="rounded-full" onClick={() => setExpandedCast((v) => !v)}>
                  {expandedCast ? "Show less" : `Show all ${castCards.length} cast`}
                </Button>
              </div>
            )}

            {(crew.length > 0 || title.directorCard) && (
              <div className="mt-10">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  <Clapperboard className="h-4 w-4" aria-hidden="true" /> Behind the camera
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(crew.length > 0
                    ? crew
                    : [{ ...title.directorCard!, jobs: [mediaType === "tv" ? "Creator" : "Director"], department: null }]
                  ).map((member, i) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, ease: ease.out, delay: cappedDelay(i, 0.03) }}
                    >
                      <Link
                        to={`/person/${member.id}`}
                        className={`group flex items-center gap-3 rounded-xl border bg-card/60 p-3 transition-colors hover:bg-card ${
                          member.jobs.includes("Director") || member.jobs.includes("Creator")
                            ? "border-[#d4a843]/30"
                            : "border-white/[0.06] hover:border-white/15"
                        }`}
                      >
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                          {member.image ? (
                            <img src={member.image} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-sm font-bold text-[#d4a843]">
                              {member.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-medium group-hover:text-[#e8c866]">{member.name}</span>
                          <span className="block truncate text-xs text-[#d4a843]/90">{member.jobs.join(", ")}</span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================= SEASONS ================= */}
        {mediaType === "tv" && (title.seasons?.length ?? 0) > 0 && (
          <section id="seasons" aria-labelledby="seasons-heading" className="cv-auto scroll-mt-32 py-8">
            <SectionHeader id="seasons-heading" title="Season guide" icon={Tv} accent="#3b82f6" subtitle={`${title.seasons.length} season${title.seasons.length > 1 ? "s" : ""}`} />
            <SeasonGuide tvId={tmdbId} seasons={title.seasons} />
          </section>
        )}

        {mediaType === "tv" && (title.seasons?.filter((x) => x.seasonNumber > 0).length ?? 0) > 0 && (
          <section id="ratings" aria-labelledby="ratings-heading" className="cv-auto scroll-mt-32 py-8">
            <SectionHeader
              id="ratings-heading"
              title="Episode ratings"
              icon={Star}
              subtitle="Every episode at a glance — hover or tap a square for details"
            />
            <EpisodeRatings tvId={tmdbId} />
          </section>
        )}

        {/* ================= VIDEOS ================= */}
        {videos.length > 0 && (
          <div id="videos" className="scroll-mt-32 py-8">
            <ScrollRow title="Videos" icon={Play} accent="#e86a5c" subtitle="Trailers, teasers, clips & featurettes" wide>
              {videos.map((v, i) => (
                <RowItem key={v.key} wide>
                  <motion.button
                    type="button"
                    onClick={() => setVideoKey(v.key)}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: ease.out, delay: cappedDelay(i, 0.05) }}
                    whileHover={{ y: -4 }}
                    className="group block w-full text-left"
                    aria-label={`Play ${v.name}`}
                  >
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-muted">
                      <img src={v.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/10" />
                      <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#d4a843]/90 text-background shadow-[0_0_40px_rgba(212,168,67,0.7)] transition-transform duration-300 group-hover:scale-110">
                        <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true" />
                      </span>
                      <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                        {v.type}
                      </span>
                    </div>
                    <div className="mt-2 line-clamp-1 text-sm font-medium group-hover:text-[#e8c866]">{v.name}</div>
                  </motion.button>
                </RowItem>
              ))}
            </ScrollRow>
          </div>
        )}

        {/* ================= PHOTOS ================= */}
        {backdrops.length > 0 && (
          <section id="photos" aria-labelledby="photos-heading" className="cv-auto scroll-mt-32 py-8">
            <SectionHeader
              id="photos-heading"
              title="Photos"
              icon={Images}
              accent="#10b981"
              subtitle={`${backdrops.length} stills${posters.length ? ` · ${posters.length} posters` : ""}`}
            />
            <div className="grid auto-rows-[120px] grid-cols-2 gap-3 sm:auto-rows-[150px] md:grid-cols-4">
              {backdrops.slice(0, 9).map((img, i) => (
                <motion.button
                  key={img.url}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  initial={{ opacity: 0, scale: 0.94 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.55, ease: ease.out, delay: cappedDelay(i, 0.05) }}
                  className={`group relative overflow-hidden rounded-xl border border-white/[0.06] ${
                    i === 0 ? "col-span-2 row-span-2" : ""
                  }`}
                  aria-label={`Open photo ${i + 1}`}
                >
                  <img src={img.thumb} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                  {i === 8 && backdrops.length > 9 && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-semibold">
                      +{backdrops.length - 9}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
            <Lightbox images={backdrops} index={lightboxIndex} onClose={() => setLightboxIndex(null)} label={`${title.title} photos`} />
          </section>
        )}

        {/* ================= REVIEWS ================= */}
        {reviews.length > 0 && (
          <section id="reviews" aria-labelledby="reviews-heading" className="cv-auto scroll-mt-32 py-8">
            <SectionHeader
              id="reviews-heading"
              title="Critic & community reviews"
              icon={MessageSquareQuote}
              subtitle={`${title.reviewCount} review${title.reviewCount === 1 ? "" : "s"} on TMDB`}
            />
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.slice(0, 4).map((r, i) => (
                <ReviewCard key={r.id} review={r} index={i} />
              ))}
            </div>
          </section>
        )}

        <div id="discussion" className="scroll-mt-32">
          <CommentsSection tmdbId={tmdbId} mediaType={mediaType} />
        </div>

        {/* ================= MORE LIKE THIS ================= */}
        <div id="more" className="scroll-mt-32 space-y-12 py-10">
          {recommendations.length > 0 && (
            <ScrollRow title="Recommended for you" icon={Sparkles} subtitle={`Because you viewed ${title.title}`}>
              {recommendations.map((t, i) => (
                <RowItem key={`${t.mediaType}-${t.id}`}>
                  <MovieCard title={t} index={i} />
                </RowItem>
              ))}
            </ScrollRow>
          )}
          {similar.length > 0 && (
            <ScrollRow title="Similar Titles" icon={ThumbsUp} accent="#8a6fbf">
              {similar.map((t, i) => (
                <RowItem key={`${t.mediaType}-${t.id}`}>
                  <MovieCard title={t} index={i} />
                </RowItem>
              ))}
            </ScrollRow>
          )}
        </div>
      </div>

      <TrailerDialog videoKey={videoKey} title={`${title.title} video`} onClose={() => setVideoKey(null)} />

      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Rate "{title.title}"</DialogTitle>
            <DialogDescription>How would you rate this {title.type}?</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  onClick={() => setUserRating(star)}
                  whileHover={{ scale: 1.2, rotate: -8 }}
                  whileTap={{ scale: 0.85 }}
                  className="p-1"
                >
                  <Star
                    className={`h-9 w-9 transition-colors ${
                      star <= userRating ? "fill-[#e8c866] text-[#e8c866]" : "text-muted-foreground"
                    }`}
                  />
                </motion.button>
              ))}
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
    </div>
  );
}
