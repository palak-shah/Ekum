# Photo viewer — WhatsApp-style shared kit

**Date:** 2026-08-21  
**Status:** Approved  
**Slice:** Explore UX list point **6** (after Select-all float)  
**Anchors:** [media.md](../../features/media.md), [collections.md](../../features/collections.md), [saved.md](../../features/saved.md), [chat.md](../../features/chat.md), [explore.md](../../features/explore.md)

## Problem

Traders need to **see cloth clearly** — zoom, pan, flip photos. Today chat has a basic fullscreen flipper (no pinch). Album/Saved use a Sheet with Prev/Next. Explore design shows a static thumb. No shared viewer.

## Product promise

**Tap a photo → fullscreen viewer. Pinch / double-tap to zoom. Swipe only within this design (or this chat album). Close and you’re back where you were.**

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Scope | One shared kit on chat albums, album/Saved design sheets, Explore design page |
| Swipe set | Photos of **this design** or **this chat album** only — not the whole feed/pack |
| Zoom | Pinch + double-tap; pan when zoomed; **no** +/− buttons |
| Chrome | **View only** — Close + `N / M`. No Save / Order / Ask rates / Share in the viewer |
| Select mode | Tap still **selects**; never opens the viewer |
| Feed / grid tile | Unchanged — opens sheet or product; viewer opens from **photo** on sheet/detail |
| Sheet Prev/Next | **Remove** once viewer swipe exists (one way to flip) |
| Library | In-repo kit — no third-party zoom dependency in v1 |

## Chrome & gestures

```
┌─────────────────────────────┐
│ Close              2 / 5    │
│                             │
│         [ photo ]           │
│                             │
└─────────────────────────────┘
```

- Fullscreen dark scrim; portal to `document.body`.
- **z-index `z-[100]`** — above Sheets (`z-[80]`), shell header/nav, and toasts — so AppShell title / bell never show through. Closing the viewer does **not** dismiss an open sheet underneath.
- Close: Close control, Esc (desktop), or swipe down (when zoom ≈ 1).
- Counter: `N / M` when `urls.length > 1`; for a single photo, omit counter (or show nothing noisy).
- **Zoom ≈ 1:** horizontal swipe → next/prev photo (if more than one).
- **Zoomed:** horizontal/vertical drag → pan; do not change photo.
- Mid-zoom ambiguous drag → treat as **pan** until scale returns near 1.
- Double-tap toggles zoomed / fit; pinch continuous.
- Changing photo index or dismissing **resets** zoom/pan.
- Safe area: Close + counter clear of notch / home indicator; photo not clipped under chrome (BM-07).
- Keyboard: ← → when not zoomed and `urls.length > 1`.

## Entry wiring

| Surface | Open viewer from |
|---------|------------------|
| Chat `PhotoAlbum` | Tap a thumb (replace private fullscreen with shared kit) |
| Album / Saved design sheet | Tap the **main photo** only |
| Explore design page | Tap the hero / design image |
| Select mode (any) | Never |

**Out of slice:** My Catalog edit thumbs, profile logo, continuous-camera zoom, feed-tile → viewer without detail/sheet, cross-design strip, trade CTAs in viewer.

## Kit shape

```ts
PhotoViewer({
  open: boolean;
  urls: string[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
})
```

Pure gesture helpers (unit-tested): when swipe vs pan, double-tap toggle, reset on index change / close.

## Non-goals

- Third-party zoom library  
- Order / Curate / Save / Share inside the viewer  
- Swipe across designs in an album  
- Opening viewer from Explore feed tiles in select or browse without going through detail/sheet  
- `@functional` e2e required for v1 (kit units + chat album open; functional later if smoke exists)

## Tests

| Track | What |
|-------|------|
| Unit | Gesture state: zoom≈1 swipe advances; zoomed drag pans; double-tap; reset on index/close |
| Web / RTL | Open / close / counter; single-url hides counter noise |
| Regression | Chat album still opens fullscreen; select mode does not open viewer |

## Success

A trader on Explore taps Georgette Base’s photo, pinches in, flips to photo 2/3, closes, and the design page (or sheet) is still there with Order / Ask rates unchanged.

## Decision log

| Decision | Choice |
|----------|--------|
| Approach | Shared in-repo `PhotoViewer` |
| Swipe set | Per design / per chat album |
| Zoom | Pinch + double-tap, no buttons |
| Chrome | View only |
| Sheet Prev/Next | Drop after viewer lands |
| z-index | Above Sheets; close viewer ≠ close sheet |
| Select | Never opens viewer |
