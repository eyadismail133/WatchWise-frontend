import { useState, useCallback } from "react";
import { MovieCard } from "../components/MovieCard";
import type { TitleData } from "../components/MovieCard";
import { MoodChip } from "../components/MoodChip";
import { Search as SearchIcon, Filter, X } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import { useDebounce } from "../hooks/useDebounce";
import { trpc } from "../providers/trpcClient";

const allMoods = [
  "thought-provoking",
  "emotional",
  "dark",
  "funny",
  "suspenseful",
  "visual spectacle",
  "action-packed",
  "slow-burn",
  "mind-bending",
  "binge-worthy",
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<"all" | "movie" | "tv">("all");

  const debouncedQuery = useDebounce(query, 300);

  const resultsQuery = trpc.movie.search.useQuery(
    { query: debouncedQuery, page: 1 },
    { enabled: debouncedQuery.length >= 2 },
  );

  const browseQuery = trpc.movie.discoverMovie.useQuery(
    { page: 1 },
    { enabled: debouncedQuery.length < 2 },
  );

  const rawResults = (resultsQuery.data?.results ??
    browseQuery.data?.results ??
    []) as TitleData[];

  const results = rawResults.filter((title) => {
    if (mediaFilter !== "all" && title.mediaType !== mediaFilter) return false;
    if (selectedMoods.length === 0) return true;
    return selectedMoods.some((m) => title.moods.includes(m));
  });

  const isLoading = resultsQuery.isLoading || browseQuery.isLoading;

  const toggleMood = useCallback((mood: string) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood],
    );
  }, []);

  const clearFilters = () => {
    setSelectedMoods([]);
    setQuery("");
    setMediaFilter("all");
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-6">Search</h1>

          <div className="relative max-w-2xl">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-card border border-border/50 focus-within:border-[#d4a843]/50 transition-colors">
              <SearchIcon className="w-5 h-5 text-muted-foreground ml-2" />
              <Input
                placeholder="Search movies and TV shows..."
                className="border-0 bg-transparent focus-visible:ring-0"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="p-1">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`shrink-0 ${showFilters ? "border-[#d4a843] text-[#d4a843]" : ""}`}
              >
                <Filter className="w-4 h-4 mr-1" />
                Filters
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {(["all", "movie", "tv"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMediaFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                  mediaFilter === type
                    ? "bg-[#d4a843] text-background"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {type === "all" ? "All" : type === "movie" ? "Movies" : "TV"}
              </button>
            ))}
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 p-4 rounded-xl bg-card border border-border/50"
            >
              <div>
                <h3 className="text-sm font-semibold mb-2">Moods</h3>
                <div className="flex flex-wrap gap-2">
                  {allMoods.map((mood) => (
                    <MoodChip
                      key={mood}
                      mood={mood}
                      selected={selectedMoods.includes(mood)}
                      onClick={() => toggleMood(mood)}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
              {selectedMoods.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-3 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#d4a843] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length > 0 ? (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {debouncedQuery.length >= 2
                ? `Found ${results.length} result${results.length !== 1 ? "s" : ""} for "${debouncedQuery}"`
                : `Showing ${results.length} popular titles`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((title, i) => (
                <MovieCard
                  key={`${title.mediaType}-${title.id}`}
                  title={title}
                  index={i}
                />
              ))}
            </div>
          </div>
        ) : debouncedQuery.length >= 2 ? (
          <div className="text-center py-20">
            <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-lg font-bold text-muted-foreground mb-2">
              No Results Found
            </h3>
            <p className="text-sm text-muted-foreground/60">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="text-center py-20">
            <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-lg font-bold text-muted-foreground mb-2">
              Start Searching
            </h3>
            <p className="text-sm text-muted-foreground/60">
              Type at least 2 characters, or browse popular movies below
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
