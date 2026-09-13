# Explore long-press select stays Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Long-press on Explore pack/design selects and **stays** selected on Android (no flash-off).

**Architecture:** (1) Harden `useLongPress` with a module-level post-fire suppress window so ghost clicks after remount cannot activate. (2) Collapse dual media buttons in Explore opportunity cards (and `DesignTile`) into one stable press surface so select-mode entry does not remount the control.

**Tech Stack:** React, Vitest Testing Library, existing Selection stores unchanged.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-12-explore-longpress-select-stays-design.md`
- Completeness Proceed: `docs/superpowers/reviews/completeness/2026-09-12-explore-longpress-select-stays-completeness.md`
- Approach **A** only — no Explore Select chrome
- Suppress window ~300–500ms after long-press fire
- Commit only when the user asks
- Keep `LONG_PRESS_SURFACE_CLASS` / iOS callout behaviour

---

## File map

| File | Responsibility |
|------|----------------|
| `apps/web/src/ui/useLongPress.ts` | Module-level suppress after fire; click swallow |
| `apps/web/src/ui/useLongPress.spec.tsx` | Ghost click after “remount” / delayed click |
| `apps/web/src/ui/cards.tsx` | One media button for OpportunityCollectionCard, OpportunityDesignCard, DesignTile |
| `docs/features/explore.md` | One line: long-press must stick (Android ghost-click) |
| `docs/superpowers/reviews/feature-gap-matrix.md` | Note reliability fix if Explore select row exists |

---

### Task 1: Harden `useLongPress`

**Files:**
- Modify: `apps/web/src/ui/useLongPress.ts`
- Modify: `apps/web/src/ui/useLongPress.spec.tsx`

**Interfaces:**
- Produces: `useLongPress(onLongPress?: () => void, ms?: number)` — same return shape; internal module suppress ~400ms after fire

- [ ] **Step 1: Failing test — suppress survives “remount”**

Add to `useLongPress.spec.tsx`:

```tsx
it('suppresses click after long-press even if the surface remounts', () => {
  const onLong = vi.fn();
  const onClick = vi.fn();
  const { getByTestId, rerender } = render(
    <div onClick={onClick}>
      <Probe key="a" onLong={onLong} />
    </div>,
  );
  const surface = getByTestId('surface');
  fireEvent.pointerDown(surface);
  vi.advanceTimersByTime(50);
  expect(onLong).toHaveBeenCalledTimes(1);
  fireEvent.pointerUp(surface);
  // Simulate select-mode re-render swapping the button (new hook instance).
  rerender(
    <div onClick={onClick}>
      <Probe key="b" onLong={onLong} />
    </div>,
  );
  fireEvent.click(getByTestId('surface'));
  expect(onClick).not.toHaveBeenCalled();
});
```

Keep existing “swallows the following click” test.

- [ ] **Step 2: Run — expect FAIL** (no module suppress yet)

```bash
pnpm --filter @ekum/web test -- useLongPress.spec --run
```

- [ ] **Step 3: Implement module-level suppress**

In `useLongPress.ts`:

```ts
import { useRef, type MouseEvent } from 'react';

export const LONG_PRESS_SURFACE_CLASS = 'ekum-long-press-surface';

/** After a long-press fires, ignore activate clicks briefly (survives remount). */
const SUPPRESS_MS = 400;
let suppressClicksUntil = 0;

function markLongPressFired() {
  suppressClicksUntil = Date.now() + SUPPRESS_MS;
}

function shouldSuppressClick() {
  return Date.now() < suppressClicksUntil;
}

export function useLongPress(onLongPress?: () => void, ms = 420) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);
  const clear = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
    }
    timer.current = null;
  };
  return {
    onPointerDown: () => {
      if (!onLongPress) return;
      fired.current = false;
      clear();
      timer.current = window.setTimeout(() => {
        timer.current = null;
        fired.current = true;
        markLongPressFired();
        onLongPress();
      }, ms);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (event: MouseEvent) => {
      if (!onLongPress) return;
      event.preventDefault();
      fired.current = true;
      markLongPressFired();
      onLongPress();
    },
    onClickCapture: (event: MouseEvent) => {
      if (!fired.current && !shouldSuppressClick()) return;
      fired.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
```

- [ ] **Step 4: Run — PASS**

```bash
pnpm --filter @ekum/web test -- useLongPress.spec --run
```

---

### Task 2: Stable Explore card press surfaces

**Files:**
- Modify: `apps/web/src/ui/cards.tsx` (`OpportunityCollectionCard`, `OpportunityDesignCard`, `DesignTile`)

**Interfaces:**
- Consumes: hardened `useLongPress`
- Produces: one media `<button>` per card; `onClick` = toggle when selecting else open; checkmark when `selectMode`

- [ ] **Step 1: OpportunityCollectionCard — single media button**

Replace the `{open ? <button…> : <button…>}` media pair with one button:

```tsx
const onMediaClick = open ?? openAlbum;
// ...
<button
  type="button"
  className={cx('relative block w-full px-3 text-left', LONG_PRESS_SURFACE_CLASS)}
  onClick={onMediaClick}
  {...longPress}
>
  <AlbumGrid … />
  {selectMode ? (
    <span className={cx('absolute left-5 top-2 …', selected ? 'border-accent bg-accent' : '…')}>
      <CheckIcon width={14} height={14} />
    </span>
  ) : null}
</button>
```

Keep title row as today (can stay dual or also unify to `onClick={open ?? openAlbum}` without remounting identity — prefer one title button with stable props too).

- [ ] **Step 2: Same for OpportunityDesignCard and DesignTile**

`DesignTile`: remove `if (selecting) return <button…>; return <button…>;` — one button, `onClick={selecting ? onToggleSelect : openDesign}`, checkmark already inside `body`.

- [ ] **Step 3: Run web units that touch cards / long-press**

```bash
pnpm --filter @ekum/web test -- useLongPress.spec --run
```

If a card spec exists, run it too. Manually: Android or Chrome device mode — long-press Explore pack → stays selected.

---

### Task 3: Docs + gap matrix

**Files:**
- Modify: `docs/features/explore.md` (album/design long-press bullet)
- Modify: `docs/superpowers/reviews/feature-gap-matrix.md` (short note on Explore select stickiness / Completeness 2026-09-12)

- [ ] **Step 1:** After the existing Safari non-link sentence, add: long-press select must **stick** on Android (ghost click after select-mode update must not toggle off).

- [ ] **Step 2:** Gap matrix — if there is an Explore long-press / select reliability note, point to this Completeness; else leave Works rows as-is with a footnote on the select preserve-types line.

---

## Verification (done criteria)

- [ ] `useLongPress` remount/suppress unit PASS  
- [ ] Opportunity cards / DesignTile no dual media button swap  
- [ ] Manual or device: long-press Explore → selection stays  
- [ ] explore.md updated  

## Notes

- Do **not** add Explore Select chrome in this slice.  
- Saved / My Catalog: only change if they use the same dual-button swap; otherwise leave for a follow-up.
