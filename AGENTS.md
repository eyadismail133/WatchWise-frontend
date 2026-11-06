# WatchWise frontend agent instructions

Read [README.md](README.md) for setup and [instructions.md](instructions.md) for
acceptance criteria. Run Git/npm commands in this repository. In the paired local
workspace, also read the parent `AGENTS.md`. Current user instructions take
precedence over repository defaults.

## Coding workflow

1. Codex investigates requirements, architecture, existing changes, and actual
   verification commands; write a bounded implementation brief.
2. Antigravity implements through the installed `agy-delegate` skill and global
   `implement` lane. Read the skill first; use its configured default model unless
   the user chooses another. Include scope, files, context, API effects,
   acceptance criteria, commands, baseline failures, and no-commit instructions.
3. GPT-6.1 Sol (`gpt-6.1-sol`) reviews the actual diff and independently verifies
   relevant gates. A GPT-6.1 Sol orchestrator may review directly; otherwise use
   a GPT-6.1 Sol review subagent or the `codex-delegate` relay with that explicit
   model and `--lane review --read-only`. Use only this model for review.
   Reviewers only report: no edits, delegation, or commits.
4. Require `APPROVED` or `CHANGES_REQUESTED` with evidence. Return findings to the
   same Antigravity conversation using its recorded ID; use `--resume-last` only
   when unambiguous. Repeat until criteria and relevant gates pass. An
   implementer's self-report is not approval.
5. Only Codex lands approved changes within user scope. Review approval does not
   authorize pushing, publishing, or deploying.

Setup, investigation, and documentation-only work do not require implementation
dispatch. If Antigravity is unavailable, unauthenticated, or permission-blocked,
diagnose and report the blocker; do not bypass permissions or silently substitute
another implementer. On this machine the fleet config is
`C:/Users/dell/.config/delegate-skills/config.json`, and the skill is
`C:/Users/dell/.codex/skills/agy-delegate/SKILL.md`. If PATH is stale, prepend
`C:/Users/dell/AppData/Local/agy/bin` to the child PATH, preserving other entries.
Workspace file permissions and shell command permissions are separate.

## Architecture and boundaries

- `src/App.tsx`: routes; `src/main.tsx`: providers and application root.
- `src/pages/`: screens; `src/components/`: domain components.
- `src/components/ui/`: reusable primitives; reuse before adding new ones.
- `src/providers/`: tRPC/React Query; preserve SuperJSON and cookie credentials.
- `src/lib/api-url.ts`: central URL resolution; do not duplicate it.
- `src/lib/auth-client.ts`, `src/hooks/useAuth.ts`: Better Auth/session handling.
- `src/lib/cloudinary.ts`: browser uploads; Vite environment values are public.
- `src/index.css`, `tailwind.config.js`: design tokens/theme.
- Root `lib/utils.ts` is an existing utility directory, distinct from `src/lib/`.

Preserve the dark cinema theme, gold/purple accents, routes, and mobile navigation
unless redesign is in scope. Keep business/session logic out of generic UI
primitives. Preserve TMDB identity as `(tmdbId, mediaType)` (`movie`/`tv`).
Backend `src/router.ts` is the procedure contract source; there is currently no
shared type package. Do not solve type sharing with sibling filesystem imports.

## Verification and safe changes

- Start with `git status --short --branch`; preserve unrelated changes.
- Install with `npm ci`; retain the committed npm lockfile.
- Gates: `npm run build`, `npm run lint`, `npm exec -- vitest run`, `npm run typecheck:contract`
  (or `npx tsc -p tsconfig.contract.json --noEmit`), and `git diff --check`.
  There is no `npm test` script; tests live alongside source as `*.test.ts` and `*.test.tsx`.
- Contract snapshot: Frontend uses `src/contracts/app-router.d.ts`, generated from the
  backend TypeScript compiler closure. Normal frontend builds remain completely independent
  without requiring sibling checkouts. External dependencies are `@trpc/server` and `zod-v3`.
- ESLint configuration: An exact-path override in `eslint.config.js` applies strictly to
  `src/contracts/app-router.d.ts` for compiler-emitted Zod 3 error metadata (`no-explicit-any`)
  and generated `JsonArray` interfaces (`no-empty-object-type`). All handwritten code rules
  remain strictly enforced without suppressions.
