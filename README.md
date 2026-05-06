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
- `createHttpAdapter(config)` — factory returning a `StorageAdapter` backed by a host REST API (cookie-auth friendly). See [Integrating with External Projects](#integrating-with-external-projects).
- Exported types: `WidgetUser`, `WidgetTheme`, `SortOption`, `HttpAdapterConfig` (and the underlying `Suggestion`, `Comment`, `Vote`, `StorageAdapter` types from `src/`).

### Element properties

| Property  | Type                                    | Notes                                             |
| --------- | --------------------------------------- | ------------------------------------------------- |
| `user`    | `{ id, name, email, role }`             | Host app owns auth; widget trusts the value.      |
| `adapter` | `StorageAdapter`                        | Required; use the Firebase adapter or your own.   |
| `theme`   | `{ primaryColor?, background?, font? }` | Maps to CSS custom properties on the shadow root. |
| `logo`    | `string`                                | URL rendered above the intro tagline.             |

Admin behavior: when `user.role === 'admin'`, the detail dialog exposes a status selector. All users see the resulting status badge on cards and in the dialog.

## Integrating with External Projects

The widget is intentionally decoupled from any specific backend through the `StorageAdapter` interface (`src/adapter.ts`). Two adapters ship with the package:

- `createFirebaseAdapter(firestore)` — for apps that already use Firestore.
- `createHttpAdapter(config)` — for apps that own their own REST API (e.g. Laravel + Sanctum, Rails, Django, Express).

Hosts can also implement the `StorageAdapter` interface themselves to point the widget at any other backend.

### What a host project must provide

To embed the widget the host project owns four responsibilities:

1. **Authentication** — the widget never logs anyone in. The host authenticates the user (cookie session, JWT, OAuth, whatever) and passes the resulting identity in as the `user` prop.
2. **A `WidgetUser`** — `{ id, name, email, role }`. Map your internal roles to either `'user'` or `'admin'`. The exact string `user.role === 'admin'` is the only thing that exposes the status selector.
3. **A storage adapter** — either one of the bundled adapters (configured for your backend) or a custom implementation of `StorageAdapter`.
4. **CSRF / session bootstrap (if applicable)** — for cookie sessions, run any required pre-flight (e.g. Laravel Sanctum's `GET /sanctum/csrf-cookie`) **before** mounting the widget. The HTTP adapter does not initialize CSRF; it only reads the cookie and forwards it as a header.

### Conventions and interfaces the repository expects

- The `StorageAdapter` interface in `src/adapter.ts` is the integration boundary. Anything that implements those eight methods is a valid backend.
- The widget owns all rendering, event handling, optimistic updates, and shadow-DOM styling. **It never calls `fetch` directly.**
- The host owns auth, CSRF, identity mapping, and adapter construction.
- Types in `src/types.ts` (`Suggestion`, `Comment`, `Vote`, etc.) are the shared vocabulary between the widget and any adapter.
- Admin gating is by exact string equality on `user.role === 'admin'`. Map your role taxonomy accordingly.

### Using the bundled HTTP adapter (`createHttpAdapter`)

`createHttpAdapter` translates the eight `StorageAdapter` methods into HTTP calls against a REST resource. It uses only `globalThis.fetch` (no extra dependencies) and is friendly to cookie-based session auth (Laravel Sanctum, Rails session, etc.).

Endpoint contract the host must serve under `{baseUrl}{resourcePath}` (default `resourcePath` is `/api/feature-suggestions`):

| Method   | Path             | Request body               | Response                              |
| -------- | ---------------- | -------------------------- | ------------------------------------- |
| `GET`    | `/`              | —                          | `Suggestion[]`                        |
| `POST`   | `/`              | `{ title, details, type }` | `Suggestion`                          |
| `PATCH`  | `/{id}/status`   | `{ status }`               | (any 2xx)                             |
| `GET`    | `/{id}/vote`     | —                          | `{ suggestion_id, user_id }` or `404` |
| `POST`   | `/{id}/vote`     | —                          | (any 2xx)                             |
| `DELETE` | `/{id}/vote`     | —                          | (any 2xx)                             |
| `GET`    | `/{id}/comments` | —                          | `Comment[]`                           |
| `POST`   | `/{id}/comments` | `{ body }`                 | `Comment`                             |

JSON shapes (server returns `snake_case`; the adapter maps to the `camelCase` types in `src/types.ts`):

```jsonc
// Suggestion
{
  "id": "string-or-number",
  "title": "...",
  "details": "..." | null,
  "type": "New Feature" | "Feature Update" | "Bug Report",
  "status": "Under Review" | "Planned" | "In Progress" | "Completed" | "Declined" | null,
  "author_id": "...",
  "author_name": "...",
  "vote_count": 0,
  "comment_count": 0,
  "created_at": "2026-05-06T12:34:56+00:00"   // ISO 8601 → mapped to Date
}

// Comment
{
  "id": "...",
  "suggestion_id": "...",
  "author_id": "...",
  "author_name": "...",
  "body": "...",
  "created_at": "2026-05-06T12:34:56+00:00"
}

// Error envelope (any non-2xx)
{ "message": "human-readable", "code": "MACHINE_CODE", "errors": { "field": ["..."] } }
```

Behavioral guarantees of the HTTP adapter:

- Every request sets `credentials: 'include'` and `Accept: 'application/json'`.
- Mutating requests (`POST` / `PATCH` / `PUT` / `DELETE`) URL-decode the `XSRF-TOKEN` cookie and send it as `X-XSRF-TOKEN`. Cookie + header names are configurable (`csrfCookieName`, `csrfHeaderName`); pass `csrfCookieName: null` to disable.
- `getVote` returns `null` on 404; all other non-2xx responses throw an `Error` whose `.message` is the server's `message` field (or `HTTP {status}`) and whose `.body` is the parsed envelope.
- `created_at` strings are parsed to `Date`. Field names are mapped `snake_case` → `camelCase`.
- The `userId` argument on the vote methods is ignored on the wire — the server is expected to derive identity from the session.

End-to-end example (host owns auth + CSRF, widget renders + persists):

```ts
import {
  defineWidget,
  createHttpAdapter,
} from '@nirioppai/feature-suggestions';

// 1. Host bootstraps its own session + CSRF (e.g. Laravel Sanctum)
await fetch('https://api.example.com/sanctum/csrf-cookie', {
  credentials: 'include',
});
const me = await fetch('https://api.example.com/api/auth/me', {
  credentials: 'include',
}).then(r => r.json());

// 2. Build the adapter against the host's REST API
const adapter = createHttpAdapter({
  baseUrl: 'https://api.example.com',
  // resourcePath: '/api/feature-suggestions',  // default
  // csrfCookieName: 'XSRF-TOKEN',              // default
  // csrfHeaderName: 'X-XSRF-TOKEN',            // default
});

// 3. Mount the widget with the host's identity
defineWidget();
const el = document.createElement('feature-suggestions');
el.user = {
  id: String(me.id),
  name: me.name,
  email: me.email,
  role: me.role === 'admin_user' ? 'admin' : 'user',
};
el.adapter = adapter;
el.theme = { primaryColor: '#5b6cff' };
el.logo = '/logo.svg';
document.body.appendChild(el);
```

### Pointing the widget at any other backend

If neither bundled adapter fits, implement `StorageAdapter` yourself:

```ts
import type { StorageAdapter } from '@nirioppai/feature-suggestions';

const adapter: StorageAdapter = {
  async getSuggestions() {
    /* … */
  },
  async createSuggestion(input) {
    /* … */
  },
  async setStatus(id, status) {
    /* … */
  },
  async getVote(id, userId) {
    /* … */
  },
  async addVote(id, userId) {
    /* … */
  },
  async removeVote(id, userId) {
    /* … */
  },
  async getComments(id) {
    /* … */
  },
  async addComment(id, input) {
    /* … */
  },
};
```

Pass it as `el.adapter` exactly the same way. The widget cannot tell the difference.

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
