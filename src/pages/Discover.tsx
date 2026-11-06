import { useEffect, useRef, useState } from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import { useSearchParams, Link, useNavigate } from "react-router";
import { AnimatePresence, motion, useInView } from "motion/react";
import {
  Sparkles,
  Diamond,
  Send,
  Film,
  Tv,
  SlidersHorizontal,
  X,
  RotateCcw,
  Star,
  Clock,
  Languages,
  CalendarRange,
  MonitorPlay,
  Wand2,
  LogIn,
  Check,
} from "lucide-react";
import { trpc } from "../providers/trpcClient";
import { MovieCard, type TitleData } from "../components/MovieCard";
import { AILoadingOrb } from "../components/AILoadingOrb";
import { Button } from "../components/ui/button";
import { Slider } from "../components/ui/slider";
import { SegmentedControl } from "../components/motion/SegmentedControl";
import { ErrorState, SkeletonCard } from "../components/ScrollRow";
import { useAuth } from "../hooks/useAuth";
import { useRegion } from "../hooks/useRegion";
import { RegionPicker } from "../components/RegionPicker";
import { ease, spring } from "../lib/motion";

type Sort = "popularity" | "rating" | "newest" | "oldest" | "votes" | "revenue" | "title";
type Media = "movie" | "tv";

const SORTS: { value: Sort; label: string }[] = [
  { value: "popularity", label: "Most popular" },
  { value: "rating", label: "Highest rated" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "votes", label: "Most voted" },
  { value: "revenue", label: "Box office" },
  { value: "title", label: "A → Z" },
];

const RUNTIMES = [
  { id: "short", label: "Under 90 min", min: 0, max: 89 },
  { id: "standard", label: "90–150 min", min: 90, max: 150 },
  { id: "epic", label: "Epic 150+", min: 151, max: 600 },
] as const;

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "it", label: "Italian" },
  { code: "de", label: "German" },
  { code: "tr", label: "Turkish" },
  { code: "zh", label: "Chinese" },
];

const DECADES = [2020, 2010, 2000, 1990, 1980, 1970];
const AI_EXAMPLES = [
  "A twisty thriller I can finish tonight",
  "Feel-good comedy for a family movie night",
  "Mind-bending sci-fi like Arrival",
  "Slow-burn Korean drama with great acting",
];

const numList = (v: string | null) =>
  (v ?? "")
    .split(",")
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0);


