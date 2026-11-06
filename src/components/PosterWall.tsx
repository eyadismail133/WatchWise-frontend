import { motion, useReducedMotion } from "motion/react";
import { trpc } from "../providers/trpcClient";

/**
 * Decorative, slowly drifting columns of trending posters used behind
 * sign-in and signed-out screens. Purely visual (aria-hidden).
 */
export function PosterWall({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const { data } = trpc.movie.trending.useQuery({ timeWindow: "week" }, { staleTime: 10 * 60_000 });
  const posters = (data?.results ?? []).map((t) => t.poster_path).filter((p): p is string => Boolean(p));

  if (posters.length < 6) {
    return <div aria-hidden="true" className={`absolute inset-0 bg-gradient-to-br from-[#14111d] to-background ${className}`} />;
  }

  const columns = Array.from({ length: 6 }, (_, c) =>
    Array.from({ length: 6 }, (_, r) => posters[(c * 5 + r * 3) % posters.length]!),
  );

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-[-10%] flex rotate-[-8deg] gap-4 opacity-40">
        {columns.map((col, c) => (
          <motion.div
            key={c}
            className={`flex flex-1 flex-col gap-4 ${c >= 3 ? "hidden md:flex" : ""}`}
            animate={reduce ? undefined : { y: c % 2 ? ["-50%", "0%"] : ["0%", "-50%"] }}
            transition={{ duration: 60 + c * 9, repeat: Infinity, ease: "linear" }}
          >
            {[...col, ...col].map((src, i) => (
              <img key={i} src={src} alt="" loading="lazy" className="aspect-[2/3] w-full rounded-xl object-cover" />
            ))}
          </motion.div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_75%)]" />
    </div>
  );
}
