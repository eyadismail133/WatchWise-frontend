import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "../providers/trpcClient";
import { MovieCard } from "../components/MovieCard";
import type { TitleData } from "../components/MovieCard";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { BookmarkPlus, Eye, LogIn, Heart } from "lucide-react";
import { motion } from "framer-motion";

type FilterStatus = "all" | "want_to_watch" | "watched";

const statusFilters: {
  value: FilterStatus;
  label: string;
  icon: typeof Eye;
}[] = [
  { value: "all", label: "All", icon: BookmarkPlus },
  { value: "want_to_watch", label: "Want to Watch", icon: BookmarkPlus },
  { value: "watched", label: "Watched", icon: Eye },
];

export default function Watchlist() {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [tab, setTab] = useState<"watchlist" | "favorites">("watchlist");
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const watchlistQuery = trpc.watchlist.list.useQuery(
    activeFilter !== "all" ? { status: activeFilter } : undefined,
    { enabled: isAuthenticated && tab === "watchlist" },
  );

  const favoritesQuery = trpc.favorite.list.useQuery(undefined, {
    enabled: isAuthenticated && tab === "favorites",
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#d4a843] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <BookmarkPlus className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">
            Your Watchlist Awaits
          </h2>
          <p className="text-muted-foreground mb-6">
            Sign in to build your watchlist, save favorites, and track what
            you&apos;ve watched.
          </p>
          <Link to="/login">
            <Button className="bg-[#d4a843] hover:bg-[#e8c866] text-background">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const watchlistItems = watchlistQuery.data ?? [];
  const favoriteItems = favoritesQuery.data ?? [];
  const isLoading =
    tab === "watchlist" ? watchlistQuery.isLoading : favoritesQuery.isLoading;

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">My Library</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === "watchlist"
                ? `${watchlistItems.length} on watchlist`
                : `${favoriteItems.length} favorites`}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("watchlist")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === "watchlist"
                  ? "bg-[#d4a843] text-background"
                  : "bg-card border border-border/50 text-muted-foreground"
              }`}
            >
              <BookmarkPlus className="w-4 h-4 inline mr-1" />
              Watchlist
            </button>
            <button
              type="button"
              onClick={() => setTab("favorites")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === "favorites"
                  ? "bg-[#e86a5c] text-white"
                  : "bg-card border border-border/50 text-muted-foreground"
              }`}
            >
              <Heart className="w-4 h-4 inline mr-1" />
              Favorites
            </button>
          </div>
        </div>

        {tab === "watchlist" && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeFilter === filter.value
                    ? "bg-[#d4a843] text-background"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border/50"
                }`}
              >
                <filter.icon className="w-4 h-4" />
                {filter.label}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#d4a843] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "watchlist" && watchlistItems.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {watchlistItems.map((item) => {
              if (!item?.title) return null;
              const title = item.title as TitleData;
              return (
                <MovieCard
                  key={item.id}
                  title={title}
                  userStatus={item.status}
                />
              );
            })}
          </motion.div>
        ) : tab === "favorites" && favoriteItems.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {favoriteItems.map((item) => {
              if (!item?.title) return null;
              const title = item.title as TitleData;
              return <MovieCard key={item.id} title={title} />;
            })}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <BookmarkPlus className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-lg font-bold text-muted-foreground mb-2">
              {tab === "watchlist"
                ? "Your Watchlist is Empty"
                : "No Favorites Yet"}
            </h3>
            <p className="text-sm text-muted-foreground/60 mb-6 max-w-md mx-auto">
              Browse titles and add them from the detail page.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/search">
                <Button variant="outline">Browse Titles</Button>
              </Link>
              <Link to="/discover">
                <Button className="bg-[#d4a843] hover:bg-[#e8c866] text-background">
                  Discover
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
