# Updates

## 2026-04-10 — Phase 1: Package Scaffold

**Status:** Complete

- Initialized `@nirioppai/feature-suggestions` package targeting GitHub Packages
- Configured `tsup` to output CJS (`dist/index.cjs.js`), ESM (`dist/index.esm.js`), and `.d.ts` typings
- TypeScript configured with `strict: true`
- GitHub Actions workflow added — triggers on `v*` tag push, publishes via `GITHUB_TOKEN`
- `.npmrc` scopes `@nirioppai` to `https://npm.pkg.github.com`
- Empty `src/index.ts` entry point in place; ready for Phase 2

## 2026-04-10 — Phase 2: Storage Adapter Interface

**Status:** Complete

- Defined domain types in `src/types.ts` — `Suggestion`, `Comment`, `Vote`, `SuggestionType`, `SuggestionStatus`, input types
- Defined `StorageAdapter` interface in `src/adapter.ts` with 8 methods covering suggestions, votes, and comments
- Implemented `FirebaseAdapter` in `src/adapters/firebase.ts` using Firebase modular SDK (v10)
- Factory function `createFirebaseAdapter(firestore)` is the public init API
- `firebase` set as peer dependency; externalized from bundle in tsup
- 9 unit tests in `src/adapters/firebase.test.ts` — all passing via vitest with mocked Firestore
- Public API exported from `src/index.ts`
