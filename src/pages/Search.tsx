import { useEffect, useRef, useState } from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import { useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Search as SearchIcon, X, Film, Tv, Users, LayoutGrid, History, TrendingUp } from "lucide-react";
import { MovieCard, type TitleData } from "../components/MovieCard";
import { PersonCard } from "../components/PersonCard";
import { ErrorState, SkeletonCard, SectionHeader } from "../components/ScrollRow";
import { SegmentedControl } from "../components/motion/SegmentedControl";
import { useDebounce } from "../hooks/useDebounce";
import { trpc } from "../providers/trpcClient";
import { ease } from "../lib/motion";

type Tab = "all" | "movie" | "tv" | "people";
const RECENT_KEY = "watchwise:recent-searches";

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
  } catch {
    // storage unavailable (private mode) — recent searches are a convenience only
  }
}

const grid = "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

export default function Search() {
  const [params, setParams] = useSearchParams();
  usePageMeta("Search", "Search movies, TV shows, actors and directors on WatchWise.");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "all");
  const [recent, setRecent] = useState<string[]>(() => (typeof window === "undefined" ? [] : readRecent()));
  const inputRef = useRef<HTMLInputElement>(null);

  const debounced = useDebounce(query.trim(), 300);
  const active = debounced.length >= 2;

  // Keep the URL shareable (?q=…&tab=…) without adding history entries per keystroke.
  useEffect(() => {
    const next = new URLSearchParams();
    if (debounced) next.set("q", debounced);
    if (tab !== "all") next.set("tab", tab);
    setParams(next, { replace: true });
  }, [debounced, tab, setParams]);

  // Remember meaningful searches.
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => {
      setRecent((prev) => {
        const next = [debounced, ...prev.filter((p) => p.toLowerCase() !== debounced.toLowerCase())].slice(0, 8);
        writeRecent(next);
        return next;
      });
    }, 1200);
    return () => window.clearTimeout(id);
  }, [active, debounced]);

  const all = trpc.movie.searchAll.useQuery({ query: debounced }, { enabled: active && tab === "all" });
  const trending = trpc.movie.trending.useQuery({ timeWindow: "day" }, { enabled: !active });

  const clear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: ease.out }} className="mb-8">
          <h1 className="mb-6 font-display text-4xl font-bold tracking-tight">Search</h1>

          <div className="group relative max-w-3xl">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[#d4a843]/0 via-[#d4a843]/40 to-[#8a6fbf]/0 opacity-0 blur transition-opacity duration-500 group-focus-within:opacity-100" />
            <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-card/80 p-2 backdrop-blur transition-colors group-focus-within:border-[#d4a843]/50">
              <SearchIcon className="ml-2 h-5 w-5 text-muted-foreground group-focus-within:text-[#d4a843]" aria-hidden="true" />
              <input
                ref={inputRef}
                autoFocus
                aria-label="Search movies, TV shows and people"
                placeholder="Search movies, TV shows, actors, directors…"
                className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground focus-visible:outline-none md:text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    onClick={clear}
                    className="rounded-full p-2 hover:bg-white/10"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-5">
            <SegmentedControl
              id="search-tab"
              label="Result type"
              value={tab}
              onChange={setTab}
              options={[
                { value: "all", label: "All", icon: LayoutGrid },
                { value: "movie", label: "Movies", icon: Film },
                { value: "tv", label: "TV", icon: Tv },
                { value: "people", label: "People", icon: Users },
              ]}
            />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!active ? (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
              {recent.length > 0 && (
                <section aria-labelledby="recent-heading">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 id="recent-heading" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                      <History className="h-4 w-4" aria-hidden="true" /> Recent searches
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setRecent([]);
                        writeRecent([]);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r, i) => (
                      <motion.button
                        key={r}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => setQuery(r)}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-sm hover:border-[#d4a843]/40 hover:text-[#e8c866]"
                      >
                        {r}
                      </motion.button>
                    ))}
                  </div>
                </section>
              )}
              <section aria-labelledby="popular-heading">
                <SectionHeader id="popular-heading" title="Popular right now" icon={TrendingUp} accent="#e86a5c" subtitle="Type at least 2 characters to search" />
                {trending.isError ? (
                  <ErrorState onRetry={() => trending.refetch()} />
                ) : (
                  <div className={grid}>
                    {trending.isLoading
                      ? Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} />)
                      : ((trending.data?.results ?? []) as TitleData[]).map((t, i) => (
                          <MovieCard key={`${t.mediaType}-${t.id}`} title={t} index={i} />
                        ))}
                  </div>
                )}
              </section>
            </motion.div>
          ) : (
            <motion.div key={`results-${tab}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {tab === "all" ? (
                all.isLoading ? (
                  <div className={grid}>{Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} />)}</div>
                ) : all.isError ? (
                  <ErrorState onRetry={() => all.refetch()} />
                ) : (all.data?.titles.length ?? 0) + (all.data?.people.length ?? 0) === 0 ? (
                  <NoResults query={debounced} />
                ) : (
                  <div className="space-y-12">
                    {(all.data?.people.length ?? 0) > 0 && (
                      <section aria-labelledby="people-heading">
                        <SectionHeader id="people-heading" title="People" icon={Users} accent="#f472b6" />
                        <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
                          {all.data!.people.map((p, i) => (
                            <div key={p.id} className="w-32 flex-shrink-0">
                              <PersonCard id={p.id} name={p.name} image={p.image} caption={p.knownFor.slice(0, 2).join(", ")} secondary={p.knownForDepartment} index={i} />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                    {(all.data?.titles.length ?? 0) > 0 && (
                      <section aria-labelledby="titles-heading">
                        <SectionHeader
                          id="titles-heading"
                          title="Movies & TV"
                          icon={Film}
                          subtitle={`Found ${all.data!.titles.length} result${all.data!.titles.length !== 1 ? "s" : ""} for "${debounced}"`}
                        />
                        <div className={grid}>
                          {(all.data!.titles as TitleData[]).map((t, i) => (
                            <MovieCard key={`${t.mediaType}-${t.id}`} title={t} index={i} />
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )
              ) : tab === "people" ? (
                <PagedPeople query={debounced} />
              ) : (
                <PagedTitles query={debounced} mediaType={tab} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="py-20 text-center">
      <SearchIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" aria-hidden="true" />
      <h3 className="mb-2 font-display text-lg font-bold text-muted-foreground">No Results Found</h3>
      <p className="text-sm text-muted-foreground/70">Nothing matched “{query}”. Check the spelling or try another title.</p>
    </motion.div>
  );
}

function PagedTitles({ query, mediaType }: { query: string; mediaType: "movie" | "tv" }) {
  const [pages, setPages] = useState(1);
  const first = trpc.movie.searchTitles.useQuery({ query, mediaType, page: 1 });
  if (first.isLoading) return <div className={grid}>{Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} />)}</div>;
  if (first.isError) return <ErrorState onRetry={() => first.refetch()} />;
  if ((first.data?.totalResults ?? 0) === 0) return <NoResults query={query} />;
  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
        {first.data!.totalResults.toLocaleString()} {mediaType === "tv" ? "shows" : "movies"} for “{query}”
      </p>
      <div className={grid}>
        {Array.from({ length: pages }, (_, i) => (
          <TitlePage key={i} query={query} mediaType={mediaType} page={i + 1} />
        ))}
      </div>
      {pages < (first.data?.totalPages ?? 1) && (
        <div className="mt-10 text-center">
          <button type="button" onClick={() => setPages((p) => p + 1)} className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium hover:border-[#d4a843]/50 hover:text-[#e8c866]">
            Load more
          </button>
        </div>
      )}
    </>
  );
}

function TitlePage({ query, mediaType, page }: { query: string; mediaType: "movie" | "tv"; page: number }) {
  const q = trpc.movie.searchTitles.useQuery({ query, mediaType, page });
  if (q.isLoading) return <>{Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} />)}</>;
  return (
    <>
      {((q.data?.results ?? []) as TitleData[]).map((t, i) => (
        <MovieCard key={`${t.mediaType}-${t.id}`} title={t} index={i} />
      ))}
    </>
  );
}

function PagedPeople({ query }: { query: string }) {
  const [page, setPage] = useState(1);
  const q = trpc.movie.searchPeople.useQuery({ query, page });
  if (q.isLoading) return <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-6">{Array.from({ length: 12 }, (_, i) => <div key={i} className="shimmer mx-auto h-28 w-28 rounded-full" />)}</div>;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  if ((q.data?.results.length ?? 0) === 0) return <NoResults query={query} />;
  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-6">
        {q.data!.results.map((p, i) => (
          <PersonCard key={p.id} id={p.id} name={p.name} image={p.image} caption={p.knownFor.slice(0, 2).join(", ")} secondary={p.knownForDepartment} index={i} />
        ))}
      </div>
      {(q.data?.totalPages ?? 1) > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border border-white/15 px-4 py-2 disabled:opacity-40">
            Previous
          </button>
          <span className="tabular-nums text-muted-foreground">
            {page} / {q.data!.totalPages}
          </span>
          <button type="button" disabled={page >= q.data!.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-full border border-white/15 px-4 py-2 disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </>
  );
}
