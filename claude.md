# Claude Context: Feature Suggestion Widget

## Project Overview

A framework-agnostic JavaScript library distributed as a private GitHub package, embeddable in any web app. It gives users a place to submit feature suggestions, upvote ideas, comment, and track status updates — and gives admins a way to communicate back through status changes on each suggestion.

**Primary driver:** Avoid rebuilding this feature for each new product. One install, one config, same UX everywhere.

**Last updated:** 2026-04-10

---

## Key Files

| File | Purpose |
|------|---------|
| `.planning/PROJECT.md` | Full requirements, constraints, decisions, and core value definition |
| `.planning/ROADMAP.md` | All 8 phases, goals, dependencies, and success criteria |
| `.planning/UPDATES.md` | Changelog — updated as phases are completed or changed |

---

## Core Requirements

### Suggestion Submission
- Users can submit a suggestion with title, details, and type (New Feature / Feature Update / Bug Report)

### Suggestion Feed
- All suggestions are listed in a browsable feed
- Feed supports sort by: Trending (most comments), Most Voted (most upvotes), Newest
- Feed supports text search across suggestion titles and details

### Suggestion Detail Dialog
- Clicking a suggestion opens a dialog with full details
- Users can upvote a suggestion (one vote per user per suggestion)
- Users can comment inside the suggestion dialog

### Admin Controls
- Admins (identified by `role: 'admin'` in the user prop) can set a status on any suggestion
- Status is visible to all users on the suggestion

### Storage Adapters
- Unified storage interface with adapters for Supabase and Firebase
- Consuming app initializes the widget with their chosen adapter config

### Auth Integration
- Consuming app passes user object `{ id, name, email, role }` as a prop
- Widget trusts the passed user — no internal auth logic

### Theming & Branding
- Widget ships with a default base layout and styles
- Accepts a theme config (CSS variables or theme object) for per-app color scheme
- Accepts a logo prop rendered above an intro tagline ("Let us know how we can improve...")

### Distribution
- Published as a private npm package hosted on GitHub Packages

---

## Out of Scope

- Built-in authentication — consuming app owns login/logout; user is passed in as a prop
- Public npm registry — this is intentionally private, installed via GitHub token
- Backend server — data lives in Supabase or Firebase; no bundled Node/Express server
- Email notifications — out of scope for v1
- Moderation / flagging — no report/flag feature for v1

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Adapter pattern for storage | Supabase and Firebase have different APIs — adapters let us support both without forking |
| User passed as prop (not managed internally) | Consuming apps already have auth; duplicating it would cause friction and sync issues |
| Role-based admin via user prop | Simple, no extra infrastructure; trusts the host app's access control |
| Framework-agnostic distribution | Apps vary in framework; Web Components or vanilla JS approach maximizes reach |

---

## Constraints

- **Distribution**: Private GitHub package — consumers need a GitHub token with `read:packages` scope configured in their `.npmrc`
- **No bundled backend**: Data must live in Supabase or Firebase — the library is purely client-side
- **Auth**: Library does not manage sessions — consuming app must pass a valid user object or null
- **Framework**: Must work without a specific framework — avoid framework-specific APIs in core

---

## Roadmap

**Overview:** Build a framework-agnostic Web Components library distributed as a private GitHub package. Consuming apps embed `<feature-suggestions>` to give users a complete suggestion feedback loop — submit, upvote, comment, and track status — with Firebase as the storage backend (Supabase in v1.1).

### Phase 1: Package Scaffold
**Goal:** A publishable, installable (empty) package on GitHub Packages with correct build output — CJS + ESM bundles, strict TypeScript, and a tag-based publish workflow.
**Depends on:** Nothing (first phase)
**Success Criteria:**
1. `npm pack` produces a valid tarball with `dist/index.cjs.js`, `dist/index.esm.js`, and `.d.ts` typings
2. TypeScript compiles with `strict: true` and zero errors
3. GitHub Actions workflow triggers on version tag push and publishes to GitHub Packages
4. A consumer can install the package with a `.npmrc` GitHub token and import it without errors
**Status:** Not started

