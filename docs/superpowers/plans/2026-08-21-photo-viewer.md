# Photo viewer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a shared WhatsApp-style `PhotoViewer` (pinch / double-tap zoom, swipe within one design or chat album) on chat albums, album/Saved design sheets, and Explore design page.

**Architecture:** Pure `photoViewerGesture` helpers decide swipe vs pan vs dismiss. `PhotoViewer` portals fullscreen above Sheets (`z-[85]`; Sheet is `z-[80]`). Call sites pass `urls` + `index`; no trade CTAs in the viewer. Sheet Prev/Next removed once swipe exists.

**Tech Stack:** React 19, Vitest, Testing Library, in-repo only (no third-party zoom lib).

**Spec:** [docs/superpowers/specs/2026-08-21-photo-viewer-design.md](../specs/2026-08-21-photo-viewer-design.md)  
**Completeness:** [docs/superpowers/reviews/completeness/2026-08-21-photo-viewer-completeness.md](../reviews/completeness/2026-08-21-photo-viewer-completeness.md)

## Global Constraints

- Shared kit on chat albums, album/Saved design sheets, Explore design page only.
- Swipe set = photos of **this design** or **this chat album** — not the whole feed.
- Pinch + double-tap zoom; pan when zoomed; **no** +/− buttons.
- Chrome: **Close** + `N / M` when `urls.length > 1` only. No Save / Order / Ask rates / Share.
- Select mode: never open the viewer.
- Feed / grid tile: unchanged; viewer from **main photo** on sheet/detail.
- Drop sheet Prev/Next after viewer lands.
- Portal `z-[85]` (above Sheet `z-[80]`); closing viewer does **not** close the sheet.
- Mid-zoom drag → **pan** until scale ≈ 1 (`ZOOM_NEAR_1`).
- Reset zoom/pan on index change or close.
- Safe area for Close / counter (BM-07).
- No third-party zoom library. No API changes.

## File map

| Area | Files |
|------|--------|
| Gesture helpers | Create `apps/web/src/ui/photoViewerGesture.ts` + `photoViewerGesture.spec.ts` |
| Kit | Create `apps/web/src/ui/PhotoViewer.tsx` + `PhotoViewer.spec.tsx` |
| Chat | Modify `apps/web/src/features/chats/PhotoAlbum.tsx` |
| Album | Modify `apps/web/src/features/collections/CollectionViewerPage.tsx` (`ProductPhotosSheet`) |
| Saved | Modify `apps/web/src/features/saved/SavedPage.tsx` (`SavedPhotosSheet`) |
| Explore | Modify `apps/web/src/features/explore/ExploreProductPage.tsx` |
| Docs | `media.md`, `chat.md`, `collections.md`, `saved.md`, `explore.md`; gap matrix |

---

### Task 1: `photoViewerGesture` helpers

**Files:**
- Create: `apps/web/src/ui/photoViewerGesture.ts`
- Test: `apps/web/src/ui/photoViewerGesture.spec.ts`

**Interfaces:**
- Produces:

```ts
export const ZOOM_NEAR_1 = 1.05;
export const SWIPE_PX = 50;
export const DOUBLE_TAP_SCALE = 2.5;

export type DragIntent = 'pan' | 'swipe-next' | 'swipe-prev' | 'swipe-down' | 'none';

export function isNearFit(scale: number): boolean;

export function classifyDrag(input: {
  scale: number;
  dx: number;
  dy: number;
  urlCount: number;
}): DragIntent;

export function nextIndex(index: number, urlCount: number, intent: 'swipe-next' | 'swipe-prev'): number;

export function doubleTapScale(currentScale: number): number;
```

- [ ] **Step 1: Write the failing spec**

