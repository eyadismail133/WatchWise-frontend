import { Link, useNavigate, useParams } from "react-router";
import { usePageMeta } from "../hooks/usePageMeta";
import { motion } from "motion/react";
import { ChevronLeft, Film, Layers, Star } from "lucide-react";
import { trpc } from "../providers/trpcClient";
import { MovieCard, type TitleData } from "../components/MovieCard";
import { ErrorState } from "../components/ScrollRow";
import { Reveal } from "../components/motion/Reveal";
import { cappedDelay, ease } from "../lib/motion";

/** A film saga (TMDB collection) shown as a chronological, animated timeline. */
export default function Collection() {
  const { id } = useParams<{ id: string }>();
  const collectionId = parseInt(id || "0", 10);
  const navigate = useNavigate();
  const query = trpc.movie.collection.useQuery({ id: collectionId }, { enabled: collectionId > 0 });
  const data = query.data;
  usePageMeta(data?.name, data?.overview || undefined);

  if (query.isLoading) {
    return (
      <div aria-busy="true">
        <div className="shimmer -mt-16 h-[55vh] min-h-[380px]" />
        <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-4 px-4 md:grid-cols-4 md:px-8">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="shimmer aspect-[2/3] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <ErrorState
          message={query.isError ? "We couldn't load this collection." : "Collection not found."}
          onRetry={query.isError ? () => query.refetch() : undefined}
        />
      </div>
    );
  }

  const parts = data.parts as TitleData[];
  const released = parts.filter((p) => p.releaseDate && new Date(p.releaseDate) <= new Date());
  const span =
    released.length > 0
      ? `${released[0]!.releaseDate!.slice(0, 4)}–${released.at(-1)!.releaseDate!.slice(0, 4)}`
      : null;

  return (
    <div className="min-h-screen">
      <section className="relative -mt-16 flex min-h-[460px] items-end overflow-hidden pt-16 md:min-h-[560px]">
        {data.backdrop && (
          <motion.img
            src={data.backdrop}
            alt=""
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, ease: ease.cinematic }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 md:px-8">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            className="group mb-10 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3.5 py-1.5 text-sm font-medium text-white/90 hover:bg-black/60"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" /> Back
          </button>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
            className="max-w-3xl"
          >
            <motion.p
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#e8c866]"
            >
              <Layers className="h-4 w-4" aria-hidden="true" /> Collection
            </motion.p>
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: ease.out } } }}
              className="font-display text-4xl font-bold leading-tight text-balance md:text-6xl"
            >
              {data.name}
            </motion.h1>
            <motion.div
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              className="mt-4 flex flex-wrap gap-4 text-sm text-white/80"
            >
              <span className="flex items-center gap-1.5">
                <Film className="h-4 w-4" aria-hidden="true" /> {parts.length} films
              </span>
              {span && <span>{span}</span>}
              {data.averageRating && (
                <span className="flex items-center gap-1 text-[#e8c866]">
                  <Star className="h-4 w-4 fill-current" aria-hidden="true" /> {data.averageRating} average
                </span>
              )}
            </motion.div>
            {data.overview && (
              <motion.p
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                className="mt-4 max-w-2xl leading-relaxed text-white/75"
              >
                {data.overview}
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <Reveal>
          <h2 className="mb-8 font-display text-2xl font-bold">In release order</h2>
        </Reveal>
        <ol className="relative grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {parts.map((p, i) => (
            <li key={p.id} className="relative">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: cappedDelay(i, 0.06), duration: 0.4 }}
                className="absolute -left-1 -top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-[#d4a843]/50 bg-background font-display text-sm font-bold text-[#e8c866] shadow-lg"
              >
                {i + 1}
              </motion.span>
              <MovieCard title={p} index={i} />
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <Link to="/discover" className="text-sm text-[#d4a843] hover:text-[#e8c866]">
            Discover more sagas →
          </Link>
        </div>
      </div>
    </div>
  );
}
