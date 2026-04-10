# Roadmap: Feature Suggestion Widget

## Overview

Build a framework-agnostic Web Components library distributed as a private GitHub package. Consuming apps embed `<feature-suggestions>` to give users a complete suggestion feedback loop — submit, upvote, comment, and track status — with Firebase as the storage backend (Supabase in v1.1).

## Phases

- [ ] **Phase 1: Package Scaffold** - Repo structure, Rollup + TypeScript build, GitHub Packages publishing pipeline
- [ ] **Phase 2: Storage Adapter Interface** - Abstract StorageAdapter + Firebase adapter implementation
- [ ] **Phase 3: Core Widget Shell** - Web Component base, user prop, theming, logo
- [ ] **Phase 4: Suggestion Feed** - Browsable list with sort (Trending/Most Voted/Newest) and text search
- [ ] **Phase 5: Suggestion Submission** - Submit form wired to storage adapter
- [ ] **Phase 6: Detail Dialog + Voting + Comments** - Per-suggestion dialog, upvoting, comment thread
- [ ] **Phase 7: Admin Controls** - Status setter (admin-only), status badge (all users)
- [ ] **Phase 8: Package Release & Integration Test** - Publish v1.0.0, verify in consuming app

## Phase Details

### Phase 1: Package Scaffold
**Goal**: A publishable, installable (empty) package on GitHub Packages with correct build output — CJS + ESM bundles, strict TypeScript, and a tag-based publish workflow.
**Depends on**: Nothing (first phase)
**Requirements**: None
**Success Criteria** (what must be TRUE):
  1. `npm pack` produces a valid tarball with `dist/index.cjs.js`, `dist/index.esm.js`, and `.d.ts` typings
  2. TypeScript compiles with `strict: true` and zero errors
  3. GitHub Actions workflow triggers on version tag push and publishes to GitHub Packages
  4. A consumer can install the package with a `.npmrc` GitHub token and import it without errors
**Plans**: TBD

### Phase 2: Storage Adapter Interface
**Goal**: A typed `StorageAdapter` interface and a working `FirebaseAdapter` so the rest of the widget calls one interface regardless of backend.
**Depends on**: Phase 1
**Requirements**: None
**Success Criteria** (what must be TRUE):
  1. `StorageAdapter` interface is defined in TypeScript with methods for suggestions, votes, comments, and status
  2. `FirebaseAdapter` implements every method in the interface
  3. Adapter is initialized via a factory function passed to the widget init
  4. Unit tests pass for all adapter contract methods
**Plans**: TBD

### Phase 3: Core Widget Shell
**Goal**: A `<feature-suggestions>` custom element that mounts, accepts `user`, `theme`, and `logo` props, and scopes default styles via shadow DOM.
**Depends on**: Phase 1
**Requirements**: None
**Success Criteria** (what must be TRUE):
  1. `customElements.define('feature-suggestions', ...)` registers without errors in a plain HTML page
  2. `user` attribute/property accepts `{ id, name, email, role }` and exposes it internally
  3. CSS custom properties for primary color, background, and font apply correctly
  4. `logo` prop renders above the intro tagline "Let us know how we can improve..."
**Plans**: TBD

### Phase 4: Suggestion Feed
**Goal**: The main feed view renders all suggestions from the adapter with sort and text search working.
**Depends on**: Phase 2, Phase 3
**Requirements**: None
**Success Criteria** (what must be TRUE):
  1. All suggestions from the adapter render as cards in the feed
  2. Switching sort to Trending, Most Voted, or Newest reorders the feed correctly
  3. Typing in the search field filters suggestions by title and details in real time
  4. Empty state and loading state render without errors
**Plans**: TBD

### Phase 5: Suggestion Submission
**Goal**: Users can open a submission form, fill in title, details, and type, and persist the suggestion via the adapter.
**Depends on**: Phase 4
**Requirements**: None
**Success Criteria** (what must be TRUE):
  1. Submission form renders with title (required), details (optional), and type selector
  2. Submitting without a title shows a validation error and does not write to the adapter
  3. Valid submission writes to the adapter and appears in the feed without a full page reload
**Plans**: TBD

### Phase 6: Detail Dialog + Voting + Comments
**Goal**: Clicking a suggestion opens a dialog with full details, an upvote button (one per user), and a live comment thread.
**Depends on**: Phase 4
**Requirements**: None
**Success Criteria** (what must be TRUE):
  1. Clicking a suggestion card opens a dialog displaying the full title, details, type, and status
  2. Upvote button increments the count; clicking again decrements (one vote per user per suggestion)
  3. Comment form submits a comment that immediately appears in the thread
  4. Dialog closes without errors when dismissed
**Plans**: TBD

### Phase 7: Admin Controls
**Goal**: Users with `role: 'admin'` can set a status on any suggestion; status badge is visible to all users.
**Depends on**: Phase 6
**Requirements**: None
**Success Criteria** (what must be TRUE):
  1. Status selector (Under Review / Planned / In Progress / Completed / Declined) is visible only when `user.role === 'admin'`
  2. Selecting a status persists it via the adapter
  3. Status badge renders on both the suggestion card and the detail dialog for all users
  4. Non-admin users see the badge but not the selector
**Plans**: TBD

### Phase 8: Package Release & Integration Test
**Goal**: Package is live on GitHub Packages as v1.0.0, installable, and verified working end-to-end in the consuming app.
**Depends on**: Phase 7
**Requirements**: None
**Success Criteria** (what must be TRUE):
  1. `npm install @org/feature-suggestions` succeeds in the consuming app with a GitHub `.npmrc` token
  2. Widget initializes with a Firebase config and a user prop without console errors
  3. All Phase 1–7 features work end-to-end in the consuming app
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Package Scaffold | 0/TBD | Not started | - |
| 2. Storage Adapter Interface | 0/TBD | Not started | - |
| 3. Core Widget Shell | 0/TBD | Not started | - |
| 4. Suggestion Feed | 0/TBD | Not started | - |
| 5. Suggestion Submission | 0/TBD | Not started | - |
| 6. Detail Dialog + Voting + Comments | 0/TBD | Not started | - |
| 7. Admin Controls | 0/TBD | Not started | - |
| 8. Package Release & Integration Test | 0/TBD | Not started | - |