```ts
import { describe, expect, it } from 'vitest';
import {
  ZOOM_NEAR_1,
  classifyDrag,
  doubleTapScale,
  isNearFit,
  nextIndex,
} from './photoViewerGesture';

describe('isNearFit', () => {
  it('treats scale at or below ZOOM_NEAR_1 as fit', () => {
    expect(isNearFit(1)).toBe(true);
    expect(isNearFit(ZOOM_NEAR_1)).toBe(true);
    expect(isNearFit(ZOOM_NEAR_1 + 0.01)).toBe(false);
  });
});

describe('classifyDrag', () => {
  it('pans when zoomed even if horizontal dominates', () => {
    expect(classifyDrag({ scale: 2, dx: 80, dy: 10, urlCount: 3 })).toBe('pan');
  });

  it('swipes next/prev when near fit and horizontal wins', () => {
    expect(classifyDrag({ scale: 1, dx: -80, dy: 10, urlCount: 3 })).toBe('swipe-next');
    expect(classifyDrag({ scale: 1, dx: 80, dy: 10, urlCount: 3 })).toBe('swipe-prev');
  });

  it('swipes down when near fit and vertical dominates', () => {
    expect(classifyDrag({ scale: 1, dx: 10, dy: 80, urlCount: 3 })).toBe('swipe-down');
  });

  it('does not change photo when only one url', () => {
    expect(classifyDrag({ scale: 1, dx: -80, dy: 0, urlCount: 1 })).toBe('none');
  });
});

describe('nextIndex', () => {
  it('clamps at ends', () => {
    expect(nextIndex(0, 3, 'swipe-prev')).toBe(0);
    expect(nextIndex(2, 3, 'swipe-next')).toBe(2);
    expect(nextIndex(1, 3, 'swipe-next')).toBe(2);
  });
});

describe('doubleTapScale', () => {
  it('zooms in from fit and back to fit when zoomed', () => {
    expect(doubleTapScale(1)).toBeGreaterThan(1);
    expect(doubleTapScale(2.5)).toBe(1);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm --filter @ekum/web test -- src/ui/photoViewerGesture.spec.ts`  
Expected: FAIL (module missing).

- [ ] **Step 3: Implement**

```ts
export const ZOOM_NEAR_1 = 1.05;
export const SWIPE_PX = 50;
export const DOUBLE_TAP_SCALE = 2.5;

export type DragIntent = 'pan' | 'swipe-next' | 'swipe-prev' | 'swipe-down' | 'none';

export function isNearFit(scale: number): boolean {
  return scale <= ZOOM_NEAR_1;
}

export function classifyDrag(input: {
  scale: number;
  dx: number;
  dy: number;
  urlCount: number;
}): DragIntent {
  const { scale, dx, dy, urlCount } = input;
  if (!isNearFit(scale)) return 'pan';
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax < SWIPE_PX && ay < SWIPE_PX) return 'none';
  if (ay >= ax && dy > 0) return 'swipe-down';
  if (urlCount < 2) return 'none';
  if (ax >= ay) return dx < 0 ? 'swipe-next' : 'swipe-prev';
  return 'none';
}

export function nextIndex(
  index: number,
  urlCount: number,
  intent: 'swipe-next' | 'swipe-prev',
): number {
  if (urlCount < 1) return 0;
  if (intent === 'swipe-next') return Math.min(urlCount - 1, index + 1);
  return Math.max(0, index - 1);
}

export function doubleTapScale(currentScale: number): number {
  return isNearFit(currentScale) ? DOUBLE_TAP_SCALE : 1;
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `pnpm --filter @ekum/web test -- src/ui/photoViewerGesture.spec.ts`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/ui/photoViewerGesture.ts apps/web/src/ui/photoViewerGesture.spec.ts
git commit -m "test: photo viewer gesture helpers"
```

---

### Task 2: `PhotoViewer` kit

**Files:**
- Create: `apps/web/src/ui/PhotoViewer.tsx`
- Test: `apps/web/src/ui/PhotoViewer.spec.tsx`

**Interfaces:**
- Consumes: gesture helpers from `./photoViewerGesture`
- Produces:

```ts
export function PhotoViewer(props: {
  open: boolean;
  urls: string[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}): JSX.Element | null;
```

- Portal to `document.body`, `data-testid="photo-viewer"`, `z-[85]`, `role="dialog"`, `aria-modal`, `aria-label="Photo viewer"`.
- Close button `data-testid="photo-viewer-close"`; counter `data-testid="photo-viewer-counter"` only when `urls.length > 1`.
- Esc closes; ← → call `onIndex` when near fit and multiple urls.
- Touch: track pointers for pinch + drag; on pointer-up run `classifyDrag` / `doubleTapScale`; reset transform when `index` changes or `open` becomes false.
- Image: `object-contain`, transform `translate(pan) scale(scale)`.

