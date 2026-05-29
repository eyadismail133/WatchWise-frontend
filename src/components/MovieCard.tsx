import { useState } from "react";
import { Link } from "react-router";
import { BookmarkPlus, Eye, X, Star } from "lucide-react";
import { motion } from "framer-motion";

import { trpc } from "@/providers/trpcClient";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

interface MovieCardProps {
  title: any;
  variant?: "default" | "large" | "compact";
  showQuickActions?: boolean;
  userStatus?: "want_to_watch" | "watched" | "skipped" | null;
  userRate?: number;

  index?: number;
}

export function MovieCard({
  title,
  variant = "default",
  showQuickActions = true,
  userStatus,
  index = 0,
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { isAuthenticated } = useAuth();

  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      toast.error("Sign in to use watchlist and favorites");
      return;
    }
    action();
  };
  const isLarge = variant === "large";
  const isCompact = variant === "compact";

  const year = title.releaseDate?.split("-")?.[0] ?? "—";

  const imdbRating =
    typeof title.rating === "number" ? title.rating : title.rating;

  const tmdbId = title.id;

  const mediaType =
    title.mediaType === "tv" || title.mediaType === "movie"
      ? title.mediaType
      : "movie";

  const watchlistQuery = trpc.watchlist.getByTitle.useQuery(
    { tmdbId, mediaType },
    { enabled: isAuthenticated && tmdbId > 0 },
  );
  const watchlistItem = watchlistQuery.data;

  const utils = trpc.useUtils();
  const addToWatchlist = trpc.watchlist.add.useMutation({
    onSuccess: () => {
      utils.watchlist.getByTitle.invalidate({ tmdbId, mediaType });
      utils.watchlist.list.invalidate();
      toast.success("Added to watchlist");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateWatchlist = trpc.watchlist.update.useMutation({
    onSuccess: () => {
      utils.watchlist.getByTitle.invalidate({ tmdbId, mediaType });
      utils.watchlist.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const removeWatchlist = trpc.watchlist.remove.useMutation({
    onSuccess: () => {
      utils.watchlist.getByTitle.invalidate({ tmdbId, mediaType });
      utils.watchlist.list.invalidate();
      toast.success("Removed successfully");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAddToWatchlist = () => {
    requireAuth(() => {
      if (isInWatchlist && watchlistItem) {
        removeWatchlist.mutate({
          id: watchlistItem.id,
        });
        return;
      }

      if (watchlistItem) {
        updateWatchlist.mutate({
          id: watchlistItem.id,
          status: "want_to_watch",
        });
      } else {
        addToWatchlist.mutate({
          tmdbId,
          mediaType,
          status: "want_to_watch",
        });
      }
    });
  };
  const handleMarkWatched = () => {
    requireAuth(() => {
      if (isWatched && watchlistItem) {
        removeWatchlist.mutate({
          id: watchlistItem.id,
        });
        return;
      }

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
  const handleRate = () => {
    if (watchlistItem && userRating > 0) {
      updateWatchlist.mutate({ id: watchlistItem.id, userRating });
    }
    setRatingDialogOpen(false);
  };

  const isInWatchlist = watchlistItem?.status === "want_to_watch";
  const isWatched = watchlistItem?.status === "watched";
  const currentUserRating = watchlistItem?.userRating ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/title/${title.mediaType}/${title.id}`}>
        <div
          className={`relative overflow-hidden rounded-xl card-shadow transition-all duration-300 ${
            isHovered ? "card-shadow-elevated scale-[1.03]" : ""
          } ${userStatus === "skipped" ? "opacity-50 saturate-50" : ""} ${
            userStatus === "want_to_watch" || userStatus === "watched"
              ? "ring-2 ring-[#d4a843]/50"
              : ""
          }`}
          style={{ aspectRatio: isLarge ? "16/10" : "2/3" }}
        >
          <img
            src={title.poster_path}
            alt={title.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          {userStatus && (
            <div
              className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center ${
                userStatus === "watched"
                  ? "bg-green-500/90"
                  : userStatus === "want_to_watch"
                    ? "bg-[#8a6fbf]/90"
                    : "bg-red-500/90"
              }`}
            >
              {userStatus === "watched" ? (
                <Eye className="w-4 h-4 text-white" />
              ) : userStatus === "want_to_watch" ? (
                <BookmarkPlus className="w-4 h-4 text-white" />
              ) : (
                <X className="w-4 h-4 text-white" />
              )}
            </div>
          )}

          {currentUserRating > 0 && isWatched && (
            <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-black/70 rounded-md px-1.5 py-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < currentUserRating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-600"
                  }`}
                />
              ))}
            </div>
          )}

          {showQuickActions && isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2"
              onClick={(e) => e.preventDefault()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToWatchlist();
                }}
                className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
                  isInWatchlist
                    ? "bg-[#d4a843] text-black"
                    : "bg-white/20 hover:bg-[#d4a843] hover:text-black"
                }`}
                aria-label="Add to watchlist"
              >
                <BookmarkPlus
                  className={`w-5 h-5 ${
                    isInWatchlist ? "text-black" : "text-white"
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMarkWatched();
                }}
                className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
                  isWatched ? "bg-green-500" : "bg-white/20 hover:bg-green-500"
                }`}
                aria-label="Mark watched"
              >
                <Eye className="w-5 h-5 text-white" />
              </button>
            </motion.div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3
              className={`font-display font-semibold text-white leading-tight ${
                isLarge ? "text-lg" : isCompact ? "text-sm" : "text-base"
              }`}
            >
              {title.title}
            </h3>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-white/70">{year}</span>
              <span className="text-xs text-white/50">·</span>
              <span className="text-xs text-white/70 capitalize">
                {title.type}
              </span>
              <span className="text-xs text-white/50">·</span>
              <span className="text-xs text-[#d4a843]">
                {imdbRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </Link>
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Rate &quot;{title.title}&quot;
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
    </motion.div>
  );
}