- Test changed behavior/edge cases; do not add tests for prose-only changes or
  tests that merely repeat implementation details.
- No new unexplained `any`, blanket lint suppressions, or weakened type checks.
  Record existing failures and prove the change adds none.
- Verify API/auth changes with the backend. Signed-out UI is not server
  authorization. Check stale session-dependent caches after sign-in/out.
- For UI work, check loading/empty/error/success states, keyboard access, focus,
  and layouts at 375px, 768px, and 1440px.
- Never commit `.env`, credentials, `node_modules/`, `dist/`, or generated caches.
- Every code/configuration/user-visible changeset updates README and a relevant
  workflow document (`AGENTS.md` or `instructions.md`) in the same change. Even
  if process semantics stay unchanged, add a workflow verification/change record.
  Report actual checks, results, and blockers.

## Bundle and detail-page delivery workflow: 2026-10-16

After a production build, run `npm run check:bundle` as well as the existing
gates. Keep the 500 kB chunk warning threshold; compare the deduplicated initial
static import graph, including shared vendor chunks, against the recorded
baseline. Check production deep links so async pages load correctly.

The detail page retains a cinematic backdrop behind the name and metadata, per
the user's visual direction. Responsive hero content must grow for wrapped
headings/actions, retain readable contrast and image aspect ratio, and avoid
clipping or overlap at 375/768/1440 pixels. A detached image card does not meet
this requirement. Check movie and TV routes and artwork fallback states.

Delivery verification on 2026-10-16: Codex checked the production movie/TV layouts
at all three required widths, plus the 20-test suite, lint, build, strict contract
and bundle gates. The measured initial static graph is 663,783 bytes; largest
chunk 470,853 bytes. Keep these measured results distinct from historical build
sizes, and update README plus workflow evidence with every later changeset.

## Motion redesign workflow: 2026-11-06

- Animate with `motion/react` only (never `framer-motion`) and take durations,
  easings, springs and variants from `src/lib/motion.ts`. Keep
  `MotionConfig reducedMotion="user"` in `main.tsx`; decorative infinite loops
  must also respect `useReducedMotion()`.
- Animate transform/opacity (plus filter sparingly); use `layout`/`layoutId` for
  size and position. Give each shared indicator group its own `LayoutGroup` id.
- Do not use `useScroll({ target })` in components with early-return loading or
  error branches; use page `scrollY` or a child that always renders the target.
- Every new section needs skeleton, empty, error/retry and success states.
  Lazy-load heavy, rarely used UI (the quick-search palette is the pattern).
- Watchlist badges come from `watchlist.statusMap`; invalidate it with
  `getByTitle` and `list` after watchlist mutations (`useInvalidateLibrary`).
- Tests rely on `src/test-setup.ts`; assert content and accessibility, not
  animation frames. Wait for `AnimatePresence` exits with `waitFor`.
- Gates are unchanged, plus visual checks of new routes (`/person/:id`,
  `/collection/:id`) at 375/768/1440. Record initial-closure bytes against the
  716,220-byte figure from this change.

Verification on 2026-11-06 (Claude, container): lint 0/0, build, 28 Vitest tests,
strict contract and bundle gates pass; mocked-API browser checks at three widths.
The GPT-6.1 Sol review and Antigravity steps were not run in this session, so
this changeset is not yet approved for landing.

## Content and AdSense workflow: 2026-11-06

Long-form content lives in `src/content/site.json` and is used by both the React
pages and `scripts/prerender.mjs`. When adding a content page, add it to the
prerender route list so crawlers get static HTML, keep `<!--ssg-start-->` /
`<!--ssg-end-->` in `index.html`, and call `usePageMeta` on every page. Keep
`public/ads.txt` in sync with the AdSense publisher ID in `index.html`. Show
JustWatch attribution wherever streaming availability appears.

Verification (Claude, second pass): lint, build + prerender, 30 tests, contract
and bundle gates pass; frontend + real backend + fake TMDB browser sweep at three
widths passed. Sol review not run.
