import { useMemo, useState } from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import { Link, useNavigate, useParams } from "react-router";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import {
  Cake,
  ChevronLeft,
  Clapperboard,
  ExternalLink,
  Film,
  Images,
  MapPin,
  Sparkles,
  Star,
  Tv,
  User,
  ListOrdered,
} from "lucide-react";
import { trpc } from "../providers/trpcClient";
import { MovieCard, type TitleData } from "../components/MovieCard";
import { RowItem, ScrollRow, SectionHeader, ErrorState } from "../components/ScrollRow";
import { SegmentedControl } from "../components/motion/SegmentedControl";
import { AnimatedNumber } from "../components/motion/AnimatedNumber";
import { Reveal } from "../components/motion/Reveal";
import { Lightbox } from "../components/Lightbox";
import { ageFrom, formatDate, type CreditItem } from "../lib/types";
import { cappedDelay, ease, spring } from "../lib/motion";

function creditToTitle(c: CreditItem): TitleData {
  return {
    id: c.id,
    title: c.title,
    type: c.mediaType === "tv" ? "series" : "movie",
    description: "",
    genres: [],
    moods: [],
    rating: c.rating,
    popularity_score: c.popularity,
    hidden_gem_score: 0,
    poster_path: c.poster,
    backdrop_path: c.backdrop,
    releaseDate: c.releaseDate,
    mediaType: c.mediaType,
    voteCount: c.voteCount,
  };
}

