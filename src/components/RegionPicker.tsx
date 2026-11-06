import { Globe2 } from "lucide-react";
import { REGIONS, useRegion } from "../hooks/useRegion";

/** Compact country selector for streaming availability. */
export function RegionPicker({ className = "" }: { className?: string }) {
  const [region, setRegion] = useRegion();
  const known = REGIONS.some((r) => r.code === region);
  return (
    <label className={`relative inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
      <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">Streaming region</span>
      <select
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="appearance-none rounded-full border border-white/10 bg-white/[0.04] py-1 pl-2 pr-6 text-xs text-foreground outline-none hover:border-white/20 focus:border-[#d4a843]/50"
      >
        {!known && <option value={region}>{region}</option>}
        {REGIONS.map((r) => (
          <option key={r.code} value={r.code} className="bg-card">
            {r.name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 text-[10px]">▾</span>
    </label>
  );
}
