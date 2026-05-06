# @nirioppai/feature-suggestions

Framework-agnostic feature suggestion widget — distributed as a Web Component (`<feature-suggestions>`) on **GitHub Packages**.

## Features

- Submit suggestions (title, details, type)
- Browse the feed with text search and sort (Trending / Most Voted / Newest)
- Detail dialog with one-vote-per-user upvotes and a comment thread
- Admin-only status setter (Under Review / Planned / In Progress / Completed / Declined); status badge visible to all users
- Storage adapters: Firebase included (Supabase planned for v1.1)
- Themable via CSS custom properties; logo + intro tagline configurable

## Install (GitHub Packages)

This package is **private** and hosted on GitHub Packages, not the public npm registry. You need a GitHub personal access token with the `read:packages` scope (and access to this repository) configured in your `.npmrc`.

### 1. Create `.npmrc` in your project root

```ini
# .npmrc
@nirioppai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

### 2. Export your GitHub token

```bash
export NODE_AUTH_TOKEN=ghp_your_personal_access_token
```

> The token must have `read:packages` and access to the `Nirioppai/nirio_features` repository.

### 3. Install the package

```bash
npm install @nirioppai/feature-suggestions
```

## Usage

The widget is a custom element. Register it once, then mount and pass the host-app `user` and `adapter` as JS properties.

```html
<script type="module">
  import {
    defineWidget,
    createFirebaseAdapter,
  } from '@nirioppai/feature-suggestions';
  import { initializeApp } from 'firebase/app';
  import { getFirestore } from 'firebase/firestore';

  // 1. Register the custom element (idempotent)
  defineWidget();

  // 2. Initialize your Firebase app and create the adapter
  const app = initializeApp({
    /* your firebase config */
  });
  const adapter = createFirebaseAdapter(getFirestore(app));

  // 3. Mount the widget and pass props
  const el = document.createElement('feature-suggestions');
  el.user = {
    id: 'u1',
    name: 'Alice',
    email: 'alice@example.com',
    role: 'user', // 'admin' to expose the status selector
  };
  el.adapter = adapter;
  el.theme = { primaryColor: '#5b6cff', background: '#fff', font: 'Inter' };
  el.logo = 'https://your.cdn/logo.svg';
  document.body.appendChild(el);
</script>
```

## API

- `defineWidget()` — registers the `<feature-suggestions>` element. Safe to call multiple times.
- `createFirebaseAdapter(firestore)` — factory returning a `StorageAdapter` backed by Firestore.
- Exported types: `WidgetUser`, `WidgetTheme`, `SortOption` (and the underlying `Suggestion`, `Comment`, `Vote`, `StorageAdapter` types from `src/`).

### Element properties

| Property  | Type                                    | Notes                                             |
| --------- | --------------------------------------- | ------------------------------------------------- |
| `user`    | `{ id, name, email, role }`             | Host app owns auth; widget trusts the value.      |
| `adapter` | `StorageAdapter`                        | Required; use the Firebase adapter or your own.   |
| `theme`   | `{ primaryColor?, background?, font? }` | Maps to CSS custom properties on the shadow root. |
| `logo`    | `string`                                | URL rendered above the intro tagline.             |

Admin behavior: when `user.role === 'admin'`, the detail dialog exposes a status selector. All users see the resulting status badge on cards and in the dialog.

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
```

Per-phase verification commands:

- `npm run test:unit` — fast unit suite
- `npm run test:consumer` — built-bundle consumer integration test
- `npm run test:phase6`, `test:phase7`, `test:phase8` — phase-scoped checks
- `npm run test:phase8` — **release gate**: builds, runs the dist-bundle integration suite, and runs `npm pack --dry-run`

## Release (tag-driven GitHub Actions)

Releases are published automatically by `.github/workflows/publish.yml` on version tag pushes. The workflow runs `npm run test:phase8` **before** `npm publish`, so a tag cannot ship a package that fails the release verification slice.

To cut a release:

```bash
# 1. Bump the version (commits + creates a vX.Y.Z tag)
npm version patch   # or minor / major

# 2. Push the commit and the tag
git push origin master --follow-tags
```

GitHub Actions then:

1. Checks out the tagged commit
2. Installs dependencies with `npm ci`
3. Runs `npm run test:phase8` (build → consumer integration → `npm pack --dry-run`)
4. Runs `npm publish` against `https://npm.pkg.github.com` using the workflow's `GITHUB_TOKEN`

If Phase 8 verification fails, the publish step is skipped and the tag does not produce a release.

> Local `npm publish` is a fallback only. The tag-driven workflow is the supported release path so the verification gate cannot be bypassed.

## Project notes

- See `.planning/UPDATES.md` for roadmap and changelog details.
- Source of truth for behavior is the dist-bundle consumer test in `test/e2e.consumer.test.ts`.
