import { trpc } from "../providers/trpcClient";
import { useAuth } from "./useAuth";

/**
 * Reads the signed-in user's watchlist status for one title from a single
 * shared, cached `watchlist.statusMap` query (one request for every card).
 */
export function useLibraryItem(tmdbId: number, mediaType: "movie" | "tv") {
  const { isAuthenticated } = useAuth();
  const query = trpc.watchlist.statusMap.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const item =
    query.data?.find((i) => i.tmdbId === tmdbId && i.mediaType === mediaType) ??
    null;

  return { item, isAuthenticated };
}

/** Invalidate every watchlist cache that can show a title's status. */
export function useInvalidateLibrary() {
  const utils = trpc.useUtils();
  return (ref?: { tmdbId: number; mediaType: "movie" | "tv" }) => {
    if (ref) void utils.watchlist.getByTitle.invalidate(ref);
    void utils.watchlist.statusMap.invalidate();
    void utils.watchlist.list.invalidate();
  };
}