### Phase 2: Storage Adapter Interface
**Goal:** A typed `StorageAdapter` interface and a working `FirebaseAdapter` so the rest of the widget calls one interface regardless of backend.
**Depends on:** Phase 1
**Success Criteria:**
1. `StorageAdapter` interface is defined in TypeScript with methods for suggestions, votes, comments, and status
2. `FirebaseAdapter` implements every method in the interface
3. Adapter is initialized via a factory function passed to the widget init
4. Unit tests pass for all adapter contract methods
**Status:** Not started

### Phase 3: Core Widget Shell
**Goal:** A `<feature-suggestions>` custom element that mounts, accepts `user`, `theme`, and `logo` props, and scopes default styles via shadow DOM.
**Depends on:** Phase 1
**Success Criteria:**
1. `customElements.define('feature-suggestions', ...)` registers without errors in a plain HTML page
2. `user` attribute/property accepts `{ id, name, email, role }` and exposes it internally
3. CSS custom properties for primary color, background, and font apply correctly
4. `logo` prop renders above the intro tagline "Let us know how we can improve..."
**Status:** Not started

### Phase 4: Suggestion Feed
**Goal:** The main feed view renders all suggestions from the adapter with sort and text search working.
**Depends on:** Phase 2, Phase 3
**Success Criteria:**
1. All suggestions from the adapter render as cards in the feed
2. Switching sort to Trending, Most Voted, or Newest reorders the feed correctly
3. Typing in the search field filters suggestions by title and details in real time
4. Empty state and loading state render without errors
**Status:** Not started

### Phase 5: Suggestion Submission
**Goal:** Users can open a submission form, fill in title, details, and type, and persist the suggestion via the adapter.
**Depends on:** Phase 4
**Success Criteria:**
1. Submission form renders with title (required), details (optional), and type selector
2. Submitting without a title shows a validation error and does not write to the adapter
3. Valid submission writes to the adapter and appears in the feed without a full page reload
**Status:** Not started

### Phase 6: Detail Dialog + Voting + Comments
**Goal:** Clicking a suggestion opens a dialog with full details, an upvote button (one per user), and a live comment thread.
**Depends on:** Phase 4
**Success Criteria:**
1. Clicking a suggestion card opens a dialog displaying the full title, details, type, and status
2. Upvote button increments the count; clicking again decrements (one vote per user per suggestion)
3. Comment form submits a comment that immediately appears in the thread
4. Dialog closes without errors when dismissed
**Status:** Not started

### Phase 7: Admin Controls
**Goal:** Users with `role: 'admin'` can set a status on any suggestion; status badge is visible to all users.
**Depends on:** Phase 6
**Success Criteria:**
1. Status selector (Under Review / Planned / In Progress / Completed / Declined) is visible only when `user.role === 'admin'`
2. Selecting a status persists it via the adapter
3. Status badge renders on both the suggestion card and the detail dialog for all users
4. Non-admin users see the badge but not the selector
**Status:** Not started

### Phase 8: Package Release & Integration Test
**Goal:** Package is live on GitHub Packages as v1.0.0, installable, and verified working end-to-end in the consuming app.
**Depends on:** Phase 7
**Success Criteria:**
1. `npm install @org/feature-suggestions` succeeds in the consuming app with a GitHub `.npmrc` token
2. Widget initializes with a Firebase config and a user prop without console errors
3. All Phase 1–7 features work end-to-end in the consuming app
**Status:** Not started

---

## Progress

| Phase | Status | Completed |
|-------|--------|-----------|
| 1. Package Scaffold | Not started | - |
| 2. Storage Adapter Interface | Not started | - |
| 3. Core Widget Shell | Not started | - |
| 4. Suggestion Feed | Not started | - |
| 5. Suggestion Submission | Not started | - |
| 6. Detail Dialog + Voting + Comments | Not started | - |
| 7. Admin Controls | Not started | - |
| 8. Package Release & Integration Test | Not started | - |

---

## Updates

See [.planning/UPDATES.md](.planning/UPDATES.md) for the full changelog. Updates are appended there as phases are completed or requirements change.