export default function Discover() {
  const { user, isAuthenticated } = useAuth();
  usePageMeta("Discover movies & TV", "Filter movies and TV shows by genre, decade, rating, runtime, language and streaming service, or ask the WatchWise AI for one perfect pick.");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [region] = useRegion();

  // ---- URL-backed filters (shareable links) ----
  const hiddenGems = params.get("hiddenGems") === "true";
  const mediaType: Media = params.get("type") === "tv" ? "tv" : "movie";
  const sort = (SORTS.find((s) => s.value === params.get("sort"))?.value ?? (hiddenGems ? "rating" : "popularity")) as Sort;
  const genres = numList(params.get("genre"));
  const providers = numList(params.get("providers"));
  const decade = parseInt(params.get("decade") ?? "", 10) || null;
  const ratingMin = parseFloat(params.get("rating") ?? "") || (hiddenGems ? 7 : 0);
  const runtimeId = RUNTIMES.find((r) => r.id === params.get("runtime"))?.id ?? null;
  const language = LANGUAGES.find((l) => l.code === params.get("lang"))?.code ?? null;

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  const toggleIn = (key: string, list: number[], id: number) => {
    const next = list.includes(id) ? list.filter((g) => g !== id) : [...list, id];
    update({ [key]: next.length ? next.join(",") : null });
  };

  const runtime = RUNTIMES.find((r) => r.id === runtimeId);
  const filters: Filters = {
    mediaType,
    sort,
    genres: genres.length ? genres : undefined,
    yearFrom: decade ?? undefined,
    yearTo: decade ? decade + 9 : undefined,
    ratingMin: ratingMin > 0 ? ratingMin : undefined,
    runtimeMin: runtime?.min,
    runtimeMax: runtime?.max,
    language: language ?? undefined,
    providers: providers.length ? providers : undefined,
    region: providers.length ? region : undefined,
    voteCountMin: hiddenGems ? 150 : undefined,
  };
  const filterKey = JSON.stringify(filters);

  const [showFilters, setShowFilters] = useState(false);
  const [pages, setPages] = useState(1);
  const [lastKey, setLastKey] = useState(filterKey);
  if (lastKey !== filterKey) {
    setLastKey(filterKey);
    setPages(1);
  }

  const genreQuery = trpc.movie.genres.useQuery({ mediaType });
  const providerQuery = trpc.movie.providers.useQuery({ mediaType, region }, { enabled: showFilters });
  const firstPage = trpc.movie.discoverAdvanced.useQuery({ ...filters, page: 1 });
  const totalPages = firstPage.data?.totalPages ?? 1;
  const totalResults = firstPage.data?.totalResults ?? 0;

  // ---- AI assistant ----
  const [prompt, setPrompt] = useState("");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const askAi = trpc.movie.askAi.useMutation();
  const aiResult = askAi.data;

  const handleAskAi = (text = prompt) => {
    const value = text.trim();
    if (!value || askAi.isPending) return;
    if (!user || !isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    setPrompt(value);
    askAi.mutate({ prompt: value });
  };

  const activeChips = [
    ...genres.map((g) => ({
      key: `g${g}`,
      label: genreQuery.data?.find((x) => x.id === g)?.name ?? "Genre",
      clear: () => toggleIn("genre", genres, g),
    })),
    decade ? { key: "decade", label: `${decade}s`, clear: () => update({ decade: null }) } : null,
    ratingMin > 0 ? { key: "rating", label: `★ ${ratingMin}+`, clear: () => update({ rating: null, hiddenGems: null }) } : null,
    runtime ? { key: "runtime", label: runtime.label, clear: () => update({ runtime: null }) } : null,
    language ? { key: "lang", label: LANGUAGES.find((l) => l.code === language)!.label, clear: () => update({ lang: null }) } : null,
    ...providers.map((p) => ({
      key: `p${p}`,
      label: providerQuery.data?.find((x) => x.id === p)?.name ?? "Streaming service",
      clear: () => toggleIn("providers", providers, p),
    })),
    hiddenGems ? { key: "gems", label: "Hidden gems", clear: () => update({ hiddenGems: null }) } : null,
  ].filter((c): c is { key: string; label: string; clear: () => void } => c !== null);

  const resetAll = () => setParams(new URLSearchParams(mediaType === "tv" ? { type: "tv" } : {}), { replace: true });

  return (
    <div className="min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="mb-10 text-center"
        >
          <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }} className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4a843]/30 bg-[#d4a843]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#e8c866]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Discover
          </motion.div>
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 20, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: ease.out } } }}
            className="font-display text-4xl font-bold tracking-tight md:text-5xl"
          >
            Find your next <span className="text-gradient">obsession</span>
          </motion.h1>
          <motion.p variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Ask the AI for one perfect pick, or dial in genre, decade, rating, runtime, language and streaming service.
          </motion.p>
        </motion.header>

        {/* AI Ask */}
        <motion.section
          aria-label="Ask WatchWise AI"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: ease.out }}
          className="mx-auto mb-12 max-w-3xl"
        >
          <div className="relative rounded-2xl bg-gradient-to-r from-[#e86a5c]/60 via-[#d4a843]/60 to-[#8a6fbf]/60 p-[1px] shadow-[0_20px_60px_-20px_rgba(232,106,92,0.5)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAi();
              }}
              className="flex items-center gap-2 rounded-2xl bg-[#0d0c14] p-2"
            >
              <Wand2 className="ml-2 h-5 w-5 flex-shrink-0 text-[#e86a5c]" aria-hidden="true" />
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                aria-label="Describe what you want to watch"
                placeholder="Ask AI — e.g. ‘horror romance to watch with my girlfriend’…"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none md:text-base"
                disabled={askAi.isPending}
                maxLength={500}
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.95 }}
                disabled={askAi.isPending || prompt.trim().length < 3}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-[#e86a5c] px-4 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              >
                {askAi.isPending ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                ) : (
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {askAi.isPending ? "Thinking…" : "Ask"}
              </motion.button>
            </form>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {AI_EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => handleAskAi(ex)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-[#e86a5c]/50 hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </div>

          {askAi.isError && (
            <p role="alert" className="mt-3 text-center text-sm text-red-400">
              Something went wrong — please try again.
            </p>
          )}

          <AnimatePresence>
            {showAuthPrompt && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mx-auto mt-4 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-[#e86a5c]/30 bg-card/90 p-4 text-center backdrop-blur">
                  <p className="text-sm font-medium">Want AI picks? Sign in to your account first.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowAuthPrompt(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => navigate("/login")} className="bg-[#e86a5c] text-white hover:bg-[#e86a5c]/90">
                      <LogIn className="mr-1.5 h-4 w-4" /> Log In
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <AnimatePresence>{askAi.isPending && <AILoadingOrb />}</AnimatePresence>

        <AnimatePresence>
          {aiResult && !askAi.isPending && (
            <motion.section
              aria-label="AI pick"
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={spring.soft}
              className="mb-14"
            >
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card">
                {aiResult.title.backdrop_path && (
                  <img src={aiResult.title.backdrop_path} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 blur-sm" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/60" />
                <div className="relative flex flex-col md:flex-row">
                  <motion.div
                    initial={{ rotate: -4, opacity: 0, x: -20 }}
                    animate={{ rotate: 0, opacity: 1, x: 0 }}
                    transition={{ ...spring.soft, delay: 0.15 }}
                    className="p-6 md:w-72 md:flex-shrink-0"
                  >
                    {aiResult.title.poster_path && (
                      <img src={aiResult.title.poster_path} alt={aiResult.title.title} className="mx-auto w-48 rounded-2xl shadow-2xl md:w-full" />
                    )}
                  </motion.div>
                  <div className="flex flex-1 flex-col justify-center p-6 pt-0 md:p-8 md:pl-2">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#e86a5c] px-3 py-1 text-xs font-bold text-white">AI Pick</span>
                      <span className="rounded-full bg-[#d4a843]/20 px-3 py-1 text-xs font-bold text-[#e8c866]">
                        {aiResult.confidence}% Match
                      </span>
                    </div>
                    <h2 className="mb-2 font-display text-3xl font-bold md:text-4xl">{aiResult.title.title}</h2>
                    <p className="mb-4 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                      {aiResult.title.releaseYear ?? aiResult.title.releaseDate?.slice(0, 4)}
                      <span>·</span>
                      {aiResult.title.genres.slice(0, 3).join(", ")}
                      <span>·</span>
                      <span className="flex items-center gap-1 text-[#e8c866]">
                        <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        {aiResult.title.rating.toFixed(1)}
                      </span>
                    </p>
                    <p className="max-w-2xl leading-relaxed text-foreground/90">{aiResult.explanation}</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button asChild className="rounded-full bg-[#d4a843] text-background hover:bg-[#e8c866]">
                        <Link to={`/title/${aiResult.title.mediaType === "tv" ? "tv" : "movie"}/${aiResult.title.id}`}>View Details</Link>
                      </Button>
                      <Button variant="outline" className="rounded-full" onClick={() => handleAskAi()}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Another pick
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ---------- Filter bar ---------- */}
        <div className="relative z-30 -mx-4 mb-6 border-y md:sticky md:top-14 border-white/[0.06] bg-background/85 px-4 py-3 backdrop-blur-xl md:-mx-6 md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              id="discover-media"
              label="Media type"
              value={mediaType}
              onChange={(v) => update({ type: v === "tv" ? "tv" : null, genre: null, providers: null })}
              options={[
                { value: "movie", label: "Movies", icon: Film },
                { value: "tv", label: "TV Shows", icon: Tv },
              ]}
            />
            <label className="relative">
              <span className="sr-only">Sort by</span>
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value === "popularity" ? null : e.target.value })}
                className="h-10 appearance-none rounded-full border border-white/10 bg-white/[0.03] pl-4 pr-9 text-sm outline-none hover:border-white/20 focus:border-[#d4a843]/50"
              >
                {SORTS.filter((s) => mediaType === "movie" || s.value !== "revenue").map((s) => (
                  <option key={s.value} value={s.value} className="bg-card">
                    {s.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">▾</span>
            </label>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => update({ hiddenGems: hiddenGems ? null : "true", sort: null, rating: null })}
              aria-pressed={hiddenGems}
              className={`flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
                hiddenGems ? "border-[#8a6fbf] bg-[#8a6fbf]/20 text-[#c4b1ea]" : "border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Diamond className="h-4 w-4" aria-hidden="true" /> Hidden gems
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              aria-controls="discover-filters"
              className={`ml-auto flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
                showFilters ? "border-[#d4a843] bg-[#d4a843]/10 text-[#e8c866]" : "border-white/10 hover:border-white/20"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
              {activeChips.length > 0 && (
                <motion.span
                  key={activeChips.length}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={spring.bouncy}
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d4a843] px-1 text-[10px] font-bold text-background"
                >
                  {activeChips.length}
                </motion.span>
              )}
            </motion.button>
          </div>

          {/* Genre chips */}
          <div className="scrollbar-hide -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {(genreQuery.data ?? []).map((g) => {
              const on = genres.includes(g.id);
              return (
                <motion.button
                  key={g.id}
                  type="button"
                  layout
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggleIn("genre", genres, g.id)}
                  aria-pressed={on}
                  className={`flex flex-shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    on ? "border-[#d4a843] bg-[#d4a843] text-background" : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground"
                  }`}
                >
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="overflow-hidden">
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {g.name}
                </motion.button>
              );
            })}
          </div>

          {/* Expanded filters */}
          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div
                id="discover-filters"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: ease.out }}
                className="overflow-hidden"
              >
                <div className="grid gap-6 pb-2 pt-5 md:grid-cols-2 lg:grid-cols-4">
                  <FilterGroup icon={CalendarRange} label="Decade">
                    <div className="flex flex-wrap gap-2">
                      {DECADES.map((d) => (
                        <Chip key={d} on={decade === d} onClick={() => update({ decade: decade === d ? null : String(d) })}>
                          {d}s
                        </Chip>
                      ))}
                    </div>
                  </FilterGroup>
                  <FilterGroup icon={Star} label={`Minimum rating: ${ratingMin > 0 ? ratingMin.toFixed(1) : "any"}`}>
                    <Slider
                      value={[ratingMin]}
                      min={0}
                      max={9}
                      step={0.5}
                      onValueChange={([v]) => update({ rating: v ? String(v) : null, hiddenGems: null })}
                      aria-label="Minimum rating"
                      className="mt-3"
                    />
                  </FilterGroup>
                  <FilterGroup icon={Clock} label="Runtime">
                    <div className="flex flex-wrap gap-2">
                      {RUNTIMES.map((r) => (
                        <Chip key={r.id} on={runtimeId === r.id} onClick={() => update({ runtime: runtimeId === r.id ? null : r.id })}>
                          {r.label}
                        </Chip>
                      ))}
                    </div>
                  </FilterGroup>
                  <FilterGroup icon={Languages} label="Original language">
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.slice(0, 8).map((l) => (
                        <Chip key={l.code} on={language === l.code} onClick={() => update({ lang: language === l.code ? null : l.code })}>
                          {l.label}
                        </Chip>
                      ))}
                    </div>
                  </FilterGroup>
                  <div className="md:col-span-2 lg:col-span-4">
                    <FilterGroup icon={MonitorPlay} label="Streaming services">
                      <RegionPicker className="mb-3" />
                      {providerQuery.isLoading ? (
                        <div className="flex gap-2">
                          {Array.from({ length: 10 }, (_, i) => (
                            <div key={i} className="shimmer h-11 w-11 rounded-xl" />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(providerQuery.data ?? []).map((p) => {
                            const on = providers.includes(p.id);
                            return (
                              <motion.button
                                key={p.id}
                                type="button"
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => toggleIn("providers", providers, p.id)}
                                aria-pressed={on}
                                aria-label={p.name}
                                title={p.name}
                                className={`relative h-11 w-11 overflow-hidden rounded-xl border-2 transition-all ${
                                  on ? "border-[#d4a843] shadow-[0_0_18px_rgba(212,168,67,0.5)]" : "border-transparent opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                                }`}
                              >
                                {p.logo && <img src={p.logo} alt="" className="h-full w-full object-cover" loading="lazy" />}
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </FilterGroup>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active chips + count */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <p className="mr-2 text-sm text-muted-foreground" aria-live="polite">
            {firstPage.isLoading ? "Searching the catalog…" : `${totalResults.toLocaleString()} ${mediaType === "tv" ? "shows" : "movies"}`}
          </p>
          <AnimatePresence initial={false} mode="popLayout">
            {activeChips.map((c) => (
              <motion.button
                key={c.key}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={c.clear}
                className="flex items-center gap-1 rounded-full bg-[#d4a843]/15 px-2.5 py-1 text-xs font-medium text-[#e8c866] hover:bg-[#d4a843]/25"
                aria-label={`Remove filter ${c.label}`}
              >
                {c.label} <X className="h-3 w-3" aria-hidden="true" />
              </motion.button>
            ))}
          </AnimatePresence>
          {activeChips.length > 0 && (
            <button type="button" onClick={resetAll} className="ml-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3 w-3" aria-hidden="true" /> Reset
            </button>
          )}
        </div>

        {/* Results */}
        {firstPage.isError ? (
          <ErrorState message="We couldn't load titles for these filters." onRetry={() => firstPage.refetch()} />
        ) : !firstPage.isLoading && totalResults === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-20 text-center">
            <Film className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" aria-hidden="true" />
            <h3 className="mb-2 font-display text-lg font-bold">No matches</h3>
            <p className="mb-6 text-sm text-muted-foreground">Try removing a filter or widening the decade.</p>
            <Button variant="outline" className="rounded-full" onClick={resetAll}>
              Reset filters
            </Button>
          </motion.div>
        ) : (
          <div key={filterKey} className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: pages }, (_, i) => (
              <DiscoverPage key={i + 1} filters={filters} page={i + 1} />
            ))}
          </div>
        )}

        {pages < totalPages && !firstPage.isLoading && totalResults > 0 && (
          <LoadMore onLoad={() => setPages((p) => Math.min(p + 1, totalPages))} />
        )}
      </div>
    </div>
  );
}

interface Filters {
  mediaType: Media;
  sort: Sort;
  genres?: number[];
  yearFrom?: number;
  yearTo?: number;
  ratingMin?: number;
  runtimeMin?: number;
  runtimeMax?: number;
  language?: string;
  providers?: number[];
  region?: string;
  voteCountMin?: number;
}

function DiscoverPage({ filters, page }: { filters: Filters; page: number }) {
  const q = trpc.movie.discoverAdvanced.useQuery({ ...filters, page }, { staleTime: 5 * 60_000 });
  if (q.isLoading) {
    return (
      <>
        {Array.from({ length: 12 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </>
    );
  }
  if (q.isError) {
    return (
      <div className="col-span-full">
        <ErrorState onRetry={() => q.refetch()} />
      </div>
    );
  }
  return (
    <>
      {((q.data?.results ?? []) as TitleData[]).map((title, i) => (
        <MovieCard key={`${title.mediaType}-${title.id}-${page}`} title={title} index={i} />
      ))}
    </>
  );
}

/** Auto-loads the next page when the sentinel scrolls into view; also a real button. */
function LoadMore({ onLoad }: { onLoad: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px 400px 0px" });
  const cb = useRef(onLoad);
  useEffect(() => {
    cb.current = onLoad;
  });
  useEffect(() => {
    if (inView) cb.current();
  }, [inView]);

  return (
    <div ref={ref} className="mt-10 flex justify-center">
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={onLoad}
        className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium hover:border-[#d4a843]/50 hover:text-[#e8c866]"
      >
        Load more
      </motion.button>
    </div>
  );
}

function FilterGroup({ icon: Icon, label, children }: { icon: typeof Star; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
      </div>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        on ? "border-[#d4a843] bg-[#d4a843] text-background" : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground"
      }`}
    >
      {children}
    </motion.button>
  );
}