- [ ] **Step 1: Write failing RTL**

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhotoViewer } from './PhotoViewer';

afterEach(() => cleanup());

describe('PhotoViewer', () => {
  it('renders nothing when closed', () => {
    render(
      <PhotoViewer open={false} urls={['a.jpg']} index={0} onIndex={() => {}} onClose={() => {}} />,
    );
    expect(screen.queryByTestId('photo-viewer')).toBeNull();
  });

  it('hides counter for a single photo', () => {
    render(
      <PhotoViewer open urls={['a.jpg']} index={0} onIndex={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByTestId('photo-viewer')).toBeTruthy();
    expect(screen.queryByTestId('photo-viewer-counter')).toBeNull();
  });

  it('shows N / M and closes', async () => {
    const onClose = vi.fn();
    render(
      <PhotoViewer
        open
        urls={['a.jpg', 'b.jpg']}
        index={0}
        onIndex={() => {}}
        onClose={onClose}
      />,
    );
    expect(screen.getByTestId('photo-viewer-counter')).toHaveTextContent('1 / 2');
    await userEvent.click(screen.getByTestId('photo-viewer-close'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm --filter @ekum/web test -- src/ui/PhotoViewer.spec.tsx`

- [ ] **Step 3: Implement `PhotoViewer.tsx`**

Minimal faithful implementation:

- Early return if `!open` or `urls.length === 0`.
- `safeIndex = clamp(index)`.
- State: `scale`, `panX`, `panY`; reset in `useEffect` when `open` / `safeIndex` changes.
- Header: Close (left) · counter (center, if `urls.length > 1`) · spacer.
- Body: touch handlers — for v1 prefer pointer events:
  - Track last tap time for double-tap → `setScale(doubleTapScale(scale)); setPan(0,0)` if zooming out.
  - One-finger drag end → `classifyDrag` → `onIndex(nextIndex(...))` or `onClose()` for swipe-down; if `pan`, update pan while zoomed during move.
  - Two-finger pinch: update scale from distance ratio (clamp e.g. 1..4).
- `createPortal(..., document.body)` with `className="fixed inset-0 z-[85] flex flex-col bg-ink/92"` and safe-area padding on the header (`pt-[max(0.75rem,env(safe-area-inset-top))]`).
- Keyboard `useEffect` for Esc / arrows when `open`.

Keep the component under ~200 lines; push math to helpers.

- [ ] **Step 4: Run — expect PASS**

Run: `pnpm --filter @ekum/web test -- src/ui/PhotoViewer.spec.tsx src/ui/photoViewerGesture.spec.ts`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/ui/PhotoViewer.tsx apps/web/src/ui/PhotoViewer.spec.tsx
git commit -m "feat: shared PhotoViewer kit"
```

---

### Task 3: Chat `PhotoAlbum`

**Files:**
- Modify: `apps/web/src/features/chats/PhotoAlbum.tsx`

**Interfaces:**
- Consumes: `PhotoViewer` from `@/ui/PhotoViewer`
- Remove the private fullscreen block (lines ~154–198); keep thumb grid + `viewerIndex` state.

- [ ] **Step 1: Replace private viewer**

```tsx
import { PhotoViewer } from '@/ui/PhotoViewer';

// after the grid:
<PhotoViewer
  open={viewerIndex !== null}
  urls={clean}
  index={viewerIndex ?? 0}
  onIndex={setViewerIndex}
  onClose={() => setViewerIndex(null)}
/>
```

Remove local Prev/Next buttons and the old `fixed inset-0 z-50` dialog. Keep keyboard handling only if still needed — `PhotoViewer` owns Esc/arrows.

- [ ] **Step 2: Run units**

Run: `pnpm --filter @ekum/web test -- src/ui/PhotoViewer.spec.tsx src/features/chats/chatMessageActions.spec.ts`

- [ ] **Step 3: Docs**

In `docs/features/chat.md` Message types / media line: chat photo albums open the shared **PhotoViewer** (pinch / swipe within that album).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/chats/PhotoAlbum.tsx docs/features/chat.md
git commit -m "feat: chat albums use shared PhotoViewer"
```

---

### Task 4: Album + Saved design sheets

**Files:**
- Modify: `apps/web/src/features/collections/CollectionViewerPage.tsx` (`ProductPhotosSheet`)
- Modify: `apps/web/src/features/saved/SavedPage.tsx` (`SavedPhotosSheet`)
- Modify: `docs/features/collections.md`, `docs/features/saved.md`

**Interfaces:**
- Local state `lightboxOpen` (or reuse: when sheet open, tap photo sets `photoOpen=true`).
- `PhotoViewer` with sheet’s `urls` / `index` / `onIndex`; `onClose` only closes viewer.

- [ ] **Step 1: ProductPhotosSheet**

Inside `ProductPhotosSheet`:

```tsx
const [photoOpen, setPhotoOpen] = useState(false);
// main img:
<button type="button" className="..." onClick={() => setPhotoOpen(true)}>
  <img ... />
</button>
// remove Prev/Next block
<PhotoViewer
  open={photoOpen && urls.length > 0}
  urls={urls}
  index={safeIndex}
  onIndex={onIndex}
  onClose={() => setPhotoOpen(false)}
/>
```

When sheet closes (`product` null), ensure `photoOpen` resets (`useEffect` or set false in parent `onClose`).

- [ ] **Step 2: SavedPhotosSheet**

Same pattern for Saved product photos. Keep Save / Remove / Order link on the sheet.

- [ ] **Step 3: Docs**

- `collections.md` buyer view: tap design photo → PhotoViewer (pinch/swipe this design).  
- `saved.md`: same for saved design sheet.

- [ ] **Step 4: Run**

Run: `pnpm --filter @ekum/web test -- src/ui src/features/saved/savedAlbumCount.spec.ts`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/collections/CollectionViewerPage.tsx apps/web/src/features/saved/SavedPage.tsx docs/features/collections.md docs/features/saved.md
git commit -m "feat: album and Saved sheets open PhotoViewer"
```

---

### Task 5: Explore design page

**Files:**
- Modify: `apps/web/src/features/explore/ExploreProductPage.tsx`
- Modify: `docs/features/explore.md`, `docs/features/media.md`
- Modify: `docs/superpowers/reviews/feature-gap-matrix.md`

**Interfaces:**
- State `photoIndex` + `photoOpen`; tap image `i` → open at `i`.
- `PhotoViewer` over `data.images`.

- [ ] **Step 1: Wire hero strip**

```tsx
const [photoOpen, setPhotoOpen] = useState(false);
const [photoIndex, setPhotoIndex] = useState(0);
// each img:
<button type="button" onClick={() => { setPhotoIndex(i); setPhotoOpen(true); }}>
  <img ... />
</button>
<PhotoViewer
  open={photoOpen && data.images.length > 0}
  urls={data.images}
  index={photoIndex}
  onIndex={setPhotoIndex}
  onClose={() => setPhotoOpen(false)}
/>
```

Do **not** change Order / Ask rates / Curate dock.

- [ ] **Step 2: Docs + gap matrix**

- `explore.md`: tap design photos → PhotoViewer.  
- `media.md`: shared PhotoViewer for chat / catalog / Explore design.  
- Gap matrix: Media / Shared WhatsApp-style photo viewer → **Works** / **Unit**.

- [ ] **Step 3: Typecheck + units**

Run: `pnpm --filter @ekum/web test -- src/ui`  
Run: `pnpm --filter @ekum/web typecheck`  
Expected: PASS (fix only unrelated unused imports if they block and are one-line).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/explore/ExploreProductPage.tsx docs/features/explore.md docs/features/media.md docs/superpowers/reviews/feature-gap-matrix.md
git commit -m "feat: Explore design PhotoViewer"
```

---

## Self-review (spec coverage)

| Spec rule | Task |
|-----------|------|
| Shared kit | 2 |
| Pinch / double-tap / pan / swipe rules | 1, 2 |
| View-only chrome | 2 |
| Chat / sheets / Explore | 3, 4, 5 |
| Drop sheet Prev/Next | 4 |
| z above Sheet | 2 (`z-[85]`) |
| Select never opens | unchanged (tiles still select; sheets not in select path) |
| No third-party lib | all |
| Units | 1, 2 |

No placeholders. Select-mode Explore exit bug is **out of this plan** (already fixed separately if landed).
