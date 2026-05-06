---
quick_id: 260506-publish-1-1-0
slug: publish-1-1-0
date: 2026-05-06
status: in-progress
---

# Quick Task: Finalize and publish v1.1.0 per Project A feedback

Project A (Beygg) reports six gaps blocking adoption of v1.1.0:

1. **Not published** — `npm view` only shows `1.0.0` / `1.0.1`. The local
   `package.json` was bumped but no tag was pushed.
2. **Adapter signature mismatch** — Project A spec uses `fetch` and
   `credentials`; current code uses `fetchImpl` and has no `credentials`
   override. Rename `fetchImpl` → `fetch` (keep `fetchImpl` as deprecated
   alias for back-compat) and add `credentials?: RequestCredentials`
   (default `'include'`).
3. **Custom-element TS types missing** — consumers need typed `user`,
   `adapter`, `theme`, `logo` properties without `as unknown as { ... }`.
4. **Admin gating contract underspecified** — make explicit in README:
   exact string `user.role === 'admin'`.
5. **`firebase` is a hard peer** — move to optional via
   `peerDependenciesMeta`.
6. **Sanctum example** — already present in README; verify it is
   end-to-end and call out CSRF priming.

Do all the code work locally. **Do not push tags / publish without
explicit user confirmation** (per operationalSafety rules — publishing is
hard to reverse).
