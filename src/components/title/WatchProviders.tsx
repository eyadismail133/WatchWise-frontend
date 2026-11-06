import { motion } from "motion/react";
import { ExternalLink, MonitorPlay } from "lucide-react";
import type { RichTitle } from "../../lib/types";
import { cappedDelay, ease } from "../../lib/motion";

type Providers = NonNullable<RichTitle["watchProviders"]>;

const GROUPS: { key: keyof Pick<Providers, "stream" | "free" | "rent" | "buy">; label: string }[] = [
  { key: "stream", label: "Stream" },
  { key: "free", label: "Free" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
];

/** "Where to watch" logos grouped by offer type (data by JustWatch via TMDB). */
export function WatchProviders({ providers, compact = false }: { providers: Providers | null | undefined; compact?: boolean }) {
  if (!providers) {
    return compact ? null : (
      <p className="text-sm text-muted-foreground">No streaming information for your region yet.</p>
    );
  }

  const groups = GROUPS.map((g) => ({ ...g, items: providers[g.key] ?? [] })).filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;

  let n = 0;
  return (
    <div className={compact ? "flex flex-wrap items-center gap-x-5 gap-y-3" : "space-y-4"}>
      {compact && (
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/60">
          <MonitorPlay className="h-4 w-4 text-[#d4a843]" aria-hidden="true" /> Where to watch
        </span>
      )}
      {groups.map((g) => (
        <div key={g.key} className={compact ? "flex items-center gap-2" : ""}>
          <div className={`text-[11px] uppercase tracking-widest text-muted-foreground ${compact ? "" : "mb-2"}`}>
            {g.label}
          </div>
          <div className="flex flex-wrap gap-2">
            {g.items.slice(0, compact ? 4 : 12).map((p) => (
              <motion.a
                key={`${g.key}-${p.id}`}
                href={providers.link ?? undefined}
                target="_blank"
                rel="noreferrer"
                title={`${g.label} on ${p.name}`}
                aria-label={`${g.label} on ${p.name}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -3, scale: 1.08 }}
                transition={{ duration: 0.4, ease: ease.out, delay: cappedDelay(n++, 0.03) }}
                className={`block overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg ${compact ? "h-9 w-9" : "h-12 w-12"}`}
              >
                {p.logo ? (
                  <img src={p.logo} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px]">{p.name}</span>
                )}
              </motion.a>
            ))}
          </div>
        </div>
      ))}
      <p className={`text-[10px] text-muted-foreground ${compact ? "w-full" : ""}`}>
        Availability data by{" "}
        <a href="https://www.justwatch.com" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
          JustWatch
        </a>
      </p>
      {!compact && providers.link && (
        <a
          href={providers.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-[#e8c866]"
        >
          All options for {providers.region} on JustWatch <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
