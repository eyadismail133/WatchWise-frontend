import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router";
import { trpc } from "../providers/trpcClient";
import { MovieCard } from "../components/MovieCard";
import type { TitleData } from "../components/MovieCard";
import { AILoadingOrb } from "../components/AILoadingOrb";
import { Sparkles, Diamond, Wand2, RefreshCw, Film, Tv } from "lucide-react";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";

export default function Discover() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const initialHiddenGems = searchParams.get("hiddenGems") === "true";

  const [hiddenGems, setHiddenGems] = useState(initialHiddenGems);
  const [mediaTab, setMediaTab] = useState<"movie" | "tv">("movie");
  const [showSurprise, setShowSurprise] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const discoverMoviesQuery = trpc.movie.discoverMovie.useQuery({
    page: 1,
    sort_by: hiddenGems ? "vote_average.desc" : "popularity.desc",
  });
  const discoverTvQuery = trpc.movie.discoverTv.useQuery({
    page: 1,
    sort_by: hiddenGems ? "vote_average.desc" : "popularity.desc",
  });

  const surpriseQuery = trpc.movie.surprise.useQuery(
    { mediaType: mediaTab },
    { enabled: false },
  );

  const activeData =
    mediaTab === "movie" ? discoverMoviesQuery.data : discoverTvQuery.data;
  const results = (activeData?.results ?? []) as TitleData[];
  const isLoading =
    discoverMoviesQuery.isLoading ||
    discoverTvQuery.isLoading ||
    surpriseQuery.isFetching;

  const handleSurprise = async () => {
    setShowSurprise(false);
    const result = await surpriseQuery.refetch();
    if (result.data) setShowSurprise(true);
  };

  const handleSurpriseClick = () => {
    if (user && isAuthenticated) {
      handleSurprise();
    } else {
      setShowAuthPrompt(true);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleCancel = () => {
    setShowAuthPrompt(false);
  };
  const surpriseData = surpriseQuery.data;

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-[#d4a843]" />
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              Discover
            </h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Browse trending movies and TV, or let WatchWise surprise you.
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMediaTab("movie")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              mediaTab === "movie"
                ? "bg-[#d4a843] text-background"
                : "bg-card text-muted-foreground border border-border/50"
            }`}
          >
            <Film className="w-4 h-4" />
            Movies
          </button>
          <button
            type="button"
            onClick={() => setMediaTab("tv")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              mediaTab === "tv"
                ? "bg-[#d4a843] text-background"
                : "bg-card text-muted-foreground border border-border/50"
            }`}
          >
            <Tv className="w-4 h-4" />
            TV Shows
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Diamond className="w-4 h-4 text-[#8a6fbf]" />
              <span className="text-sm text-muted-foreground">Top Rated</span>
            </div>
            <Switch checked={hiddenGems} onCheckedChange={setHiddenGems} />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 mb-12">
          <Button
            size="lg"
            variant="outline"
            onClick={handleSurpriseClick}
            disabled={isLoading}
            className="border-[#e86a5c]/30 text-[#e86a5c] hover:bg-[#e86a5c]/10 font-semibold px-8"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2" />
            )}
            Surprise Me
          </Button>

          {showAuthPrompt && (
            <div className="flex flex-col items-center gap-3 p-4 mt-2 rounded-xl border border-gray-200 bg-white shadow-sm max-w-sm text-center animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-gray-600 font-medium">
                Want a surprise? Please log in to your account first!
              </p>
              <div className="flex items-center gap-2 w-full justify-center">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  className="text-gray-500 hover:bg-gray-100 font-medium px-4"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleLogin}
                  className="bg-[#e86a5c] hover:bg-[#e86a5c]/90 text-white font-semibold px-4"
                >
                  Log In
                </Button>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>{isLoading && <AILoadingOrb />}</AnimatePresence>

        <AnimatePresence>
          {showSurprise && surpriseData && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-[#e86a5c]" />
                <h2 className="font-display text-2xl font-bold">
                  Your Surprise Pick
                </h2>
              </div>

              <div className="relative rounded-2xl overflow-hidden card-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-2/5 aspect-[3/4] md:aspect-auto md:min-h-[450px] relative">
                    <img
                      src={surpriseData.title.poster_path ?? undefined}
                      alt={surpriseData.title.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>
                  <div className="flex-1 p-6 md:p-8 bg-card flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-lg bg-[#e86a5c] text-white text-xs font-bold">
                          Surprise Pick
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-[#d4a843]/20 text-[#d4a843] text-xs font-bold">
                          {surpriseData.confidence}% Match
                        </span>
                      </div>
                      <h3 className="font-display text-3xl font-bold mb-2">
                        {surpriseData.title.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {surpriseData.title.releaseDate} ·{" "}
                        {surpriseData.title.genres.join(", ")} ·{" "}
                        {surpriseData.title.rating.toFixed(1)}/10
                      </p>
                      <p className="text-foreground/90 leading-relaxed">
                        {surpriseData.explanation}
                      </p>
                    </div>
                    <Link
                      to={`/title/${surpriseData.title.mediaType}/${surpriseData.title.id}`}
                      className="mt-6"
                    >
                      <Button className="bg-[#d4a843] hover:bg-[#e8c866] text-background w-full md:w-auto">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoading && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Wand2 className="w-5 h-5 text-[#d4a843]" />
              <h2 className="font-display text-2xl font-bold">
                {mediaTab === "movie" ? "Discover Movies" : "Discover TV"}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((title, i) => (
                <MovieCard
                  key={`${title.mediaType}-${title.id}`}
                  title={title}
                  index={i}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
