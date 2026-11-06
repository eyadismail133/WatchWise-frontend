import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Building2, ExternalLink, Film, Hash, MapPin, Tv } from "lucide-react";
import { trpc } from "../providers/trpcClient";
import { MovieCard, type TitleData } from "../components/MovieCard";
import { ErrorState, SkeletonCard } from "../components/ScrollRow";
import { SegmentedControl } from "../components/motion/SegmentedControl";
import { usePageMeta } from "../hooks/usePageMeta";
import { ease } from "../lib/motion";

type Kind = "keyword" | "company" | "network";
type Sort = "popularity" | "rating" | "newest" | "votes";
const grid = "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

const KIND_LABEL: Record<Kind, string> = { keyword: "Keyword", company: "Studio", network: "Network" };

/** Titles that share a keyword, a production company or a TV network. */
export default function Browse() {
  const { kind: kindParam, id } = useParams<{ kind: string; id: string }>();
  const [params, setParams] = useSearchParams();
  const kind: Kind = kindParam === "company" || kindParam === "network" ? kindParam : "keyword";
  const browseId = parseInt(id || "0", 10);
  const mediaType = kind === "network" ? "tv" : params.get("type") === "tv" ? "tv" : "movie";
  const [sort, setSort] = useState<Sort>("popularity");
  const [pages, setPages] = useState(1);

  const first = trpc.movie.browse.useQuery(
    { kind, id: browseId, mediaType, sort, page: 1 },
    { enabled: browseId > 0 },
  );

  usePageMeta(
    first.data ? `${first.data.name} — ${KIND_LABEL[kind]}` : KIND_LABEL[kind],
    first.data
      ? `Browse ${first.data.totalResults.toLocaleString()} ${mediaType === "tv" ? "shows" : "movies"} linked to ${first.data.name} on WatchWise.`
      : undefined,
  );

  const Icon = kind === "keyword" ? Hash : kind === "network" ? Tv : Building2;

  return (
    <div className="min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: ease.out }}
          className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div className="flex items-center gap-5">
            {first.data?.logo ? (
              <div className="flex h-20 w-32 items-center justify-center rounded-2xl bg-white/90 p-3">
                <img src={first.data.logo} alt={first.data.name} className="max-h-14 max-w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d4a843]/10">
                <Icon className="h-8 w-8 text-[#d4a843]" aria-hidden="true" />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#e8c866]">{KIND_LABEL[kind]}</p>
              <h1 className="font-display text-3xl font-bold capitalize md:text-4xl">
                {first.data?.name ?? (first.isLoading ? "Loading…" : "Not found")}
              </h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {first.data && (
                  <span>
                    {first.data.totalResults.toLocaleString()} {mediaType === "tv" ? "shows" : "movies"}
                  </span>
                )}
                {first.data?.headquarters && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {first.data.headquarters}
                  </span>
                )}
                {first.data?.homepage && (
                  <a href={first.data.homepage} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#e8c866]">
                    Website <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {kind !== "network" && (
              <SegmentedControl
                id="browse-media"
                label="Media type"
                size="sm"
                value={mediaType}
                onChange={(v) => {
                  setPages(1);
                  setParams(v === "tv" ? { type: "tv" } : {}, { replace: true });
                }}
                options={[
                  { value: "movie", label: "Movies", icon: Film },
                  { value: "tv", label: "TV", icon: Tv },
                ]}
              />
            )}
            <SegmentedControl
              id="browse-sort"
              label="Sort"
              size="sm"
              value={sort}
              onChange={(v) => {
                setPages(1);
                setSort(v);
              }}
              options={[
                { value: "popularity", label: "Popular" },
                { value: "rating", label: "Top rated" },
                { value: "newest", label: "Newest" },
              ]}
            />
          </div>
        </motion.header>

        {first.isError ? (
          <ErrorState onRetry={() => first.refetch()} />
        ) : first.isLoading ? (
          <div className={grid}>{Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} />)}</div>
        ) : (first.data?.totalResults ?? 0) === 0 ? (
          <p className="py-20 text-center text-muted-foreground">
            Nothing here yet. <Link to="/discover" className="text-[#d4a843]">Explore Discover →</Link>
          </p>
        ) : (
          <>
            <div className={grid}>
              {Array.from({ length: pages }, (_, i) => (
                <BrowsePage key={`${mediaType}-${sort}-${i}`} kind={kind} id={browseId} mediaType={mediaType} sort={sort} page={i + 1} />
              ))}
            </div>
            {pages < (first.data?.totalPages ?? 1) && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setPages((p) => p + 1)}
                  className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium hover:border-[#d4a843]/50 hover:text-[#e8c866]"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BrowsePage(props: { kind: Kind; id: number; mediaType: "movie" | "tv"; sort: Sort; page: number }) {
  const q = trpc.movie.browse.useQuery(props, { staleTime: 10 * 60_000 });
  if (q.isLoading) return <>{Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} />)}</>;
  return (
    <>
      {((q.data?.results ?? []) as TitleData[]).map((t, i) => (
        <MovieCard key={`${t.mediaType}-${t.id}`} title={t} index={i} />
      ))}
    </>
  );
}
