# Frontend development criteria

These are requirements for future work, not claims that the current app already
meets them. Read [README.md](README.md) for setup/baseline and
[AGENTS.md](AGENTS.md) for implementation and review responsibilities.

## Task preparation

State the user problem, expected result, affected routes/components, exclusions,
API dependencies, acceptance scenarios, actual commands, and baseline failures.
Inspect the existing flow first. Preserve the current stack/design unless the
task calls for change. Keep each diff small and independently reviewable.

## Required criteria

| Area | Acceptance criterion |
| --- | --- |
| Routing | Links and direct route loads work, including title/profile URLs; preserve SPA fallback behavior. |
| API | Match backend procedure inputs/outputs/errors; preserve SuperJSON, cookie credentials, and central URL resolution. Verify affected flows with the backend. |
| Types | Use the generated AppRouter declaration and inferred domain types; no unexplained `any`, unsafe casts, or suppressed handwritten-code checks. Regenerate/check the snapshot when backend types change. |
| Identity | Keep `tmdbId` paired with API `mediaType` (`movie`/`tv`); internal title IDs and display `series` are different. |
| Queries | Cover loading, empty, error/retry, and success states; avoid request loops and update/invalidate caches after mutations. |
| Mutations | Disable accidental repeat actions while pending, display failures, and restore a consistent view after success or rollback. |
| Auth/privacy | Provide signed-out states; refresh session-dependent views after sign-in/out. Prevent private data remaining in stale caches; server enforcement is required. |
| Appearance | Reuse UI primitives/tokens and existing dark theme, gold/purple accents, spacing, and mobile navigation. |
| Accessibility | Label inputs/icon-only controls, preserve keyboard/focus/dialog behavior, use meaningful alt text, and check 375px, 768px, and 1440px layouts without unintended overflow. |
| Services/secrets | No secret keys in source or `VITE_*`. Handle upload/provider failures; mock network services in automated tests. |
| Dependencies | New packages need a concrete reason and matching `package-lock.json` changes. |

## Verification

After `npm ci`, run:

```powershell
npm run build
npm run check:bundle
npm run lint
npm exec -- vitest run
npm run typecheck:contract
git diff --check
```

`build` runs TypeScript (`tsc -b`) and bundles production assets. Vitest covers API
URL resolution, mounted mobile behavior, and profile interaction regressions;
there is no `npm test` script. Exact current counts belong in the README record.
`npm run typecheck:contract` (`tsc -p tsconfig.contract.json --noEmit`) strictly validates
contract declaration integrity under `skipLibCheck: false` with positive and `@ts-expect-error` assertions.

For affected UI/auth/API work, manually check applicable flows: anonymous browse
and search; sign-up/sign-in/sign-out and refresh; movie/TV details; watchlist and
favorites; username/profile editing; public/private views; follows/feed; comments
and replies; AI/taste success and service failure. Use development accounts and an
isolated database. Report precisely what ran and what credentials/infrastructure
blocked testing.

Relevant gates must pass. For pre-existing failures, record the baseline and prove
no new failures; never disable checks to hide them. Documentation-only edits need
link/path/command review and `git diff --check`, not new runtime tests. Performance
work needs repeatable before/after measurements, not invented targets.

## Progress and active backlog

1. [Completed 2026-10-15] Resolved all 33 baseline ESLint errors and 1 warning without
   weakening checks or blanket suppressions.
2. [Completed 2026-10-15] Replaced `src/providers/trpcClient.ts`'s `createTRPCReact<any>() as any`
   with `createTRPCReact<AppRouter>()` backed by `src/contracts/app-router.d.ts` declaration
   snapshot derived from backend `src/router.ts` compiler closure, preserving independent builds.
3. Add further behavior coverage for sessions, mutations, privacy, pending/error states,
   and direct route loads, then establish an explicit test script and CI in a
   scoped implementation task.
4. Preserve on-demand secondary routes and measure `npm run check:bundle` after
   production builds. Report every chunk and initial static imports honestly;
   keep the default 500 kB threshold and prevent TitleDetail becoming eager.

## Definition of done

Report resulting behavior, affected files/backend dependencies, actual commands
and results, responsive/accessibility checks, review verdict, and limitations.
Every code/configuration/user-visible changeset updates README and a relevant
workflow document in the same change; unchanged process semantics still require
a workflow verification/change record. Coding changes require independent
GPT-6.1 Sol (`gpt-6.1-sol`) `APPROVED` review before Codex lands them. Approval
does not authorize pushing or deployment.

## Workflow change record: 2026-10-15

The local setup uses ignored env files and the user-selected shared Neon database;
Cloudinary is deferred. Local URLs do not isolate production data. No migrations,
backfills, sign-in writes, or application mutation tests may run against it.
Authenticated editor regressions use mocked session/API boundaries.

API declarations are checked independently of runtime tests with
`npm run typecheck:contract`. Snapshot synchronization runs in the backend;
normal frontend installation/build remains independent. The generated-file lint
exception is limited to that exact declaration; handwritten checks stay enabled.

Profile review acceptance includes dirty edits across refetch/error states,
false privacy, deliberately empty featured selections, movie/TV identity and
five-title limits, account switches with stale caches, and valid saved-profile
redirects.

Before the bundle/artwork changes on 2026-10-16, Codex verified a clean locked install, zero-error/zero-warning lint,
11 runtime tests across three files, production build, strict contract typecheck,
aligned tRPC dependencies, zero backend contract drift, and whitespace checks.
That build retained its bundle-size warning. Independent GPT-6.1 Sol whole-diff
review returned **APPROVED** on 2026-10-16, including clean-code/test-guard checks.
Manual signed-in/provider mutation checks remain excluded on the shared database.

## Bundle/artwork workflow update: 2026-10-16

Route changes must preserve the shell while an async page loads and retain all
existing paths, including legacy title links. Validate the emitted manifest and
assets, then smoke-test production deep links. Artwork changes preserve the old
backdrop-behind-title presentation with responsive dimensions and content-driven
height. Check movie/TV at 375, 768 and 1440 pixels before committing, including
readable controls and no horizontal overflow. Final measurements and gate counts
are recorded in README; earlier cleanup evidence remains historical.

Codex delivery verification on 2026-10-16 passed lint (0/0), build without the
500 kB warning, 20 tests in five files, strict contract checking and bundle
validation. Initial static JavaScript fell from 759,405 to 663,783 bytes; eight
invalid bundle variants were rejected in read-only in-memory probes. Production
movie/TV direct links passed visual checks at 375/768/1440, including readable
hero controls and tablet navigation without overlap. No account writes were
used. Preserve these checks for later changes and update this record with README.
