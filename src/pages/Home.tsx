import { lazy, Suspense, useState } from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Sparkles,
  TrendingUp,
  Zap,
  Users,
  Trophy,
  Clapperboard,
  Tv,
  CalendarClock,
  Star,
  Radio,
  Shapes,
  ArrowRight,
  Wand2,
} from "lucide-react";
const HomeGuides = lazy(() => import("../components/HomeGuides"));
import { MovieCard, type TitleData } from "../components/MovieCard";
import { HeroCarousel } from "../components/HeroCarousel";
import { RowItem, ScrollRow, SectionHeader } from "../components/ScrollRow";
import { PersonCard } from "../components/PersonCard";
import { SegmentedControl } from "../components/motion/SegmentedControl";
import { Reveal } from "../components/motion/Reveal";
import { trpc } from "../providers/trpcClient";
import { cappedDelay, ease, spring } from "../lib/motion";

const GENRE_TINTS = [
  "from-[#d4a843]/40 to-[#8a6fbf]/20",
  "from-[#e86a5c]/40 to-[#d4a843]/10",
  "from-[#8a6fbf]/45 to-[#3b82f6]/15",
  "from-[#10b981]/35 to-[#d4a843]/10",
  "from-[#3b82f6]/40 to-[#8a6fbf]/15",
  "from-[#f472b6]/35 to-[#e86a5c]/10",
];

function TitleShelf({
  items,
  rankStart,
}: {
  items: TitleData[];
  rankStart?: number;
}) {
  return (
    <>
      {items.map((title, i) => (
        <RowItem key={`${title.mediaType}-${title.id}`}>
          <MovieCard
            title={title}
            index={i}
            rank={rankStart !== undefined ? rankStart + i : undefined}
          />
        </RowItem>
      ))}
    </>
  );
}

