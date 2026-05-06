---
phase: 08-package-release-integration-test
plan: 02
status: complete
---

# Plan 08-02 Summary

## What was built

- Updated `.github/workflows/publish.yml` so the tag-triggered job runs `npm run test:phase8` before `npm publish`. The dedicated step replaces the previous standalone `Build` step (the build runs inside `test:phase8`), so a failing release verification slice now blocks publishing without duplicating logic in the workflow.
- Rewrote `README.md` around the actual GitHub Packages consumer flow: a `.npmrc` example for the `@nirioppai` scope and `NODE_AUTH_TOKEN`, an end-to-end usage snippet that calls `defineWidget()`, creates the Firebase adapter, and assigns `user`/`adapter`/`theme`/`logo` on the custom element, and a release section that documents the tag-driven GitHub Actions path (`npm version` → `git push --follow-tags`) and demotes manual `npm publish` to a fallback note.

## Key files

- modified: `.github/workflows/publish.yml`
- modified: `README.md`

## Verification

- `npm run test:phase8` → build OK, 8/8 dist-bundle consumer tests pass, `npm pack --dry-run` produced a 10.9 kB tarball that includes the rewritten `README.md` (5.4 kB).
- Workflow inspection confirms `npm run test:phase8` runs immediately before `npm publish`, gated on the same `GITHUB_TOKEN`.

## Self-Check: PASSED
