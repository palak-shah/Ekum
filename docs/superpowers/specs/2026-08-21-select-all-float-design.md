# Select all — floating chrome as soon as selection starts

**Date:** 2026-08-21  
**Status:** Approved  
**Slice:** 1 of Explore UX list (photo viewer is **6**, separate spec)  
**Anchors:** [2026-08-19-browse-select-curate-order-design.md](./2026-08-19-browse-select-curate-order-design.md), [collections.md](../../features/collections.md), [saved.md](../../features/saved.md), [catalog.md](../../features/catalog.md), [chat.md](../../features/chat.md)

## Problem

Select all / Clear sit **after** the list (album: under the grid; My Catalog / chat: extra row on the bottom dock). A trader who has already selected designs never sees the control without scrolling past content they already passed. WhatsApp keeps Select all in view the moment multi-select starts.

## Product promise

**The instant you start selecting, Select all (or Clear) is on screen — you never hunt under the last tile.**

## Chrome

Keep the existing title / search / Save / Share / Grid / Select pill. Do **not** replace the page header.

As soon as **select mode is on** (header **Select**, or first long-press), a **thin row** is **sticky under `PageHeader` in the page column** (not a `fixed` body portal):

```
[ N selected                         Select all ]
```

| State | Right action |
|-------|----------------|
| Not every item on **this list** is selected | **Select all** |
| Every item on **this list** is selected (list non-empty) | **Clear** |

- Shows at **0 selected** (tapped Select, nothing ticked yet).
- Stays pinned under the header while the list scrolls (in-flow sticky, host contains the float).
- One kit piece (`SelectAllFloat` + `selectAllState(visibleIds, selectedIds)`). Not a per-screen one-off.

### Bottom dock

Actions only: Order / Curate / Save / Share / Publish / Archive / Forward (as today per surface).

Drop **Select all**, **Clear all**, and the extra count row from the bottom dock. Count lives on the float. Existing **Clear** on Explore’s album dock stays (Explore has no Select all — see below).

**Selecting** pill on album / Saved / shop: **Cancel** when count is 0 (exit select mode); when count > 0 it **clears the shortlist** (same as today’s traveling pick). Chat **Cancel** unchanged. The float is not a second Cancel.

## What “this list” means

Select all / float **Clear** are **page-local**. They do **not** wipe traveling shortlist members from other screens (same rule as the 2026-08-19 browse-select design).

| Surface | Visible ids | Select all | Float Clear |
|---------|-------------|------------|-------------|
| Album (collection viewer) | Designs in this album | Add them to the shortlist | Remove **this album’s** designs from the shortlist |
| Saved | Saved **designs** only (albums still open to pick inside) | Add those product ids | Remove those product ids |
| Shop · Designs | Published designs on this shop | Add them | Remove them |
| My Catalog | Tiles on the **current filter** | Select those ids | Unselect those ids |
| Chat (forward select) | Forwardable messages in this thread | Select those message ids | Unselect those message ids |
| **Explore feed** | — | **No Select all.** Endless mix. Long-press only. **No float** — count stays on `AlbumSelectBar` | Explore dock **Clear** still clears the traveling pick |

Empty list: hide the float (nothing to select).

## Layout / BM-07

- Float height ~ one compact row (same type as current count row).
- `top` sits below `PageHeader` / Explore search — never under the status bar, never over the first tile.
- Scroll body gets **top** padding for the float **and** existing **bottom** padding for nav + action dock. Last and first tiles stay fully readable.
- Hide the visual scrollbar on this chrome (platform list already uses hidden rails where we can). Do not add a new scrollbar on the float.

## Copy

- Count: `N selected` (same voice as today).
- Actions: **Select all** / **Clear**. Not “Select all on this album.”

## Non-goals

- Photo viewer / pinch zoom (point **6** — next spec)
- Sticky Explore search, section title rewrite, feed/grid Profile default (points 2–4)
- Select all on Explore
- Header-replace WhatsApp chrome (rejected in favour of float)
- Changing traveling-shortlist lifetime, Order / Curate / Share verbs, or who may select

## Tests

| Track | What |
|-------|------|
| Unit | `selectAllState`: none / some / all / empty list; Clear removes only visible ids |
| Web | Album / Saved / catalog: float visible as soon as select mode is on, including 0 selected |
| Functional (when e2e exists) | Album: Select → Select all → all ticks → slot reads Clear → Clear leaves other-album shortlist members |

## Success

A first-time buyer on an album taps **Select** and sees **Select all** without scrolling. After Select all, **Clear** is in the same spot. Explore does not grow a fake Select all.
