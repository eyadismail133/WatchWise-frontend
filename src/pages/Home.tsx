import { Link } from "react-router";
import { MovieCard } from "../components/MovieCard";
import { Sparkles, TrendingUp, Zap, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { trpc } from "../providers/trpcClient";
import type { TitleData } from "../components/MovieCard";
import homeBackground from "../../assets/home background.png";

export default function Home() {
  const { data: trendingData, isLoading: trendingLoading } =
    trpc.movie.trending.useQuery({ timeWindow: "day" });

  const { data: topRatedData, isLoading: topRatedLoading } =
    trpc.movie.topRated.useQuery({ mediaType: "movie", page: 1 });

  const { data: upComingData, isLoading: upComingLoading } =
    trpc.movie.upComing.useQuery({ mediaType: "movie", page: 1 });

  const trending = (trendingData?.results ?? []) as TitleData[];
  const topRating = (topRatedData?.results ?? []) as TitleData[];
  const upComing = (upComingData?.results ?? []) as TitleData[];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[75vh] w-full flex items-center overflow-hidden bg-background">
        {/* Background */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src={homeBackground}
            alt="Cinema background"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-8">
          <div className="max-w-2xl">
            {/* Small Clean Tag */}
            <p className="font-display text-xl font-bold tracking-widest uppercase text-[#d4a843] mb-3">
              WatchWise
            </p>

            {/* Sharp, Punchy Line */}
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
              The right movie. <br />
              <span className="text-muted-foreground font-normal">
                Right now.
              </span>
            </h1>

            {/* Short, Simple Subtitle */}
            <p className="mt-4 text-base md:text-lg text-muted-foreground/90 max-w-lg leading-relaxed">
              Skip the endless scrolling. Our AI instantly surfaces top
              cinematic picks tailored exactly to your current mood.
            </p>

            {/* Clean Button & Stats Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mt-8">
              <Link to="/discover">
                <Button
                  size="lg"
                  className="bg-[#d4a843] text-background hover:bg-[#e8c866] font-medium px-6 rounded-md shadow-lg transition-all"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Explore Trending
                </Button>
              </Link>

              {/* Minimalist Live Stat */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>2.8k movie buffs online</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Now Section */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#e86a5c]" />
              <h2 className="font-display text-2xl font-bold">Trending Now</h2>
            </div>
            <Link
              to="/discover"
              className="text-sm text-[#d4a843] hover:text-[#e8c866] flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
              {trendingLoading ? (
                <div className="flex items-center justify-center w-full h-44">
                  <p className="text-muted-foreground">Loading trending...</p>
                </div>
              ) : (
                trending.map((title, i) => (
                  <div
                    key={`${title.mediaType}-${title.id}`}
                    className="flex-shrink-0 w-44"
                  >
                    <MovieCard title={title} index={i + 1} userStatus={null} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* topRated Section */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#e86a5c]" />
              <h2 className="font-display text-2xl font-bold">Top Rated</h2>
            </div>
            <Link
              to="/discover"
              className="text-sm text-[#d4a843] hover:text-[#e8c866] flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
              {topRatedLoading ? (
                <div className="flex items-center justify-center w-full h-44">
                  <p className="text-muted-foreground">Loading Top Rated...</p>
                </div>
              ) : (
                topRating.map((title, i) => (
                  <div
                    key={`${title.mediaType}-${title.id}`}
                    className="flex-shrink-0 w-44"
                  >
                    <MovieCard title={title} index={i + 1} userStatus={null} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* UpComing Section */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#e86a5c]" />
              <h2 className="font-display text-2xl font-bold">UpComing</h2>
            </div>
            <Link
              to="/discover"
              className="text-sm text-[#d4a843] hover:text-[#e8c866] flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
              {upComingLoading ? (
                <div className="flex items-center justify-center w-full h-44">
                  <p className="text-muted-foreground">Loading upComing...</p>
                </div>
              ) : (
                upComing.map((title, i) => (
                  <div
                    key={`${title.mediaType}-${title.id}`}
                    className="flex-shrink-0 w-44"
                  >
                    <MovieCard title={title} index={i + 1} userStatus={null} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "Beyond Algorithms",
                desc: "WatchWise understands context, not just patterns. Our AI explains every recommendation so you understand the 'why'.",
                color: "#d4a843",
              },
              {
                icon: Users,
                title: "Your Taste Profile",
                desc: "Build a living profile of your preferences. Rate, review, and refine - the more you interact, the better it gets.",
                color: "#8a6fbf",
              },
              {
                icon: Zap,
                title: "Discover Hidden Gems",
                desc: "Go beyond the mainstream. We surface incredible films and shows that deserve way more attention than they get.",
                color: "#e86a5c",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-2xl bg-card/50 border border-border/50"
              >
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <item.icon
                    className="w-6 h-6"
                    style={{ color: item.color }}
                  />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