export default function Home() {
  usePageMeta();
  const [trendWindow, setTrendWindow] = useState<"day" | "week">("day");
  const [trendType, setTrendType] = useState<"all" | "movie" | "tv">("all");
  const [topType, setTopType] = useState<"movie" | "tv">("movie");

  const hero = trpc.movie.trending.useQuery({ timeWindow: "day" });
  const trending = trpc.movie.trending.useQuery({ timeWindow: trendWindow, mediaType: trendType });
  const top10 = trpc.movie.trending.useQuery({ timeWindow: "week", mediaType: "movie" });
  const nowPlaying = trpc.movie.list.useQuery({ mediaType: "movie", category: "now_playing" });
  const popularTv = trpc.movie.list.useQuery({ mediaType: "tv", category: "popular" });
  const topRated = trpc.movie.topRated.useQuery({ mediaType: topType, page: 1 });
  const upcoming = trpc.movie.upComing.useQuery({ mediaType: "movie", page: 1 });
  const airingToday = trpc.movie.list.useQuery({ mediaType: "tv", category: "airing_today" });
  const people = trpc.movie.trendingPeople.useQuery({ timeWindow: "week" });
  const genres = trpc.movie.genres.useQuery({ mediaType: "movie" });

  const heroSlides = ((hero.data?.results ?? []) as TitleData[])
    .filter((t) => t.backdrop_path)
    .slice(0, 6);

  const results = (q: { data?: { results: unknown[] } }) =>
    (q.data?.results ?? []) as TitleData[];

  return (
    <div className="min-h-screen">
      <HeroCarousel slides={heroSlides} isLoading={hero.isLoading} />

      <div className="relative z-10 mx-auto -mt-10 max-w-7xl space-y-14 px-4 pb-8 md:space-y-16 md:px-6">
        <ScrollRow
          title="Trending"
          icon={TrendingUp}
          accent="#e86a5c"
          subtitle="What everyone is watching right now"
          href="/discover"
          isLoading={trending.isLoading}
          isError={trending.isError}
          onRetry={() => trending.refetch()}
          isEmpty={results(trending).length === 0}
          actions={
            <div className="flex flex-wrap gap-2">
              <SegmentedControl
                id="trend-window"
                label="Trending window"
                size="sm"
                value={trendWindow}
                onChange={setTrendWindow}
                options={[
                  { value: "day", label: "Today" },
                  { value: "week", label: "This week" },
                ]}
              />
              <SegmentedControl
                id="trend-type"
                label="Trending media type"
                size="sm"
                value={trendType}
                onChange={setTrendType}
                options={[
                  { value: "all", label: "All" },
                  { value: "movie", label: "Movies" },
                  { value: "tv", label: "TV" },
                ]}
              />
            </div>
          }
        >
          <TitleShelf items={results(trending)} />
        </ScrollRow>

        {/* AI teaser */}
        <Reveal>
          <Link
            to="/discover"
            className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b1626] via-[#120f1a] to-[#0b0a10] p-6 md:p-10"
          >
            <motion.div
              aria-hidden="true"
              className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#8a6fbf]/30 blur-3xl"
            />
            <motion.div
              aria-hidden="true"
              className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-[#d4a843]/20 blur-3xl"
            />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e86a5c]/15 px-3 py-1 text-xs font-semibold text-[#f39a8f]">
                  <Wand2 className="h-3.5 w-3.5" aria-hidden="true" /> WatchWise AI
                </span>
                <h2 className="mt-3 font-display text-2xl font-bold md:text-3xl">
                  Can&apos;t decide? Describe the vibe.
                </h2>
                <p className="mt-2 text-muted-foreground">
                  “A cozy mystery for a rainy Sunday” or “mind-bending sci-fi under two hours” —
                  get one confident pick with the reason why.
                </p>
              </div>
              <motion.span
                whileHover={{ x: 4 }}
                transition={spring.snappy}
                className="inline-flex items-center gap-2 self-start rounded-full bg-[#d4a843] px-5 py-3 font-semibold text-background shadow-[0_10px_40px_-10px_rgba(212,168,67,0.8)] md:self-auto"
              >
                Ask for a pick <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.span>
            </div>
          </Link>
        </Reveal>

        <ScrollRow
          title="Top 10 movies this week"
          icon={Trophy}
          subtitle="Ranked by TMDB trending activity"
          isLoading={top10.isLoading}
          isError={top10.isError}
          onRetry={() => top10.refetch()}
          isEmpty={results(top10).length === 0}
        >
          <TitleShelf items={results(top10).slice(0, 10)} rankStart={1} />
        </ScrollRow>

        <ScrollRow
          title="Now in theaters"
          icon={Clapperboard}
          accent="#8a6fbf"
          href="/discover?type=movie&sort=newest"
          isLoading={nowPlaying.isLoading}
          isError={nowPlaying.isError}
          onRetry={() => nowPlaying.refetch()}
          isEmpty={results(nowPlaying).length === 0}
        >
          <TitleShelf items={results(nowPlaying)} />
        </ScrollRow>

        <ScrollRow
          title="Popular on TV"
          icon={Tv}
          accent="#3b82f6"
          href="/discover?type=tv"
          isLoading={popularTv.isLoading}
          isError={popularTv.isError}
          onRetry={() => popularTv.refetch()}
          isEmpty={results(popularTv).length === 0}
        >
          <TitleShelf items={results(popularTv)} />
        </ScrollRow>

        {/* Genre tiles */}
        {(genres.data?.length ?? 0) > 0 && (
          <section aria-labelledby="genres-heading">
            <SectionHeader id="genres-heading" title="Browse by genre" icon={Shapes} accent="#10b981" />
            <motion.ul
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }}
            >
              {genres.data!.slice(0, 18).map((g, i) => (
                <motion.li
                  key={g.id}
                  variants={{
                    hidden: { opacity: 0, y: 16, scale: 0.95 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: ease.out } },
                  }}
                >
                  <Link
                    to={`/discover?type=movie&genre=${g.id}`}
                    className={`group relative flex h-20 items-end overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${GENRE_TINTS[i % GENRE_TINTS.length]} p-3 transition-transform hover:-translate-y-1`}
                  >
                    <span className="absolute inset-0 bg-[#0b0a10]/50 transition-opacity group-hover:opacity-20" />
                    <span className="relative font-semibold tracking-wide">{g.name}</span>
                    <ArrowRight className="absolute right-3 top-3 h-4 w-4 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </section>
        )}

        <ScrollRow
          title="Trending people"
          icon={Users}
          accent="#f472b6"
          subtitle="Actors and filmmakers in the spotlight"
          isLoading={people.isLoading}
          isError={people.isError}
          onRetry={() => people.refetch()}
          isEmpty={(people.data?.results.length ?? 0) === 0}
        >
          {(people.data?.results ?? []).map((p, i) => (
            <div key={p.id} className="w-32 flex-shrink-0 snap-start sm:w-36">
              <PersonCard
                id={p.id}
                name={p.name}
                image={p.image}
                caption={p.knownFor.slice(0, 2).join(", ")}
                secondary={p.knownForDepartment}
                index={i}
              />
            </div>
          ))}
        </ScrollRow>

        <ScrollRow
          title="Top rated"
          icon={Star}
          subtitle="All-time favorites by audience score"
          href={`/discover?type=${topType}&sort=rating`}
          isLoading={topRated.isLoading}
          isError={topRated.isError}
          onRetry={() => topRated.refetch()}
          isEmpty={results(topRated).length === 0}
          actions={
            <SegmentedControl
              id="top-type"
              label="Top rated media type"
              size="sm"
              value={topType}
              onChange={setTopType}
              options={[
                { value: "movie", label: "Movies" },
                { value: "tv", label: "TV" },
              ]}
            />
          }
        >
          <TitleShelf items={results(topRated)} />
        </ScrollRow>

        <ScrollRow
          title="Coming soon"
          icon={CalendarClock}
          accent="#8a6fbf"
          isLoading={upcoming.isLoading}
          isError={upcoming.isError}
          onRetry={() => upcoming.refetch()}
          isEmpty={results(upcoming).length === 0}
        >
          <TitleShelf items={results(upcoming)} />
        </ScrollRow>

        <ScrollRow
          title="Airing today"
          icon={Radio}
          accent="#e86a5c"
          subtitle="New episodes out today"
          isLoading={airingToday.isLoading}
          isError={airingToday.isError}
          onRetry={() => airingToday.refetch()}
          isEmpty={results(airingToday).length === 0}
        >
          <TitleShelf items={results(airingToday)} />
        </ScrollRow>

        {/* Editorial guides (lazy: keeps article text out of the entry bundle) */}
        <Suspense fallback={<div className="h-56" aria-hidden="true" />}>
          <HomeGuides />
        </Suspense>

        {/* Value props */}
        <section aria-label="Why WatchWise" className="pt-4">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "Beyond Algorithms",
                desc: "WatchWise understands context, not just patterns. Every AI pick explains the 'why'.",
                color: "#d4a843",
              },
              {
                icon: Users,
                title: "Your Taste Profile",
                desc: "Rate, save and favorite — your living profile sharpens every recommendation.",
                color: "#8a6fbf",
              },
              {
                icon: Zap,
                title: "Discover Hidden Gems",
                desc: "Filter by mood, era, runtime, language and streaming service to find something new.",
                color: "#e86a5c",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.6, ease: ease.out, delay: cappedDelay(i, 0.1) }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card/60 p-6"
              >
                <div
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                  style={{ backgroundColor: item.color }}
                />
                <div
                  className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <item.icon className="h-6 w-6" style={{ color: item.color }} />
                </div>
                <h3 className="relative mb-2 font-display text-lg font-bold">{item.title}</h3>
                <p className="relative text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
