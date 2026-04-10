# Feature Suggestion Widget

## What This Is

A framework-agnostic JavaScript library distributed as a private GitHub package, embeddable in any web app. It gives users a place to submit feature suggestions, upvote ideas, comment, and track status updates — and gives admins a way to communicate back through status changes on each suggestion.

## Core Value

Any app that installs this package gets a fully functional feature feedback loop — suggestions, votes, comments, and admin status — without building it from scratch.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Suggestion Submission**
- [ ] Users can submit a suggestion with title, details, and type (New Feature / Feature Update / Bug Report)

**Suggestion Feed**
- [ ] All suggestions are listed in a browsable feed
- [ ] Feed supports sort by: Trending (most comments), Most Voted (most upvotes), Newest
- [ ] Feed supports text search across suggestion titles and details

**Suggestion Detail Dialog**
- [ ] Clicking a suggestion opens a dialog with full details
- [ ] Users can upvote a suggestion (one vote per user per suggestion)
- [ ] Users can comment inside the suggestion dialog

**Admin Controls**
- [ ] Admins (identified by `role: 'admin'` in the user prop) can set a status on any suggestion
- [ ] Status is visible to all users on the suggestion

**Storage Adapters**
- [ ] Unified storage interface with adapters for Supabase and Firebase
- [ ] Consuming app initializes the widget with their chosen adapter config

**Auth Integration**
- [ ] Consuming app passes user object `{ id, name, email, role }` as a prop
- [ ] Widget trusts the passed user — no internal auth logic

**Theming & Branding**
- [ ] Widget ships with a default base layout and styles
- [ ] Accepts a theme config (CSS variables or theme object) for per-app color scheme
- [ ] Accepts a logo prop rendered above an intro tagline ("Let us know how we can improve...")

**Distribution**
- [ ] Published as a private npm package hosted on GitHub Packages

### Out of Scope

- Built-in authentication — consuming app owns login/logout; user is passed in as a prop
- Public npm registry — this is intentionally private, installed via GitHub token
- Backend server — data lives in Supabase or Firebase; no bundled Node/Express server
- Email notifications — out of scope for v1; no alerting on new comments or votes
- Moderation / flagging — no report/flag feature for v1

## Context

- **Multi-app reuse:** The primary driver is avoiding rebuilding this feature for each new product. One install, one config, same UX everywhere.
- **Adapter pattern:** Both Supabase and Firebase are supported via a common storage interface. The consuming app decides which backend to use at init time.
- **Framework-agnostic:** Apps may be built in React, Vue, or plain JS. The library must work across all of them — likely via Web Components or a vanilla JS approach with a thin rendering layer.
- **User prop trust model:** The widget receives `{ id, name, email, role }` from the host app. If `role === 'admin'`, admin controls are shown. No verification — the host app is responsible for access control upstream.

## Constraints

- **Distribution**: Private GitHub package — consumers need a GitHub token with `read:packages` scope configured in their `.npmrc`
- **No bundled backend**: Data must live in Supabase or Firebase — the library is purely client-side
- **Auth**: Library does not manage sessions — consuming app must pass a valid user object or null
- **Framework**: Must work without a specific framework — avoid framework-specific APIs in core

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Adapter pattern for storage | Supabase and Firebase have different APIs — adapters let us support both without forking | — Pending |
| User passed as prop (not managed internally) | Consuming apps already have auth; duplicating it would cause friction and sync issues | — Pending |
| Role-based admin via user prop | Simple, no extra infrastructure; trusts the host app's access control | — Pending |
| Framework-agnostic distribution | Apps vary in framework; Web Components or vanilla JS approach maximizes reach | — Pending |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after initialization*
