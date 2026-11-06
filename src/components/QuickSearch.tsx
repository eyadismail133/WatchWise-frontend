import { useState } from "react";
import { useNavigate } from "react-router";
import { Command } from "cmdk";
import { motion } from "motion/react";
import { Film, Search, Star, Tv, User, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { trpc } from "../providers/trpcClient";
import { useDebounce } from "../hooks/useDebounce";
import { cappedDelay, ease } from "../lib/motion";

interface QuickSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** ⌘K command palette: instant titles + people search from anywhere. */
export function QuickSearch({ open, onOpenChange }: QuickSearchProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12%] translate-y-0 overflow-hidden border-white/10 bg-[#0d0c14]/95 p-0 backdrop-blur-xl sm:max-w-2xl">
        <DialogTitle className="sr-only">Search WatchWise</DialogTitle>
        <DialogDescription className="sr-only">
          Search movies, TV shows and people. Use arrow keys to move and Enter to open.
        </DialogDescription>
        {open && <QuickSearchBody onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function QuickSearchBody({ onDone }: { onDone: () => void }) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query.trim(), 250);
  const navigate = useNavigate();

  const search = trpc.movie.searchAll.useQuery(
    { query: debounced },
    { enabled: debounced.length >= 2, staleTime: 60_000 },
  );

  const go = (path: string) => {
    onDone();
    navigate(path);
  };

  const titles = search.data?.titles.slice(0, 7) ?? [];
  const people = search.data?.people.slice(0, 5) ?? [];

  // Keep the highlight on the best match when async results arrive.
  const firstValue = titles[0]
    ? `title-${titles[0].mediaType}-${titles[0].id}`
    : people[0]
      ? `person-${people[0].id}`
      : "all-results";
  const [selected, setSelected] = useState(firstValue);
  const [lastFirst, setLastFirst] = useState(firstValue);
  if (firstValue !== lastFirst) {
    setLastFirst(firstValue);
    setSelected(firstValue);
  }

  return (
    <Command
      shouldFilter={false}
      loop
      value={selected}
      onValueChange={setSelected}
      className="flex max-h-[70vh] flex-col"
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4">
        <Search className="h-5 w-5 text-[#d4a843]" aria-hidden="true" />
        <Command.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Search movies, shows, actors, directors…"
          className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground focus-visible:outline-none"
        />
        {search.isFetching && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" aria-hidden="true" />
        )}
      </div>

      <Command.List className="scrollbar-hide overflow-y-auto p-2">
        {debounced.length < 2 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            Type at least two characters. Try <span className="text-[#e8c866]">“Nolan”</span> or{" "}
            <span className="text-[#e8c866]">“Severance”</span>.
          </div>
        ) : (
          <>
            {!search.isFetching && titles.length === 0 && people.length === 0 && (
              <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                No matches for “{debounced}”.
              </Command.Empty>
            )}

            {titles.length > 0 && (
              <Command.Group
                heading="Titles"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {titles.map((t, i) => (
                  <Command.Item
                    key={`${t.mediaType}-${t.id}`}
                    value={`title-${t.mediaType}-${t.id}`}
                    onSelect={() => go(`/title/${t.mediaType === "tv" ? "tv" : "movie"}/${t.id}`)}
                    className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 data-[selected=true]:bg-white/[0.06]"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, ease: ease.out, delay: cappedDelay(i, 0.03) }}
                      className="flex w-full items-center gap-3"
                    >
                      <div className="h-14 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {t.poster_path ? (
                          <img src={t.poster_path} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <Film className="m-auto mt-4 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium group-data-[selected=true]:text-[#e8c866]">
                          {t.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {t.mediaType === "tv" ? (
                            <Tv className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <Film className="h-3 w-3" aria-hidden="true" />
                          )}
                          {t.releaseDate?.slice(0, 4) || "TBA"}
                          {t.rating > 0 && (
                            <span className="flex items-center gap-0.5 text-[#e8c866]">
                              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                              {t.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100" aria-hidden="true" />
                    </motion.div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {people.length > 0 && (
              <Command.Group
                heading="People"
                className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {people.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`person-${p.id}`}
                    onSelect={() => go(`/person/${p.id}`)}
                    className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 data-[selected=true]:bg-white/[0.06]"
                  >
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                      {p.image ? (
                        <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <User className="m-auto mt-2.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium group-data-[selected=true]:text-[#e8c866]">{p.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[p.knownForDepartment, p.knownFor.join(", ")].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Item
              value="all-results"
              onSelect={() => go(`/search?q=${encodeURIComponent(debounced)}`)}
              className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm text-[#d4a843] data-[selected=true]:bg-[#d4a843]/10"
            >
              See all results for “{debounced}” <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Command.Item>
          </>
        )}
      </Command.List>

      <div className="hidden items-center gap-4 border-t border-white/10 px-4 py-2 text-[11px] text-muted-foreground sm:flex">
        <span><kbd className="rounded bg-white/10 px-1.5 py-0.5">↑↓</kbd> navigate</span>
        <span><kbd className="rounded bg-white/10 px-1.5 py-0.5">Enter</kbd> open</span>
        <span><kbd className="rounded bg-white/10 px-1.5 py-0.5">Esc</kbd> close</span>
      </div>
    </Command>
  );
}
