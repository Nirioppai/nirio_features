---
quick_id: 260506-http-adapter
slug: http-adapter
date: 2026-05-06
status: in-progress
---

# Quick Task: Add `createHttpAdapter` for REST/cookie-auth hosts

## Description

Add a generic HTTP `StorageAdapter` (`src/adapters/http.ts`) that lets a host app
(e.g. Beygg / Project A) run the widget against its own Laravel + Sanctum REST
API instead of Firebase. Adapter must:

- Use only `globalThis.fetch` (no new runtime deps).
- Always send `credentials: 'include'` and `Accept: 'application/json'`.
- On mutating requests, send `X-XSRF-TOKEN` derived from the URL-decoded
  `XSRF-TOKEN` cookie (configurable name; nullable to disable).
- Map `snake_case` ↔ `camelCase` for `Suggestion` / `Comment`; convert
  `created_at` ISO strings → `Date`.
- `getVote` returns `null` on 404; all other non-2xx throw `Error` with the
  server `message` and the parsed envelope on `.body`.
- `userId` arg on vote methods is ignored at the wire (server uses session).

## Files

- `src/adapters/http.ts` (new)
- `src/adapters/http.test.ts` (new)
- `src/index.ts` (add exports)
- `package.json` (bump 1.0.1 → 1.1.0)
- `README.md` (add "Integrating with External Projects" section)

## Out of scope (must NOT change)

`widget.ts`, `feed.ts`, `submission.ts`, `status.ts`, `types.ts`, `adapter.ts`,
`adapters/firebase.ts`.

## Verification

- `npm run typecheck`
- `npm run test:unit`
- `npm run test:phase8` (release gate)
