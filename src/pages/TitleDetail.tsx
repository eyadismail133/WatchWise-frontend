import { useParams, Link, useSearchParams } from "react-router";
import { trpc } from "../providers/trpcClient";
import { MovieCard } from "../components/MovieCard";
import type { TitleData } from "../components/MovieCard";
import { useAuth } from "../hooks/useAuth";
import {
  BookmarkPlus,
  Eye,
  Share2,
  Star,
  PlayCircle,
  ChevronLeft,
  Clock,
  Globe,
  Heart,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";

type ExtendedTitleData = TitleData & {
  tagline?: string | null;
  runtime?: number | null;
  releaseYear?: number | null;
  language?: string | null;
  country?: string | null;
  imdbRating?: number | null;
  trailerKey?: string | null;
  status?: string | null;
  mediaType?: "movie" | "tv";

  castCards: {
    id: number;
    name: string;
    image: string | null;
    character: string | null;
  }[];

  directorCard: {
    id: number;
    name: string;
    image: string | null;
  } | null;

  director?: string | null;

  numberOfSeasons?: number | null;
  numberOfEpisodes?: number | null;
};

export default function TitleDetail() {
  const { id, mediaType: mediaTypeParam } = useParams<{
    id: string;
    mediaType?: string;
  }>();

  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

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
    { id: tmdbId, mediaType },
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

  const addToWatchlist = trpc.watchlist.add.useMutation({
    onSuccess: () => {
      utils.watchlist.getByTitle.invalidate({
        tmdbId,
        mediaType,
      });

      utils.watchlist.list.invalidate();

      toast.success("Added to watchlist");
    },

    onError: (err) => toast.error(err.message),
  });

  const updateWatchlist = trpc.watchlist.update.useMutation({
    onSuccess: () => {
      utils.watchlist.getByTitle.invalidate({
        tmdbId,
        mediaType,
      });

      utils.watchlist.list.invalidate();
    },

    onError: (err) => toast.error(err.message),
  });

  const addFavorite = trpc.favorite.add.useMutation({
    onSuccess: () => {
      utils.favorite.isFavorite.invalidate({
        tmdbId,
        mediaType,
      });

      toast.success("Added to favorites");
    },

    onError: (err) => toast.error(err.message),
  });

  const removeFavorite = trpc.favorite.remove.useMutation({
    onSuccess: () => {
      utils.favorite.isFavorite.invalidate({
        tmdbId,
        mediaType,
      });

      toast.success("Removed from favorites");
    },

    onError: (err) => toast.error(err.message),
  });

  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);

  const [userRating, setUserRating] = useState(0);

  const title = titleQuery.data as ExtendedTitleData | undefined;

  const similar = (similarQuery.data?.results ?? []) as TitleData[];

  const watchlistItem = watchlistQuery.data;

  const isFavorite = favoriteQuery.data?.isFavorite ?? false;

  if (titleQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#d4a843] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!title) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-2">
            Title Not Found
          </h2>

          <Link to="/" className="text-[#d4a843] hover:underline">
            Go back home
          </Link>
        </div>
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

  const handleAddToWatchlist = () => {
    requireAuth(() =>
      addToWatchlist.mutate({
        tmdbId,
        mediaType,
        status: "want_to_watch",
      }),
    );
  };

  const handleMarkWatched = () => {
    requireAuth(() => {
      if (watchlistItem) {
        updateWatchlist.mutate({
          id: watchlistItem.id,
          status: "watched",
        });

        setRatingDialogOpen(true);
      } else {
        addToWatchlist.mutate(
          {
            tmdbId,
            mediaType,
            status: "watched",
          },
          {
            onSuccess: () => setRatingDialogOpen(true),
          },
        );
      }
    });
  };

  const handleToggleFavorite = () => {
    requireAuth(() => {
      if (isFavorite) {
        removeFavorite.mutate({
          tmdbId,
          mediaType,
        });
      } else {
        addFavorite.mutate({
          tmdbId,
          mediaType,
        });
      }
    });
  };

  const handleRate = () => {
    if (watchlistItem && userRating > 0) {
      updateWatchlist.mutate({
        id: watchlistItem.id,
        userRating,
      });
    }

    setRatingDialogOpen(false);
  };

  const trailerUrl = title.trailerKey
    ? `https://www.youtube.com/watch?v=${title.trailerKey}`
    : null;

  return (
    <div className="min-h-screen">
      <section className="relative h-[60vh] min-h-[400px]">
        <img
          src={title.backdrop_path ?? title.poster_path ?? undefined}
          alt={title.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />

        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

        <div className="absolute top-4 left-4 z-10">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
              }}
            >
              {watchlistItem && (
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                    watchlistItem.status === "watched"
                      ? "bg-green-500/20 text-green-400"
                      : watchlistItem.status === "want_to_watch"
                        ? "bg-[#8a6fbf]/20 text-[#8a6fbf]"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {watchlistItem.status === "watched"
                    ? "Watched"
                    : watchlistItem.status === "want_to_watch"
                      ? "In Your Watchlist"
                      : "Skipped"}
                </span>
              )}

              <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-2">
                {title.title}
              </h1>

              {title.tagline && (
                <p className="text-white/60 italic mb-2">{title.tagline}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70 mb-4">
                {title.releaseYear && <span>{title.releaseYear}</span>}

                <span>·</span>

                <span className="capitalize">{title.type}</span>

                {title.runtime ? (
                  <>
                    <span>·</span>

                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {title.runtime} min
                    </span>
                  </>
                ) : null}

                {title.language && (
                  <>
                    <span>·</span>

                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      {title.language}
                    </span>
                  </>
                )}

                <span>·</span>

                <span className="text-[#d4a843] font-bold">
                  {title.rating.toFixed(1)}/10
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {title.genres.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleAddToWatchlist}
                  variant={
                    watchlistItem?.status === "want_to_watch"
                      ? "default"
                      : "outline"
                  }
                  className={
                    watchlistItem?.status === "want_to_watch"
                      ? "bg-[#8a6fbf] hover:bg-[#9a7fcf]"
                      : "border-white/30 text-white hover:bg-white/10"
                  }
                >
                  <BookmarkPlus className="w-4 h-4 mr-2" />

                  {watchlistItem?.status === "want_to_watch"
                    ? "Saved"
                    : "Add to Watchlist"}
                </Button>
                <Button
                  onClick={handleMarkWatched}
                  variant={
                    watchlistItem?.status === "watched" ? "default" : "outline"
                  }
                  className={
                    watchlistItem?.status === "watched"
                      ? "bg-green-600 hover:bg-green-700"
                      : "border-white/30 text-white hover:bg-white/10"
                  }
                >
                  <Eye className="w-4 h-4 mr-2" />

                  {watchlistItem?.status === "watched"
                    ? "Watched"
                    : "Mark Watched"}
                </Button>
                <Button
                  onClick={handleToggleFavorite}
                  variant={isFavorite ? "default" : "outline"}
                  className={
                    isFavorite
                      ? "bg-[#e86a5c] hover:bg-[#f07a6c]"
                      : "border-white/30 text-white hover:bg-white/10"
                  }
                >
                  <Heart
                    className={`w-4 h-4 mr-2 ${
                      isFavorite ? "fill-current" : ""
                    }`}
                  />

                  {isFavorite ? "Favorited" : "Add to Favorites"}
                </Button>
                {trailerUrl && (
                  <Button
                    variant="outline"
                    className="border-[#d4a843]/30 text-[#d4a843] hover:bg-[#d4a843]/10"
                    asChild
                  >
                    <a href={trailerUrl} target="_blank" rel="noreferrer">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Watch Trailer
                    </a>
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={async () => {
                    const shareData = {
                      title: document.title,
                      text: "Check this out",
                      url: window.location.href,
                    };

                    try {
                      if (navigator.share) {
                        await navigator.share(shareData);
                      } else {
                        await navigator.clipboard.writeText(
                          window.location.href,
                        );
                        toast.success("Link copied");
                      }
                    } catch (error) {
                      // User cancelled sharing
                      console.log(error);
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.section
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
            >
              <h2 className="font-display text-xl font-bold mb-3">Synopsis</h2>

              <p className="text-muted-foreground leading-relaxed text-lg">
                {title.description || "No synopsis available."}
              </p>
            </motion.section>

            {(title.castCards.length > 0 || title.directorCard) && (
              <motion.section
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.1,
                }}
              >
                <h2 className="font-display text-xl font-bold mb-4">
                  Cast & Crew
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {title.castCards.map((actor) => (
                    <div
                      key={actor.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
                    >
                      {actor.image ? (
                        <img
                          src={actor.image}
                          alt={actor.name}
                          className="w-14 h-14 rounded-full object-cover border border-border/50"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                          {actor.name.charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <span className="text-sm font-medium block truncate">
                          {actor.name}
                        </span>

                        {actor.character && (
                          <span className="text-xs text-muted-foreground block truncate">
                            {actor.character}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {title.directorCard && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-[#d4a843]/30">
                      {title.directorCard.image ? (
                        <img
                          src={title.directorCard.image}
                          alt={title.directorCard.name}
                          className="w-14 h-14 rounded-full object-cover border border-[#d4a843]/30"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-[#d4a843]/10 flex items-center justify-center text-sm font-bold text-[#d4a843]">
                          {title.directorCard.name.charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <span className="text-sm font-medium block truncate">
                          {title.directorCard.name}
                        </span>

                        <span className="text-xs text-[#d4a843]">Director</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-card border border-border/50">
              <h3 className="font-display text-lg font-bold mb-4">Ratings</h3>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {(mediaType === "tv" ? "Series" : "movie") + " Score"}
                </span>

                <span className="text-sm font-bold">
                  {title.imdbRating?.toFixed(1) ?? title.rating.toFixed(1)}
                  /10
                </span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border/50">
              <h3 className="font-display text-lg font-bold mb-4">Details</h3>

              <div className="space-y-3 text-sm">
                {title.releaseYear && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Released</span>

                    <span>{title.releaseYear}</span>
                  </div>
                )}

                {title.runtime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Runtime</span>

                    <span>{title.runtime} min</span>
                  </div>
                )}

                {title.language && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Language</span>

                    <span>{title.language}</span>
                  </div>
                )}

                {title.country && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country</span>

                    <span>{title.country}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>

                  <span className="capitalize">{title.type}</span>
                </div>

                {title.mediaType === "tv" && title.numberOfSeasons && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seasons</span>

                    <span>{title.numberOfSeasons}</span>
                  </div>
                )}

                {title.mediaType === "tv" && title.numberOfEpisodes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Episodes</span>

                    <span>{title.numberOfEpisodes}</span>
                  </div>
                )}

                {title.director && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Director</span>

                    <span className="text-right">{title.director}</span>
                  </div>
                )}

                {title.status && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>

                    <span>{title.status}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold mb-6">
              Similar Titles
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similar.map((t, i) => (
                <MovieCard key={`${t.mediaType}-${t.id}`} title={t} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Rate "{title.title}"
            </DialogTitle>
          </DialogHeader>

          <div className="py-6">
            <p className="text-sm text-muted-foreground mb-4">
              How would you rate this {title.type}?
            </p>

            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setUserRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= userRating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>

            <Button
              onClick={handleRate}
              disabled={userRating === 0}
              className="w-full mt-6 bg-[#d4a843] hover:bg-[#e8c866] text-background"
            >
              Submit Rating
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
