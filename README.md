# WatchWise frontend

React application for movie/TV discovery, watchlists, favorites, AI recommendations,
taste profiles, social profiles, follows, comments, and feeds.

- Repository: [WatchWise-frontend](https://github.com/eyadismail133/WatchWise-frontend).
- API: [WatchWise-backend](https://github.com/eyadismail133/WatchWise-backend).
- Contributor rules: [AGENTS.md](AGENTS.md), [instructions.md](instructions.md).

## Stack and layout

React 19, TypeScript, Vite 7, React Router 7, Tailwind CSS 3, Radix UI,
Framer Motion, TanStack React Query, tRPC 11, Better Auth, and Vitest.

| Path | Responsibility |
| --- | --- |
| `src/main.tsx`, `src/App.tsx` | Providers and routes |
| `src/pages/`, `src/components/` | Screens and domain components |
| `src/components/ui/` | UI primitives, variants, and contexts |
| `src/providers/` | tRPC/React Query, SuperJSON, cookie credentials |
| `src/contracts/` | Generated API declaration and compile-time checks |
| `src/lib/`, `src/hooks/` | API URL, auth, uploads, hooks |
| `lib/utils.ts` | Class-name utility outside `src/` |
| `src/index.css`, `tailwind.config.js` | Theme tokens and styling |
| `vercel.json`, `public/_redirects` | Hosting route fallback |

## Local setup

Use Node.js 24.x (checked on 24.16.0 with npm 11.13.0); the repository does not
pin a runtime version. Use the committed npm lockfile.

```powershell
git clone https://github.com/eyadismail133/WatchWise-frontend.git
cd WatchWise-frontend
npm ci
npm run dev
```

Start the configured backend separately at `http://localhost:3000` and open
`http://localhost:5173`. Use `localhost` consistently for origins/cookies. If Vite
selects another port, stop the other server or update backend `TRUSTED_ORIGINS`.
The frontend does not provision PostgreSQL or provider credentials.

For local development, leave both API origins unset or empty. Vite proxies `/api`
to port 3000, keeping browser requests on the frontend origin. The paired local
setup already has an ignored `.env` configured this way. Its API uses the supplied
shared Neon database; localhost does not isolate that database for mutation tests.
Cloudinary is deliberately unset at the user's request; avatar uploads are deferred.

### Environment

Optional values belong in ignored `.env`; `.env.example` contains public examples.
Every `VITE_*` value is public browser configuration. Never put database, auth,
TMDB, or Groq secrets here.

| Variable | Purpose |
| --- | --- |
| `VITE_BACKEND_URL` | Backend origin; takes precedence over the legacy variable |
| `VITE_API_URL` | Legacy backend origin fallback |
| `VITE_CLOUDINARY_CLOUD_NAME` | Public Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Public unsigned upload preset |

For a separately hosted API, use its origin without a trailing slash or `/api`
suffix. Resolution is `VITE_BACKEND_URL ?? VITE_API_URL ?? ""`; an empty
higher-priority value does not fall back. Align backend trusted origins/cookies
with the frontend host. Restart Vite after env changes; production values are
embedded at build time. Backend-only secrets belong in the backend environment.

## Commands and hosting

| Command | Effect |
| --- | --- |
| `npm ci` | Install locked dependencies |
| `npm run dev` | Start Vite with local `/api` proxy |
| `npm run build` | Run `tsc -b` and create `dist/` |
| `npm run check:bundle` | Inspect the completed production build, enforce the 500 kB JavaScript chunk budget, and report initial static imports |
| `npm run lint` | Run ESLint |
| `npm exec -- vitest run` | Run runtime tests once; no `npm test` script exists |
| `npm run typecheck:contract` | Check declarations/type fixtures with `skipLibCheck: false` |
| `npm run preview` | Preview `dist/` with the inherited local API proxy |

Preview normally uses `http://localhost:4173`; include it in backend trusted
origins for auth. Static hosting does not inherit Vite's proxy. Without an API
reverse proxy, build with an explicit backend origin. Vercel rewrites browser
paths to `index.html`, not `/api` to the backend; other hosts need an equivalent
SPA fallback. Deployment is a separate authorized action.

Home and the application shell load immediately. Secondary routes load on demand
inside the persistent shell with an accessible loading status. Production builds
emit a Vite manifest; run `npm run check:bundle` after `npm run build`. The check
includes shared static imports in the initial JavaScript total and verifies that
TitleDetail is deferred. Splitting a shared vendor chunk does not remove its
download cost. Keep Vite's default 500 kB warning threshold and measure the full
initial graph when comparing future changes.

## API contract synchronization

The typed client imports `AppRouter` from checked-in `src/contracts/app-router.d.ts`.
Normal frontend install/build needs neither a sibling backend checkout nor a
running API. The declaration contains no backend runtime code or credentials.

When backend procedures or inferred types change, run these in the backend:

```powershell
npm run contract:generate
npm run contract:check
```

The default destination is sibling `WatchWise-frontend/src/contracts/app-router.d.ts`.
For other layouts, append `-- --out "C:/path/to/frontend/src/contracts/app-router.d.ts"`
to either command. Include the regenerated declaration with the corresponding
frontend change, then run build, lint, Vitest, and `typecheck:contract`. Check mode
rejects drift without rewriting the target. Do not manually edit the declaration.

The generator records backend baseline `ed81891c5cfd59afa852bad930fdb9c3b8d14e4b`
and a hash of current source/type dependencies, config, lockfile, schema, and
generator, normalized to LF. It reads types without starting the API or accessing
the database. Backend tooling passed independent GPT-6.1 Sol review.

The declaration needs `@trpc/server` matching the installed tRPC clients (currently
11.17.0) and the `zod-v3` npm alias for backend Zod 3 declarations. The app keeps
Zod 4. These are development type dependencies; frontend Prisma is unnecessary.
Testing Library and jsdom are development dependencies for mounted React tests.

An exact-path ESLint exception applies only to `src/contracts/app-router.d.ts`:
`no-explicit-any` is disabled for eight compiler-emitted Zod error metadata types,
and `no-empty-object-type` permits generated single-extends interfaces such as
`JsonArray`. Handwritten code keeps its existing lint rules.

## Cleanup and verification record

The cleanup replaces untyped tRPC calls with the actual API contract, separates
UI variants/contexts for Fast Refresh, uses external-store subscriptions for
mobile/carousel state, and cancels radar animation work on unmount. Profile
edits use per-field overrides so untouched fields follow refetches and saves
send only edited values. Skipped watchlist statuses retain their badge;
recommendation feedback controls require a working callback.

Profile editing refreshes queries when the account changes and rejects cached
data belonging to another user. Current-account drafts survive background query
errors; missing/current-owner failures offer retry. Save redirects use the
successful rename or existing server username, including when an invalid empty
username draft is skipped.

Codex independently ran these earlier cleanup checks on 2026-10-16, before the
bundle/artwork delivery described below:

| Check | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Pass: 503 packages; a transitive development dependency reports a deprecation warning; vulnerability audit not run |
| `npm run lint` | Pass: zero errors and zero warnings |
| `npm exec -- vitest run` | Pass: 11 tests across three files |
| `npm run build` | Pass; JavaScript chunk 759.41 kB (233.15 kB gzip), above the existing 500 kB warning threshold |
| `npm run typecheck:contract` | Pass with `skipLibCheck: false` |
| `npm ls @trpc/client @trpc/server @trpc/react-query --depth=1` | Pass; aligned at 11.17.0 |
| Backend `npm run contract:check` | Pass: zero drift |
| `git diff --check` | Pass; Git reports expected Windows LF/CRLF conversion notices |

The suite has two URL tests, one mounted mobile subscription test, and eight
profile tests: signed-out redirect, empty-username save, account/cache transitions,
clearing all featured choices, explicit false privacy across refetch, five-title
limit/replacement order, background errors retaining drafts, and initial error/retry.
Type fixtures separately check IDs, pagination, dates, and rejected procedures.
Independent GPT-6.1 Sol review returned **APPROVED** for the entire changeset on
2026-10-16 after rerunning the relevant gates and reviewing production code,
tests, and all nine documentation files. No actionable findings remain.

Browser checks verified catalog browsing, `Arrival` search (18 results), a signed-out
profile-editor redirect to `/login` without render-time React warnings, and no
horizontal overflow at viewport widths 375, 768, and 1440 pixels. Signed-in behavior
is tested with mocks; no live database writes, Groq requests, or Cloudinary uploads
were used. Configured backend secrets were absent from versionable files, and
both real `.env` files are Git-ignored.

Every code/configuration/user-visible changeset must update this README and a
relevant workflow document (`AGENTS.md` or `instructions.md`). If process semantics
are unchanged, still add a workflow verification/change record in that document.

## Historical baseline and remaining work

At initial clone `8e1b17e` on 2026-10-15, build passed with a 757.52 kB JavaScript
chunk (232.58 kB gzip), lint failed with 33 errors and one warning, and the two
existing URL tests passed. These are historical results, not current gate counts.

Further work includes wider auth/mutation/privacy coverage, CI, backend
following-feed privacy and other measured performance improvements. The route
bundle and migration repair now have dedicated delivery checks. See
[instructions.md](instructions.md). Deployment and production database execution
remain separate authorized operations.

## Bundle and detail-page delivery: 2026-10-16

Secondary routes now load on demand while the shell stays mounted. The original
cinematic detail-page layout is retained: artwork sits behind the name, metadata
and controls. The hero grows with its content, uses 420/480/520 pixel minimum
heights at the checked breakpoints, aligns landscape imagery toward the top,
and preserves portrait/error/missing-art fallback behavior. Desktop navigation
starts at 1024 pixels so tablet links no longer overlap the logo.

| Final check | Result |
| --- | --- |
| `npm run lint` | Pass: zero errors/warnings |
| `npm run build` | Pass: TypeScript and Vite; no oversized-chunk warning |
| `npm exec -- vitest run` | Pass: 20 tests in five files, including all 11 earlier regressions |
| `npm run typecheck:contract` | Pass |
| `npm run check:bundle` | Pass: every emitted JS chunk below 500,000 bytes; TitleDetail deferred |
| Bundle corruption probes | Real output accepted; eight malformed/missing/oversized/eager-route cases rejected without changing build files |

Largest JavaScript chunk: **470,853 bytes** (**149,639 gzip**). The actual initial
static import graph includes that entry and **192,930 bytes** of shared React:
**663,783 bytes** (**210,172 gzip**) versus **759,405** (**233,150 gzip**) before
splitting. This saves **95,622 bytes (12.59%) raw**, or **22,978 bytes (9.86%) gzip**
on the initial JavaScript graph. CSS, images, later routes and provider requests
are separate costs. The warning threshold was not increased.

Production preview direct links for movie `1058424` and TV `213562` were visually
checked at widths 375, 768 and 1440. The image stays behind the heading, wrapped
controls remain inside the hero, upper artwork is visible, tablet navigation
does not overlap, and there is no horizontal overflow. Browser console checks
reported no errors/warnings. Poster and failed-image states are covered with
mocked provider responses; no live account mutations were exercised.

Delivery branch: `chore/local-development-cleanup`. The user authorized committing
and pushing the reviewed changes, including the earlier local cleanup. README and
both workflow documents are updated together; production deployment is separate.
Independent GPT-6.1 Sol code/test review returned **APPROVED** after rerunning
build, lint, all 20 tests, strict contract/bundle checks and whitespace validation.
The reviewer also independently rejected ten malformed bundle fixtures.
