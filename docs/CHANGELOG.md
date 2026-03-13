# Changelog

## [Unreleased] - 2026-03-12

### Bug Fixes

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
