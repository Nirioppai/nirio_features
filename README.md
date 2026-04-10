# @nirioppai/feature-suggestions

Framework-agnostic feature suggestion widget — Web Component (v1.0.0)

Features

- Submit suggestions (title, details, type)
- Browse feed with search and sort (Trending, Most Voted, Newest)
- Detail dialog with upvotes and comments
- Admin controls: set suggestion status (admins only)
- Storage adapters: Firebase adapter included (Supabase planned)

Install

This package is published to GitHub Packages. Install in your project (example):

```bash
# if your .npmrc already points to GitHub Packages for @nirioppai
npm install @nirioppai/feature-suggestions
```

Usage

Import the package and register the widget, then mount the custom element in your app:

```html
<script type="module">
  import {
    defineWidget,
    createFirebaseAdapter,
  } from '@nirioppai/feature-suggestions';
  defineWidget();

  // initialize adapter (example: Firebase already configured)
  // const adapter = createFirebaseAdapter(firestore);

  // mount
  const el = document.createElement('feature-suggestions');
  // pass props as JS properties
  el.user = {
    id: 'u1',
    name: 'Alice',
    email: 'alice@example.com',
    role: 'user',
  };
  // el.adapter = adapter;
  document.body.appendChild(el);
</script>
```

API surface (quick)

- `defineWidget()` — register the `<feature-suggestions>` element
- `createFirebaseAdapter(firestore)` — factory for the Firebase storage adapter
- Exports types: `Suggestion`, `Comment`, `WidgetUser`, `WidgetTheme`, etc.

Configuration

- `user` (property) — object `{ id, name, email, role }`. The widget trusts the host app for auth and roles.
- `adapter` (property) — an implementation of the `StorageAdapter` interface (Firebase adapter provided).
- `theme` (property) — object with `primaryColor`, `background`, `font` keys to set CSS variables.
- `logo` (property) — URL string rendered above the tagline.

Development

Run tests and build locally:

```bash
npm install
npm run typecheck
npm run build
npx vitest --run
```

Release

- Built bundles (CJS + ESM) and typings are produced via `tsup` and published to GitHub Packages.
- To publish, create a GitHub PAT with `read:packages` and `write:packages` (and `repo` if needed for a private repo), then `npm login --registry=https://npm.pkg.github.com --scope=@nirioppai` and `npm publish --registry=https://npm.pkg.github.com`.

Project notes

- See `.planning/UPDATES.md` for roadmap and changelog details.