type Dept = "cast" | "crew";
type MediaFilter = "all" | "movie" | "tv";
type SortMode = "newest" | "popular" | "rating";

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const personId = parseInt(id || "0", 10);
  const navigate = useNavigate();

  const person = trpc.movie.person.useQuery({ id: personId }, { enabled: personId > 0 });

  const [bioOpen, setBioOpen] = useState(false);
  const [dept, setDept] = useState<Dept | null>(null);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 700], ["0%", "30%"]);

  const data = person.data;
  usePageMeta(
    data?.name,
    data ? `${data.name}${data.knownForDepartment ? ` (${data.knownForDepartment})` : ""}: biography, filmography and photos.` : undefined,
  );
  const activeDept: Dept = dept ?? (data && data.knownForDepartment !== "Acting" && data.crew.length > data.cast.length ? "crew" : "cast");

  const credits = useMemo(() => {
    if (!data) return [];
    const list = (activeDept === "cast" ? data.cast : data.crew).filter(
      (c) => mediaFilter === "all" || c.mediaType === mediaFilter,
    );
    const sorted = [...list];
    if (sort === "popular") sorted.sort((a, b) => b.voteCount - a.voteCount);
    else if (sort === "rating") sorted.sort((a, b) => (b.voteCount >= 50 ? b.rating : 0) - (a.voteCount >= 50 ? a.rating : 0));
    return sorted;
  }, [data, activeDept, mediaFilter, sort]);

  if (person.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-8" aria-busy="true">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="shimmer mx-auto h-72 w-56 rounded-3xl md:mx-0" />
          <div className="flex-1 space-y-4">
            <div className="shimmer h-10 w-2/3 rounded-lg" />
            <div className="shimmer h-4 w-1/3 rounded" />
            <div className="shimmer h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <ErrorState
          message={person.isError ? "We couldn't load this person." : "Person not found."}
          onRetry={person.isError ? () => person.refetch() : undefined}
        />
      </div>
    );
  }

  const age = ageFrom(data.birthday, data.deathday);
  const heroBackdrop = data.knownFor.find((k) => k.backdrop)?.backdrop ?? null;
  const bio = data.biography.trim();
  const bioLong = bio.length > 600;
  const visibleCredits = showAll ? credits : credits.slice(0, 40);

  // Group the filmography timeline by year.
  const grouped: { year: string; items: CreditItem[] }[] = [];
  if (sort === "newest") {
    for (const c of visibleCredits) {
      const year = c.year ? String(c.year) : "Upcoming / TBA";
      const last = grouped.at(-1);
      if (last && last.year === year) last.items.push(c);
      else grouped.push({ year, items: [c] });
    }
  }

  const links = [
    data.externalIds.imdb ? { label: "IMDb", href: `https://www.imdb.com/name/${data.externalIds.imdb}` } : null,
    data.externalIds.instagram ? { label: "Instagram", href: `https://instagram.com/${data.externalIds.instagram}` } : null,
    data.externalIds.twitter ? { label: "X / Twitter", href: `https://x.com/${data.externalIds.twitter}` } : null,
    data.externalIds.tiktok ? { label: "TikTok", href: `https://www.tiktok.com/@${data.externalIds.tiktok}` } : null,
    data.homepage ? { label: "Website", href: data.homepage } : null,
    { label: "TMDB", href: `https://www.themoviedb.org/person/${data.id}` },
  ].filter((l): l is { label: string; href: string } => l !== null);

  const stats = [
    { label: "Credits", value: data.stats.totalCredits, icon: ListOrdered },
    { label: "Movies", value: data.stats.movies, icon: Film },
    { label: "TV shows", value: data.stats.shows, icon: Tv },
    ...(data.stats.averageRating ? [{ label: "Avg. rating", value: data.stats.averageRating, icon: Star, decimals: 1 }] : []),
  ];

  const renderCreditRow = (c: CreditItem, i: number) => (
    <motion.li
      key={`${c.mediaType}-${c.id}-${c.role}`}
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease: ease.out, delay: cappedDelay(i, 0.02, 15) }}
    >
      <Link
        to={`/title/${c.mediaType}/${c.id}`}
        className="group flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-white/[0.04]"
      >
        <div className="h-16 w-11 flex-shrink-0 overflow-hidden rounded-md bg-muted">
          {c.poster ? (
            <img src={c.poster} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <Film className="m-auto mt-5 h-5 w-5 text-muted-foreground/40" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium group-hover:text-[#e8c866]">{c.title}</div>
          <div className="truncate text-sm text-muted-foreground">
            {c.role ? (activeDept === "cast" ? `as ${c.role}` : c.role) : activeDept === "cast" ? "Cast" : "Crew"}
            {c.episodeCount ? ` · ${c.episodeCount} ep` : ""}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3 text-xs text-muted-foreground">
          {c.mediaType === "tv" ? <Tv className="h-3.5 w-3.5" aria-label="TV" /> : <Film className="h-3.5 w-3.5" aria-label="Movie" />}
          {c.rating > 0 && c.voteCount > 10 && (
            <span className="flex w-10 items-center gap-0.5 text-[#e8c866]">
              <Star className="h-3 w-3 fill-current" aria-hidden="true" /> {c.rating.toFixed(1)}
            </span>
          )}
          {sort !== "newest" && <span className="w-10 text-right tabular-nums">{c.year ?? "—"}</span>}
        </div>
      </Link>
    </motion.li>
  );

  return (
    <div className="min-h-screen">
      {/* ================= HERO ================= */}
      <section className="relative -mt-16 overflow-hidden pt-16">
        <motion.div style={{ y: bgY }} className="pointer-events-none absolute inset-0">
          {heroBackdrop && (
            <motion.img
              src={heroBackdrop}
              alt=""
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.35, scale: 1 }}
              transition={{ duration: 1.6, ease: ease.cinematic }}
              className="h-full w-full object-cover blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </motion.div>

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-6 md:px-8">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            className="group mb-8 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3.5 py-1.5 text-sm font-medium text-white/90 hover:bg-black/60"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" /> Back
          </button>

          <div className="flex flex-col items-center gap-8 md:flex-row md:items-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ ...spring.soft, delay: 0.1 }}
              className="relative w-52 flex-shrink-0 rounded-[2rem] bg-gradient-to-br from-[#d4a843] via-[#8a6fbf] to-[#e86a5c] p-[3px] shadow-[0_30px_80px_-20px_rgba(212,168,67,0.45)] md:w-64"
            >
              <div className="overflow-hidden rounded-[calc(2rem-3px)] bg-card">
                {data.imageHd ? (
                  <img src={data.imageHd} alt={data.name} className="aspect-[2/3] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[2/3] items-center justify-center">
                    <User className="h-16 w-16 text-muted-foreground/40" aria-hidden="true" />
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
              className="min-w-0 flex-1 text-center md:text-left"
            >
              <motion.p
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#e8c866]"
              >
                {data.knownForDepartment ?? "Artist"}
              </motion.p>
              <motion.h1
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: ease.out } } }}
                className="font-display text-4xl font-bold leading-tight text-balance md:text-6xl"
              >
                {data.name}
              </motion.h1>
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground md:justify-start"
              >
                {data.birthday && (
                  <span className="flex items-center gap-1.5">
                    <Cake className="h-4 w-4 text-[#d4a843]" aria-hidden="true" />
                    {formatDate(data.birthday)}
                    {age !== null && !data.deathday && ` (age ${age})`}
                  </span>
                )}
                {data.deathday && (
                  <span>
                    Died {formatDate(data.deathday)}
                    {age !== null && ` (aged ${age})`}
                  </span>
                )}
                {data.placeOfBirth && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#d4a843]" aria-hidden="true" />
                    {data.placeOfBirth}
                  </span>
                )}
                {data.stats.firstYear && (
                  <span>
                    Active {data.stats.firstYear}–{data.stats.latestYear ?? "now"}
                  </span>
                )}
              </motion.div>

              <motion.dl
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
              >
                {stats.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/[0.07] bg-card/60 px-4 py-3 text-left">
                    <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                      <s.icon className="h-3.5 w-3.5" aria-hidden="true" /> {s.label}
                    </dt>
                    <dd className="mt-1 font-display text-2xl font-bold text-foreground">
                      <AnimatedNumber value={s.value} decimals={"decimals" in s ? s.decimals : 0} />
                    </dd>
                  </div>
                ))}
              </motion.dl>

              <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                {links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[#d4a843]/40 hover:text-[#e8c866]"
                  >
                    {l.label} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 pb-10 md:px-8">
        {/* Biography */}
        <Reveal>
          <h2 className="mb-3 font-display text-xl font-bold">Biography</h2>
          {bio ? (
            <>
              <motion.div
                className="relative overflow-hidden"
                initial={false}
                animate={{ height: bioOpen || !bioLong ? "auto" : 168 }}
                transition={{ duration: 0.5, ease: ease.out }}
              >
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{bio}</p>
                {bioLong && !bioOpen && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
                )}
              </motion.div>
              {bioLong && (
                <button
                  type="button"
                  aria-expanded={bioOpen}
                  onClick={() => setBioOpen((o) => !o)}
                  className="mt-2 text-sm font-medium text-[#d4a843] hover:text-[#e8c866]"
                >
                  {bioOpen ? "Show less" : "Read more"}
                </button>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">We don&apos;t have a biography for {data.name} yet.</p>
          )}
          {data.alsoKnownAs.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Also known as: <span className="text-foreground/70">{data.alsoKnownAs.join(" · ")}</span>
            </p>
          )}
        </Reveal>

        {data.knownFor.length > 0 && (
          <ScrollRow title="Known for" icon={Sparkles}>
            {data.knownFor.map((c, i) => (
              <RowItem key={`${c.mediaType}-${c.id}`}>
                <MovieCard title={creditToTitle(c)} index={i} subtitle={c.role ?? undefined} />
              </RowItem>
            ))}
          </ScrollRow>
        )}

        {/* Filmography */}
        <section aria-labelledby="filmography-heading">
          <SectionHeader
            id="filmography-heading"
            title="Filmography"
            icon={Clapperboard}
            subtitle={`${credits.length} ${activeDept === "cast" ? "acting" : "crew"} credits`}
          />
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <SegmentedControl
              id="dept"
              label="Department"
              value={activeDept}
              onChange={(v) => {
                setDept(v);
                setShowAll(false);
              }}
              options={[
                { value: "cast", label: "Acting", count: data.cast.length },
                { value: "crew", label: "Crew", count: data.crew.length },
              ]}
            />
            <SegmentedControl
              id="media"
              label="Media type"
              size="sm"
              value={mediaFilter}
              onChange={setMediaFilter}
              options={[
                { value: "all", label: "All" },
                { value: "movie", label: "Movies", icon: Film },
                { value: "tv", label: "TV", icon: Tv },
              ]}
            />
            <SegmentedControl
              id="sort"
              label="Sort credits"
              size="sm"
              value={sort}
              onChange={setSort}
              options={[
                { value: "newest", label: "Timeline" },
                { value: "popular", label: "Popular" },
                { value: "rating", label: "Top rated" },
              ]}
            />
          </div>

          {credits.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No credits match these filters.</p>
          ) : sort === "newest" ? (
            <div className="relative space-y-6 border-l border-white/10 pl-6">
              <AnimatePresence mode="popLayout" initial={false}>
                {grouped.map((g) => (
                  <motion.div key={`${activeDept}-${mediaFilter}-${g.year}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="relative mb-2">
                      <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-[#d4a843] shadow-[0_0_12px_rgba(212,168,67,0.8)]" />
                      <h3 className="font-display text-lg font-bold text-[#e8c866]">{g.year}</h3>
                    </div>
                    <ul className="space-y-1">{g.items.map((c, i) => renderCreditRow(c, i))}</ul>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.ul layout className="space-y-1">
              <AnimatePresence mode="popLayout" initial={false}>
                {visibleCredits.map((c, i) => renderCreditRow(c, i))}
              </AnimatePresence>
            </motion.ul>
          )}

          {credits.length > 40 && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium hover:border-[#d4a843]/50 hover:text-[#e8c866]"
              >
                {showAll ? "Show fewer" : `Show all ${credits.length} credits`}
              </button>
            </div>
          )}
        </section>

        {data.photos.length > 1 && (
          <section aria-labelledby="person-photos">
            <SectionHeader id="person-photos" title="Photos" icon={Images} accent="#10b981" subtitle={`${data.photos.length} portraits`} />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {data.photos.slice(0, 12).map((p, i) => (
                <motion.button
                  key={p.url}
                  type="button"
                  onClick={() => setLightbox(i)}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.45, ease: ease.out, delay: cappedDelay(i, 0.04) }}
                  className="group overflow-hidden rounded-xl border border-white/[0.06]"
                  aria-label={`Open photo ${i + 1} of ${data.name}`}
                >
                  <img src={p.thumb} alt="" loading="lazy" className="aspect-[2/3] w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </motion.button>
              ))}
            </div>
            <Lightbox images={data.photos} index={lightbox} onClose={() => setLightbox(null)} label={`${data.name} photos`} />
          </section>
        )}
      </div>
    </div>
  );
}
