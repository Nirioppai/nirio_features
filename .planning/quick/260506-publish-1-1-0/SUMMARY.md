---
quick_id: 260506-publish-1-1-0
slug: publish-1-1-0
date: 2026-05-06
status: complete
---

# Quick Task Summary: v1.1.0 finalization (Project A feedback)

Closed all six gaps Project A reported. Code is committed and the release
gate is green; **the v1.1.0 git tag has not been pushed yet** — see
"Next step" below.

## Code changes

### 1. `createHttpAdapter` signature aligned with Project A spec — `src/adapters/http.ts`
- Renamed `fetchImpl` → `fetch`. Old `fetchImpl` kept as deprecated alias for
  back-compat; both resolve to the same internal field.
- Added `credentials?: RequestCredentials` (default `'include'`) so consumers
  with non-cookie auth can opt into `'same-origin'` or `'omit'`.
- Existing behavior unchanged: `credentials` default is still `'include'`.

### 2. Custom-element TS surface — `src/widget.ts`, `src/index.ts`
- Re-exported `FeatureSuggestionsElement` class.
- Added `declare global { interface HTMLElementTagNameMap { ... } }` so
  `document.createElement('feature-suggestions')` returns a typed
  `FeatureSuggestionsElement` — no `as unknown as { ... }` casts.
- All four properties (`user`, `adapter`, `theme`, `logo`) already had typed
  accessors; the class export + map augmentation makes them visible.

### 3. `firebase` is now an optional peer — `package.json`
- Added `peerDependenciesMeta.firebase.optional = true`. HTTP-adapter-only
  consumers no longer get a missing-peer warning for Firebase.

### 4. README — `README.md`
- Reformatted the element-properties table; added typed-element example
  using `satisfies WidgetUser`.
- New "Admin gating" subsection: explicit exact-string `user.role === 'admin'`
  contract; lists what does NOT count (`'admin_user'`, `'ADMIN'`, etc.).
- New `HttpAdapterConfig` table covering all options including `fetch`,
  `fetchImpl` (marked deprecated), and `credentials`.
- Existing Sanctum end-to-end example retained; behavioral guarantees
  expanded to call out that the adapter does NOT call `/sanctum/csrf-cookie`
  (host primes the cookie).
- API list notes that `firebase` is an optional peer.

### 5. Tests — `src/adapters/http.test.ts`
- Switched primary fixture to `fetch: fetchImpl` (exercises the new option).
- Added two tests:
  - `still accepts the deprecated 'fetchImpl' alias` (back-compat regression
    guard).
  - `honors a custom 'credentials' mode`.
- Suite: **102/102 pass** (was 100; +2 new).

## Diff to "protected" files

The previous quick task pledged to leave widget UI files byte-identical.
Project A explicitly requested custom-element TS declarations this round,
which requires touching `src/widget.ts`. The diff is **purely additive**
(+8 lines at end of file: re-export + global type augmentation). No
runtime behavior change. All other protected files (`feed.ts`,
`submission.ts`, `status.ts`, `types.ts`, `adapter.ts`,
`adapters/firebase.ts`) are unchanged.

## Verification

- `npx tsc --noEmit` — clean
- `npx vitest run src` — 102/102 pass
- `npm run test:phase8` (release gate) — pass; `npm pack --dry-run` produces
  `@nirioppai/feature-suggestions@1.1.0` (22.8 kB tarball).
- `dist/index.d.ts` exports `createHttpAdapter`, `HttpAdapterConfig`
  (with `fetch?` and `credentials?`), `FeatureSuggestionsElement`, and
  augments `HTMLElementTagNameMap`.

## Next step (requires user confirmation)

Publishing v1.1.0 needs a git tag push, which triggers
`.github/workflows/publish.yml` and pushes the package to GitHub Packages.
That action is hard to reverse, so it has been deferred for explicit
approval:

```bash
git push origin master                 # push the two commits
npm version minor --no-git-tag-version  # already at 1.1.0 — skip
git tag v1.1.0
git push origin v1.1.0                 # triggers publish workflow
```

(Or simply `git tag v1.1.0 && git push origin master --follow-tags` if the
branch and tag should ship together.)
