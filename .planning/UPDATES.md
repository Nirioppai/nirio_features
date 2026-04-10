# Updates

## 2026-04-10 — Phase 1: Package Scaffold

**Status:** Complete

- Initialized `@nirioppai/feature-suggestions` package targeting GitHub Packages
- Configured `tsup` to output CJS (`dist/index.cjs.js`), ESM (`dist/index.esm.js`), and `.d.ts` typings
- TypeScript configured with `strict: true`
- GitHub Actions workflow added — triggers on `v*` tag push, publishes via `GITHUB_TOKEN`
- `.npmrc` scopes `@nirioppai` to `https://npm.pkg.github.com`
- Empty `src/index.ts` entry point in place; ready for Phase 2
