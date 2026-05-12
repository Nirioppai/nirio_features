---
slug: widget-mockup-redesign
date: 2026-05-12
status: in-progress
---

# Quick Task: Widget Mockup Redesign

## Description

Update `@nirioppai/feature-suggestions` to match new desktop and mobile mockup design. 8 targeted changes across `src/types.ts`, `src/feed.ts`, and `src/widget.ts`.

## Changes

1. **Filter pills — count badges** (`src/feed.ts`)
   - Compute status counts and type counts from pre-filter suggestions array
   - Add `<span class="fs-pill-count">· N</span>` to each status/type pill

2. **Desktop card layout — left vote box** (`src/feed.ts`)
   - Replace `renderSuggestionCard` with new row layout: vote-box | card-body | status-badge
   - Add `relativeTime()` helper
   - Vote-box button has `data-vote-id`, `aria-pressed` attrs

3. **Mobile card layout — CSS toggle** (`src/feed.ts`, `src/widget.ts`)
   - Status badge duplicated: `--mobile` inside card-top (shown on mobile), `--desktop` side sibling (shown on desktop)
   - Vote pill in fs-card-meta (mobile only via CSS display:none/flex)
   - Mobile @media overrides: column layout, hide vote-box, show vote-pill

4. **Sort labels — desktop vs mobile** (`src/feed.ts`, `src/widget.ts`)
   - Dual spans in sort buttons: `<span class="fs-desktop-label">` and `<span class="fs-mobile-label">`
   - Desktop: "Most Voted" / "Trending"; Mobile: "Top" / "Hot"
   - CSS: hide mobile label on desktop, hide desktop label on mobile

5. **Result count** (`src/feed.ts`)
   - `<span class="fs-result-count">N result(s)</span>` inside `fs-controls` before sort buttons

6. **Mobile layout — search above filters** (`src/widget.ts` CSS)
   - `fs-controls { order: -1 }` on mobile so search appears before filter pills

7. **Mobile fixed FAB** (`src/widget.ts`)
   - `<button class="fs-fab-mobile" id="fs-fab-mobile">+</button>` appended to shell when `bare: true`
   - CSS: `position: fixed; bottom: 24px; right: 24px; display: none;`
   - Shown via `@media (max-width: {mobileBreakpoint}px) { display: flex; }`
   - Click wired to same form-open handler as `#fs-new-btn`

8. **WidgetLayout title + subtitle props** (`src/types.ts`, `src/widget.ts`)
   - Add `title?: string` and `subtitle?: string` to `WidgetLayout`
   - Replace `fs-bare-bar` with `fs-toolbar` layout when `bare: true`
   - Desktop: space-between row with left (h1+p) and right (+ New Suggestion button)
   - Mobile: same row but button becomes compact square via CSS

## Files Modified

- `src/types.ts`
- `src/feed.ts`
- `src/widget.ts`
- `src/feed.test.ts` (update test for new card vote HTML)
