import { useState } from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { BookmarkPlus, Eye, Heart, Library, Compass, Search, LayoutGrid } from "lucide-react";
import { trpc } from "../providers/trpcClient";
import { MovieCard, type TitleData } from "../components/MovieCard";
import { useAuth } from "../hooks/useAuth";
import { SegmentedControl } from "../components/motion/SegmentedControl";
import { SignedOutState } from "../components/SignedOutState";
import { ErrorState, SkeletonCard } from "../components/ScrollRow";
import { ease, spring } from "../lib/motion";

type FilterStatus = "all" | "want_to_watch" | "watched";
const grid = "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

export default function Watchlist() {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  usePageMeta("My library", "Your WatchWise watchlist, watched titles and favorites.");
  const [tab, setTab] = useState<"watchlist" | "favorites">("watchlist");
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const watchlistQuery = trpc.watchlist.list.useQuery(
    activeFilter !== "all" ? { status: activeFilter } : undefined,
    { enabled: isAuthenticated && tab === "watchlist" },
  );
  const favoritesQuery = trpc.favorite.list.useQuery(undefined, {
    enabled: isAuthenticated && tab === "favorites",
  });
  // One light query gives live counts for every filter chip.
  const statusMap = trpc.watchlist.statusMap.useQuery(undefined, { enabled: isAuthenticated });

  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10" aria-busy="true">
        <div className="shimmer mb-8 h-10 w-48 rounded-lg" />
        <div className={grid}>{Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <SignedOutState
        icon={BookmarkPlus}
        title="Your Watchlist Awaits"
        description="Sign in to build your watchlist, save favorites, and track what you've watched."
        perks={["Save titles for later", "Rate what you watched", "Pin your favorites"]}
      />
    );
  }

  const counts = {
    all: statusMap.data?.length,
    want_to_watch: statusMap.data?.filter((i) => i.status === "want_to_watch").length,
    watched: statusMap.data?.filter((i) => i.status === "watched").length,
  };

  const watchlistItems = watchlistQuery.data ?? [];
  const favoriteItems = favoritesQuery.data ?? [];
  const active = tab === "watchlist" ? watchlistQuery : favoritesQuery;
  const items = tab === "watchlist" ? watchlistItems : favoriteItems;

  return (
    <div className="min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: ease.out }}
          className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#e8c866]">
              <Library className="h-4 w-4" aria-hidden="true" /> Library
            </p>
            <h1 className="font-display text-4xl font-bold tracking-tight">My Library</h1>
            <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
              {tab === "watchlist"
                ? `${watchlistItems.length} on watchlist`
                : `${favoriteItems.length} favorites`}
            </p>
          </div>

          <SegmentedControl
            id="library-tab"
            label="Library section"
            value={tab}
            onChange={setTab}
            options={[
              { value: "watchlist", label: "Watchlist", icon: BookmarkPlus },
              { value: "favorites", label: "Favorites", icon: Heart },
            ]}
          />
        </motion.div>

        <AnimatePresence initial={false}>
          {tab === "watchlist" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-6">
                <SegmentedControl
                  id="library-filter"
                  label="Watch status"
                  size="sm"
                  value={activeFilter}
                  onChange={setActiveFilter}
                  options={[
                    { value: "all", label: "All", icon: LayoutGrid, count: counts.all },
                    { value: "want_to_watch", label: "Want to Watch", icon: BookmarkPlus, count: counts.want_to_watch },
                    { value: "watched", label: "Watched", icon: Eye, count: counts.watched },
                  ]}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {active.isLoading ? (
          <div className={grid}>{Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} />)}</div>
        ) : active.isError ? (
          <ErrorState message="We couldn't load your library." onRetry={() => active.refetch()} />
        ) : items.length > 0 ? (
          <motion.div layout className={grid}>
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => {
                if (!item?.title) return null;
                const title = item.title as TitleData;
                return (
                  <motion.div
                    key={`${tab}-${item.id}`}
                    layout
                    exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.25 } }}
                    transition={spring.layout}
                  >
                    <MovieCard
                      title={title}
                      index={i}
                      userStatus={"status" in item ? item.status : undefined}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-dashed border-white/10 py-20 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d4a843]/10"
            >
              {tab === "watchlist" ? (
                <BookmarkPlus className="h-8 w-8 text-[#d4a843]" aria-hidden="true" />
              ) : (
                <Heart className="h-8 w-8 text-[#e86a5c]" aria-hidden="true" />
              )}
            </motion.div>
            <h3 className="mb-2 font-display text-lg font-bold">
              {tab === "watchlist" ? "Your Watchlist is Empty" : "No Favorites Yet"}
            </h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
              Hover any poster and tap the bookmark, or open a title and add it from its page.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-sm hover:border-white/30"
              >
                <Search className="h-4 w-4" aria-hidden="true" /> Browse Titles
              </Link>
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 rounded-full bg-[#d4a843] px-5 py-2 text-sm font-semibold text-background hover:bg-[#e8c866]"
              >
                <Compass className="h-4 w-4" aria-hidden="true" /> Discover
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
