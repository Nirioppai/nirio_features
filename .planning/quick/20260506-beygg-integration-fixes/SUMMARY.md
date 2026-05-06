---
status: complete
slug: beygg-integration-fixes
date: 2026-05-06
version_bumped: 1.2.0 → 1.2.1
commit: 4ea8f4f
---

# Quick Task: Beygg Integration Fixes

Five widget-side issues reported after Beygg smoke testing. All fixed in one patch.

## Problems Fixed

| #   | Problem                                | Fix                                                                                                                                                                                                                                              |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A   | Vote 404 flashes error state in feed   | Dialog renders immediately (optimistic unvoted); comments + vote fetched in parallel via Promise.all. 404→null path was adapter-correct; callers no longer see error state.                                                                      |
| B   | Widget chrome clashes with host layout | `layout.bare` bool prop (default false). Strips header/tagline, removes padding. "New Suggestion" button moves to bare-bar row.                                                                                                                  |
| C   | Form/detail are inline, not modal      | `layout.formMode` defaults to `'modal'`. Form in dialog overlay. Emits `fs:open-form` / `fs:open-detail` composed+cancelable events. Host can preventDefault to use own dialog. Public `submitSuggestion(data)` and `closeForm()` methods added. |
| D   | Filters buried                         | `layout.filterStyle` defaults to `'pill-row'`. Horizontal scrollable pill groups (status + type) above feed. Active pill fills with `--fs-primary-color`.                                                                                        |
| E   | Cards stretch too wide                 | `layout.maxFeedWidth` (default 720px). `layout.mobileBreakpoint` (default 640) + `layout.mobileDialogStyle` (default `'fullscreen'`) for mobile dialog behaviour.                                                                                |

## Files Changed

- `src/types.ts` — added `WidgetLayout` interface
- `src/feed.ts` — added `filterByStatus`, `filterByType`; updated `renderFeedHTML` with filter params and pill-row HTML
- `src/widget.ts` — `_layout`, `_filterStatus`, `_filterType`, `_dialogMode` state; `layout` getter/setter; modal form flow; parallel `openDetail`; filter pill binding; public `submitSuggestion`/`closeForm`
- `src/index.ts` — export `WidgetLayout`
- `package.json` — 1.2.0 → 1.2.1

## Tests

102 unit tests — all pass. No regressions.
