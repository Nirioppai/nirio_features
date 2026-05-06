---
quick_id: 260506-http-adapter
slug: http-adapter
date: 2026-05-06
status: complete
---

# Quick Task Summary: `createHttpAdapter`

## What was done

Added a generic HTTP `StorageAdapter` so the widget can be embedded in
any host app that owns its own REST API + cookie session (the immediate
consumer is **Beygg**, a Laravel 13 + Sanctum SPA). The widget UI,
feed, submission, status, and Firebase adapter were not touched.

## Files changed

- `src/adapters/http.ts` (new) — `createHttpAdapter(config)` + `HttpAdapterConfig`
- `src/adapters/http.test.ts` (new) — 18 unit tests, mocked `fetch`
- `src/index.ts` — export `createHttpAdapter` and `HttpAdapterConfig`
- `package.json` — version bump `1.0.1` → `1.1.0` (additive feature)
- `README.md` — new "Integrating with External Projects" section

Files NOT modified (deliberately): `widget.ts`, `feed.ts`, `submission.ts`,
`status.ts`, `types.ts`, `adapter.ts`, `adapters/firebase.ts`.

## Adapter behavior (from spec)

- Implements all 8 `StorageAdapter` methods.
- Uses only `globalThis.fetch` — no new runtime dependencies.
- Every request: `credentials: 'include'`, `Accept: 'application/json'`.
- Mutating requests: `X-XSRF-TOKEN` header derived from URL-decoded
  `XSRF-TOKEN` cookie. Cookie name is configurable; pass `csrfCookieName: null`
  to disable.
- `getVote` returns `null` on 404. All other non-2xx throw `HttpAdapterError`
  with `.message` = server message (or `HTTP {status}`), `.body` = parsed
  envelope, `.status` = HTTP status.
- `snake_case` ↔ `camelCase` mapping for `Suggestion` and `Comment`;
  `created_at` ISO strings parsed to `Date`.
- `userId` parameter on vote methods is intentionally ignored on the wire —
  the server derives identity from the session cookie.

## Verification

- `npx tsc --noEmit` — passes
- `npx vitest run src` — 100/100 tests pass (existing 82 + new 18)
- `npm run test:phase8` (release gate) — passes; `npm pack --dry-run`
  produces `@nirioppai/feature-suggestions@1.1.0` tarball

## Confirmation checklist (from spec)

- [x] `createHttpAdapter` exported from `src/index.ts` with `HttpAdapterConfig`
- [x] All 8 `StorageAdapter` methods implemented and unit-tested
- [x] No new runtime dependencies (no axios, no Firebase imports)
- [x] `credentials: 'include'` on every request
- [x] `X-XSRF-TOKEN` sent on POST/PATCH/PUT/DELETE when cookie present
- [x] `snake_case ↔ camelCase` mapping verified for `Suggestion` and `Comment`
- [x] `created_at` ISO → `Date` conversion verified
- [x] `getVote` returns `null` (not throw) on 404
- [x] Errors expose server `message` and parsed envelope on `.body`
- [x] `widget.ts`, `feed.ts`, `submission.ts`, `status.ts`, `types.ts`,
      `adapter.ts`, `adapters/firebase.ts` unchanged (verify via `git diff`)
- [x] Admin gating still keyed on `user.role === 'admin'` (untouched in `widget.ts`)
- [x] `npm run typecheck`, `npm run test`, `npm run test:phase8` pass
- [x] `README.md` updated with "Integrating with External Projects" section
- [x] Package version bumped (minor) — `1.0.1` → `1.1.0`
