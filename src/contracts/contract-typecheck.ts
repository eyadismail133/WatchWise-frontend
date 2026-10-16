/**
 * Compile-time typecheck fixture for AppRouter contract integrity.
 * Verified via `tsc -p tsconfig.contract.json --noEmit --skipLibCheck false`.
 * Uses compile-positive type assignments and compile-negative `@ts-expect-error` directives.
 */
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "./app-router";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

// ============================================================================
// 1. COMPILE-POSITIVE CONTRACT ASSERTIONS
// ============================================================================

// A. Watchlist procedures require numeric `id: number` inputs
type WatchlistUpdateInput = RouterInputs["watchlist"]["update"];
type WatchlistRemoveInput = RouterInputs["watchlist"]["remove"];

const _posWatchlistUpdate: WatchlistUpdateInput = { id: 42, status: "watched" };
const _posWatchlistRemove: WatchlistRemoveInput = { id: 42 };

// B. Discovery and pagination procedures return camelCase totalPages and totalResults
type DiscoverMovieOutput = RouterOutputs["movie"]["discoverMovie"];
const _posDiscoverTotalPages: number = ({} as DiscoverMovieOutput).totalPages;
const _posDiscoverTotalResults: number = ({} as DiscoverMovieOutput).totalResults;

// C. SuperJSON preservation ensures timestamp fields are Date instances, not strings
type SingleComment = RouterOutputs["comment"]["list"][number];
type CommentCreatedAt = SingleComment["createdAt"];
type CommentUpdatedAt = SingleComment["updatedAt"];
const _posCommentCreatedAt: Date = {} as CommentCreatedAt;
const _posCommentUpdatedAt: Date = {} as CommentUpdatedAt;

void _posWatchlistUpdate;
void _posWatchlistRemove;
void _posDiscoverTotalPages;
void _posDiscoverTotalResults;
void _posCommentCreatedAt;
void _posCommentUpdatedAt;

// ============================================================================
// 2. COMPILE-NEGATIVE CONTRACT ASSERTIONS (@ts-expect-error)
// ============================================================================

// A. Watchlist update rejects fabricated `tmdbId` input without numeric `id`
// @ts-expect-error Watchlist update requires numeric id, not tmdbId
const _negWatchlistTmdbId: WatchlistUpdateInput = { tmdbId: 101, status: "watched" };
void _negWatchlistTmdbId;

// B. Watchlist remove rejects object lacking numeric `id`
// @ts-expect-error Watchlist remove requires numeric id
const _negWatchlistRemoveMissingId: WatchlistRemoveInput = { tmdbId: 101 };
void _negWatchlistRemoveMissingId;

// C. Discovery pagination rejects snake_case `total_pages` / `total_results`
// @ts-expect-error DiscoverMovie output uses camelCase totalPages, not snake_case total_pages
const _negDiscoverSnakeCase: { total_pages: number } = {} as DiscoverMovieOutput;
void _negDiscoverSnakeCase;

// D. SuperJSON comment timestamps reject string assignments (must be Date)
// @ts-expect-error Comment createdAt is parsed as a Date object by SuperJSON, not string
const _negCommentStringDate: string = {} as CommentCreatedAt;
void _negCommentStringDate;

// E. Strictly rejects nonexistent procedures such as `recommendation`
// @ts-expect-error AppRouter does not define a 'recommendation' router
const _negNonexistentRouter: RouterInputs["recommendation"] = null;
void _negNonexistentRouter;
