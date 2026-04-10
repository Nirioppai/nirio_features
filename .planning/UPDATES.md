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

## 2026-04-10 — Phase 3: Core Widget Shell

**Status:** Complete

- Implemented `<feature-suggestions>` custom element in `src/widget.ts` with shadow DOM
- `user` prop accepts `{ id, name, email, role }` as JS property or JSON attribute string
- `theme` prop applies `--fs-primary-color`, `--fs-background`, `--fs-font` CSS custom properties to host element
- `logo` prop renders `<img>` above the tagline "Let us know how we can improve..."
- `defineWidget()` factory guards against double-registration via `customElements.get`
- `adapter` property wired for use in Phase 4+
- 9 widget tests in `src/widget.test.ts` — all passing via vitest + happy-dom
- `WidgetUser` and `WidgetTheme` types exported from public API

## 2026-04-10 — Phase 4: Suggestion Feed

**Status:** Complete

- Created `src/feed.ts` with pure functions: `sortSuggestions`, `filterSuggestions`, `renderSuggestionCard`, `renderFeedHTML`
- Sort options: Newest (createdAt desc), Most Voted (voteCount desc), Trending (commentCount desc)
- Search filters across title and details, case-insensitive, trims whitespace
- Loading state and empty state render without errors
- HTML output escapes user content to prevent XSS
- Widget updated to fetch suggestions on `connectedCallback` and when `adapter` is set post-connect
- Feed renders inside `#fs-feed-root` container (separate from shell) to avoid full re-renders on sort/search
- Sort buttons and search input bind events after each feed render; search restores cursor position
- 21 feed unit tests + 9 widget + 9 firebase — 39/39 passing

## 2026-04-10 — Phase 5: Suggestion Submission

**Status:** Complete

- Created `src/submission.ts` with `renderSubmissionFormHTML` and `validateTitle` pure functions
- Form renders title input (required), details textarea (optional), and type selector (New Feature / Feature Update / Bug Report)
- Validation: empty or whitespace-only title returns error and blocks adapter call
- Error state renders `role="alert"` message and `aria-invalid` on title input; all user content HTML-escaped
- Widget updated with `_showForm` / `_formState` fields and a "+ New Suggestion" button in the header
- `renderFormSection()` / `bindFormEvents()` / `bindShellEvents()` follow the same render-then-bind pattern as the feed
- On valid submit: calls `adapter.createSuggestion()`, prepends the new suggestion to `_suggestions`, hides form, re-renders feed — no reload needed
- 15 submission unit tests + 7 new widget tests — 61/61 passing
