# Design — Default Feed/Grid for design browsing

**Date:** 2026-09-12  
**Status:** Implemented  
**Problem:** Album viewer and Saved always open in **Grid**. Traders who prefer **Feed** must flip every visit. There is no remembered personal default. My designs has no Feed/Grid at all.

## Goal

One personal **Feed | Grid** default for design-browsing surfaces. **Ekum default = Feed.** Last in-app choice wins. Can still switch while viewing.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Scope of preference | **One** shared value for all participating surfaces |
| How set | **Last choice wins** (no You settings row) |
| Ekum default when unset | **`feed`** |
| Surfaces in | Album `/collections/:id`, **Saved**, **My designs** (`/catalog`) |
| Surfaces out | Company shop (fixed 2-col), Explore shelves, single design detail |
| Storage | Device `localStorage`, keyed by signed-in **companyId** (same family as home/explore seen) |

## Approach

### Helper

`apps/web/src/lib/designBrowseLayout.ts` (or under `features/browse/`):

- `DesignBrowseLayout = 'feed' | 'grid'`
- `EKUM_DEFAULT_DESIGN_BROWSE_LAYOUT = 'feed'`
- `readDesignBrowseLayout(companyId): DesignBrowseLayout` — missing/invalid → `feed`
- `writeDesignBrowseLayout(companyId, layout)` — persist on toggle

### Surfaces

1. **Collection viewer** — init layout from helper (not hard-coded `grid`). ⋯ Feed/Grid toggle calls `setLayout` **and** `write…`.
2. **Saved** — same; keep existing header pill chrome.
3. **My designs** — add Feed/Grid toggle matching **Saved** header pill language (`Feed` / `Grid`, aria Feed view / Grid view). Apply feed = single-column tall tiles / grid = current 2-col for **both** Designs and Collections tabs. Init + persist via same helper.

Guest / no `companyId`: use Ekum `feed` only; do not write.

### Out of scope

- Company shop Feed/Grid  
- Cross-device sync / settings API  
- URL `?layout=`  
- Changing Explore “Change View” (content type, not layout)

## Acceptance

- Fresh device: album, Saved, My designs open in **Feed**.
- Switch to Grid on any in-scope surface → later opens of the other two start on **Grid**.
- Switch back to Feed → all three start on Feed.
- Company shop unchanged (2-col).
- Toggle still works mid-browse without leaving the page.

## Docs / tests

- Update `collections.md`, `saved.md`, `catalog.md`.
- Unit tests for read/write/default helper.
- Functional or unit: My designs exposes layout control; persistence smoke via unit + localStorage.
