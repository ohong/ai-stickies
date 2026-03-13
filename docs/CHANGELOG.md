# Changelog

## [Unreleased] - 2026-03-12

### Performance

- **Fix progress bar freeze at 90%** — Replaced linear 500ms/+5% increment with a decelerating curve (`increment = max((95 - progress) * 0.08, 0.5)`) at 1s intervals. Progress now smoothly advances over 20-30s without appearing stuck. Cap raised from 90% to 95%. (`src/hooks/use-generation.ts`)
- **Increase batch size from 3 to 5** — Cuts sequential image generation batches from 4 to 2 for a 10-sticker pack. (`src/lib/config.ts`)
- **Parallelize multi-pack generation** — Replaced sequential `for` loop with `Promise.allSettled` in the packs API route. N packs now generate in ~1x time instead of Nx, with per-pack error handling. (`app/api/generate/packs/route.ts`)
- **Cache sticker buffers to skip re-downloading for ZIP** — `generateSingleSticker` now returns the processed buffer alongside the sticker record. Buffers are cached in a `Map` and passed to `createAndStorePackZip`, eliminating redundant storage downloads. (`src/lib/services/pack.service.ts`)
- **Round progress percentage display** — Progress bar now shows `Math.round(progress)%` instead of raw floating-point values. (`src/components/styles/generation-progress.tsx`)

### Mobile UX

- **Bottom sheet dialogs on mobile** — All modals slide up from the bottom on small screens with rounded top corners and safe-area-inset padding. Desktop layout unchanged. (`components/ui/dialog.tsx`)
- **Sticky bottom action bars** — Styles page (Generate button) and Results page (Download All + Export) now have fixed bottom bars on mobile for thumb-friendly access. Content has extra bottom padding to avoid overlap.
- **3-col sticker grid on mobile** — Results page sticker grid changed from 2-col to 3-col on mobile for better space usage with 10 stickers.
- **2-col style preview grid on mobile** — Styles page changed from 1-col to 2-col on mobile so all 5 previews are visible without excessive scrolling.
- **Always-visible sticker labels on mobile** — Emotion labels on sticker thumbnails are always shown on mobile (hover-only on desktop) since touch devices have no hover state.
- **Full-screen sticker modal on mobile** — Larger navigation buttons (`size-11`), pagination dots (`size-3`), and full-width download button (`h-12`) for thumb-friendly interaction.
- **"Tap to upload" text on mobile** — Image uploader shows context-appropriate copy ("Tap to upload" vs "Drop your photo here") and has reduced padding on small screens.
- **Safe area support** — Added `viewport-fit=cover` meta tag and `env(safe-area-inset-*)` padding on body, bottom bars, and dialog sheets for notched phones.
- **Consistent compact headers** — All app page headers use `h-14` on mobile, `h-16` on desktop with tighter horizontal padding (`px-3`).
- **Responsive typography throughout** — Headings, body text, and labels scale down on mobile (`text-xl`/`text-sm`) with tighter spacing.
- **Touch feedback** — Added `active:scale-95` on CTA buttons and `active:bg-secondary/50` on history list items.
- **iOS optimizations** — Disabled overscroll bounce (`overscroll-behavior: none`) and tap highlight (`-webkit-tap-highlight-color: transparent`).

### Bug Fixes

- **Fix React render-phase state update warning** — `decrementGenerations` in `useSession` was calling `sessionCounterState$.remaining.set()` inside a `setState` updater, which triggered a Legend State observable update during React's render phase. Moved the observable sync outside the updater. (`src/hooks/use-session.ts`)

- **Fix JSON parsing crash in production upload flow** — `readResponseBody` in `src/lib/utils/http.ts` threw an unhandled `SyntaxError` when the server returned a non-JSON body (e.g. "Internal Server Error") with a `content-type: application/json` header. This produced the user-facing error `Unexpected token 'I', "Internal S"... is not valid JSON`. Fixed by consolidating to a single try/catch path so plain-text responses fall through gracefully.
- **Fix TypeScript errors in upload service** — `getOrCreateSessionContext()` in `upload.service.ts` had 3 type errors where `sessionId` (`string | undefined`) and `session` (`Session | null`) couldn't be narrowed after conditional blocks. Resolved by extracting to `resolvedSessionId` / `resolvedSession` after the guard logic.

### Added

- **`.env.example`** — Documents all 18 environment variables grouped by category (Supabase, AI providers, session, storage, generation, feature flags). Uses current Supabase key naming: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` + `SUPABASE_SECRET_KEY`.
- **Full unit/integration test suite (144 tests)** using Vitest + Testing Library:
  - `src/__tests__/utils/http.test.ts` (24 tests) — `parseApiResponse` and `readApiError`, including regression test for the JSON parsing crash.
  - `src/__tests__/services/upload.service.test.ts` (15 tests) — File validation, `initiateUpload`, `completeUpload`, idempotency, error classes.
  - `src/__tests__/services/session.service.test.ts` (19 tests) — Cookie handling, session lifecycle, rate limiting, generation count, history.
  - `src/__tests__/hooks/use-upload.test.ts` (9 tests) — 3-step signed-URL upload flow, validation, API/Supabase errors.
  - `src/__tests__/hooks/use-session.test.ts` (10 tests) — Fetch on mount, `canGenerate` logic, `decrementGenerations`, error states.
  - `src/__tests__/hooks/use-generation.test.ts` (7 tests) — Preview generation, options passthrough, reset/clear.
  - `src/__tests__/hooks/use-style-selection.test.ts` (12 tests) — Toggle, select all, clear, `canProceed` bounds (0/1/5/6).
  - `src/__tests__/hooks/use-download.test.ts` (19 tests) — All 4 download methods, in-progress states, blob cleanup.
  - `src/__tests__/api/upload.route.test.ts` (10 tests) — Initiate/complete actions, form-data fallback, error status codes.
  - `src/__tests__/api/session.route.test.ts` (8 tests) — Session data, history with style counts, error responses.
  - `src/__tests__/api/generation.route.test.ts` (8 tests) — Auth 401, not found 404, access denied 403, success paths.
- **Expanded Playwright e2e tests** (45 tests across 5 files) — Upload flow, generation flow, download/results, history page, rate limiting. All tests use `page.route()` API mocking for deterministic behavior.
- **Test infrastructure** — `vitest.config.ts`, `tsconfig.test.json`, `src/__tests__/setup.ts` with global mocks. Added `test`, `test:watch`, `test:coverage` npm scripts.

### Known Issues (identified during codebase review)

- **Race condition on generation count** — `session.service.ts:incrementGenerationCount` and `generate/packs/route.ts` use read-then-write for `generation_count` without atomic DB operations. Concurrent requests can bypass rate limits.
- **Memory leak in useGeneration** — `setInterval` for progress simulation is not cleared on component unmount.
- **N+1 query in session API** — `GET /api/session` calls `getStylePreviewCount` per generation instead of a batched query.
- **No max limit on selectedStyleIds** — `POST /api/generate/packs` doesn't cap the array length.
- **Results errors always empty** — `GET /api/generations/{id}/results` returns `errors: []` despite collecting errors server-side.
- **Brittle download endpoints** — Pack/sticker download fails entirely if any single sticker storage fetch fails (no partial results).
