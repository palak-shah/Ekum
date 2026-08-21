# Select all float — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show **Select all** / **Clear** in a floating row the instant select mode starts, on every bounded select list (not Explore).

**Architecture:** Pure `selectAllState` / `nextIdSet` decide the label and the next id set (page-local). One portal `SelectAllFloat` sits `fixed` under existing sticky chrome. Album / Saved / shop use the traveling shortlist (`addMany` / `removeIds`). My Catalog and chat use local `Set`s via `nextIdSet`. Bottom docks keep verbs only. Explore `AlbumSelectBar` is unchanged (no Select all).

**Tech Stack:** React 19, Vitest, Testing Library, existing browse shortlist + kit.

**Spec:** [docs/superpowers/specs/2026-08-21-select-all-float-design.md](../specs/2026-08-21-select-all-float-design.md)  
**Completeness:** [docs/superpowers/reviews/completeness/2026-08-21-select-all-float-completeness.md](../reviews/completeness/2026-08-21-select-all-float-completeness.md)

## Global Constraints

- Float appears as soon as **select mode is on** and **this list is non-empty**, including **0 selected**.
- **Select all** / **Clear** are **page-local**. They must not wipe traveling shortlist members from other screens.
- Copy: `N selected`, **Select all**, **Clear**. Never “Select all on this album.”
- **No** float / Select all on Explore. `AlbumSelectBar` keeps its **Clear**.
- Do not replace PageHeader / Save / Share / Grid / Select pill.
- Bottom dock = actions only after the shared bar is slimmed.
- BM-07: pad **top** for the float and keep existing **bottom** pad for nav + dock.
- No API changes. No photo viewer (point 6).

## File map

| Area | Files |
|------|--------|
| State helper | Create `apps/web/src/features/browse/selectAllState.ts` + `selectAllState.spec.ts` |
| Chrome | Create `apps/web/src/features/browse/SelectAllFloat.tsx` + `SelectAllFloat.spec.tsx` |
| Album | Modify `apps/web/src/features/collections/CollectionViewerPage.tsx` |
| Saved | Modify `apps/web/src/features/saved/SavedPage.tsx` |
| Shop | Modify `apps/web/src/features/company/CompanyProfilePage.tsx` |
| Bottom dock | Modify `apps/web/src/features/browse/BrowseSelectBar.tsx` |
| My Catalog | Modify `apps/web/src/features/catalog/MyCatalogPage.tsx` |
| Chat | Modify `apps/web/src/features/chats/ThreadPage.tsx` |
| Docs | `docs/features/collections.md`, `saved.md`, `company.md`, `catalog.md`, `chat.md`; gap matrix |

**Do not modify:** `apps/web/src/features/browse/AlbumSelectBar.tsx`, `apps/web/src/features/explore/ExplorePage.tsx` (Explore has no Select all).

---

### Task 1: `selectAllState` + `nextIdSet`

**Files:**
- Create: `apps/web/src/features/browse/selectAllState.ts`
- Test: `apps/web/src/features/browse/selectAllState.spec.ts`

**Interfaces:**
- Produces:

```ts
export type SelectAllAction = 'select-all' | 'clear';

export function selectAllState(
  visibleIds: readonly string[],
  selectedIds: Iterable<string>,
): { allSelected: boolean; action: SelectAllAction };

export function nextIdSet(
  visibleIds: readonly string[],
  selectedIds: Iterable<string>,
): Set<string>;
```

- [ ] **Step 1: Write the failing spec**

Create `apps/web/src/features/browse/selectAllState.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { nextIdSet, selectAllState } from './selectAllState';

describe('selectAllState', () => {
  it('is Select all when none of this list are selected', () => {
    expect(selectAllState(['a', 'b'], [])).toEqual({
      allSelected: false,
      action: 'select-all',
    });
  });

  it('is Select all when only some of this list are selected', () => {
    expect(selectAllState(['a', 'b'], ['a'])).toEqual({
      allSelected: false,
      action: 'select-all',
    });
  });

  it('is Clear when every visible id is selected', () => {
    expect(selectAllState(['a', 'b'], ['a', 'b', 'other'])).toEqual({
      allSelected: true,
      action: 'clear',
    });
  });

  it('is not all-selected on an empty list', () => {
    expect(selectAllState([], ['a'])).toEqual({
      allSelected: false,
      action: 'select-all',
    });
  });
});

describe('nextIdSet', () => {
  it('adds only visible ids on Select all', () => {
    expect([...nextIdSet(['a', 'b'], ['keep'])].sort()).toEqual(['a', 'b', 'keep']);
  });

  it('removes only visible ids on Clear', () => {
    expect([...nextIdSet(['a', 'b'], ['a', 'b', 'keep'])]).toEqual(['keep']);
  });
});
```

- [ ] **Step 2: Run spec — expect FAIL**

Run: `pnpm --filter @ekum/web test -- src/features/browse/selectAllState.spec.ts`

Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `apps/web/src/features/browse/selectAllState.ts`:

```ts
export type SelectAllAction = 'select-all' | 'clear';

export function selectAllState(
  visibleIds: readonly string[],
  selectedIds: Iterable<string>,
): { allSelected: boolean; action: SelectAllAction } {
  const selected = selectedIds instanceof Set ? selectedIds : new Set(selectedIds);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  return { allSelected, action: allSelected ? 'clear' : 'select-all' };
}

export function nextIdSet(
  visibleIds: readonly string[],
  selectedIds: Iterable<string>,
): Set<string> {
  const { allSelected } = selectAllState(visibleIds, selectedIds);
  const next = selectedIds instanceof Set ? new Set(selectedIds) : new Set(selectedIds);
  if (allSelected) {
    for (const id of visibleIds) next.delete(id);
  } else {
    for (const id of visibleIds) next.add(id);
  }
  return next;
}
```

- [ ] **Step 4: Run spec — expect PASS**

Run: `pnpm --filter @ekum/web test -- src/features/browse/selectAllState.spec.ts`

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/browse/selectAllState.ts apps/web/src/features/browse/selectAllState.spec.ts
git commit -m "test: page-local Select all / Clear state helper"
```

---

### Task 2: `SelectAllFloat` kit

**Files:**
- Create: `apps/web/src/features/browse/SelectAllFloat.tsx`
- Test: `apps/web/src/features/browse/SelectAllFloat.spec.tsx`

**Interfaces:**
- Consumes: `SelectAllAction` from `./selectAllState`
- Produces:

```ts
export const SELECT_FLOAT_BELOW_SHELL_AND_PAGE = 'top-[6.75rem]';
export const SELECT_FLOAT_BELOW_PAGE = 'top-[3.25rem]';

export function SelectAllFloat(props: {
  open: boolean;
  count: number;
  action: SelectAllAction;
  onAction: () => void;
  offsetClass?: string;
}): JSX.Element | null;
```

- Default `offsetClass` = `SELECT_FLOAT_BELOW_SHELL_AND_PAGE` (AppShell header + PageHeader).
- Chat uses `SELECT_FLOAT_BELOW_PAGE` (no AppShell title bar).
- Portal + `data-testid="select-all-float"` / `select-all-float-action`.
- `z-[25]` — below sheets / PageHeader (`z-30`), above feed.

- [ ] **Step 1: Write the failing RTL spec**

Create `apps/web/src/features/browse/SelectAllFloat.spec.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelectAllFloat } from './SelectAllFloat';

afterEach(() => cleanup());

describe('SelectAllFloat', () => {
  it('renders nothing when closed', () => {
    render(
      <SelectAllFloat open={false} count={0} action="select-all" onAction={() => {}} />,
    );
    expect(screen.queryByTestId('select-all-float')).toBeNull();
  });

  it('shows Select all at 0 selected', () => {
    render(
      <SelectAllFloat open count={0} action="select-all" onAction={() => {}} />,
    );
    expect(screen.getByTestId('select-all-float')).toHaveTextContent('0 selected');
    expect(screen.getByTestId('select-all-float-action')).toHaveTextContent('Select all');
  });

  it('shows Clear when action is clear', async () => {
    const onAction = vi.fn();
    render(<SelectAllFloat open count={3} action="clear" onAction={onAction} />);
    expect(screen.getByTestId('select-all-float-action')).toHaveTextContent('Clear');
    await userEvent.click(screen.getByTestId('select-all-float-action'));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run spec — expect FAIL**

Run: `pnpm --filter @ekum/web test -- src/features/browse/SelectAllFloat.spec.tsx`

Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `apps/web/src/features/browse/SelectAllFloat.tsx`:

```tsx
import { createPortal } from 'react-dom';
import { cx } from '@/ui/kit';
import type { SelectAllAction } from './selectAllState';

/** AppShell sticky header (~3.5rem) + PageHeader (~3.25rem). */
export const SELECT_FLOAT_BELOW_SHELL_AND_PAGE = 'top-[6.75rem]';
/** Chat thread: PageHeader only (no AppShell title bar). */
export const SELECT_FLOAT_BELOW_PAGE = 'top-[3.25rem]';

export function SelectAllFloat({
  open,
  count,
  action,
  onAction,
  offsetClass = SELECT_FLOAT_BELOW_SHELL_AND_PAGE,
}: {
  open: boolean;
  count: number;
  action: SelectAllAction;
  onAction: () => void;
  offsetClass?: string;
}) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-testid="select-all-float"
      className={cx(
        'fixed inset-x-0 z-[25] border-b border-line bg-canvas/95 px-4 py-2 backdrop-blur-md',
        offsetClass,
      )}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{count} selected</p>
        <button
          type="button"
          data-testid="select-all-float-action"
          className="text-xs font-bold text-accent"
          onClick={onAction}
        >
          {action === 'clear' ? 'Clear' : 'Select all'}
        </button>
      </div>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 4: Run spec — expect PASS**

Run: `pnpm --filter @ekum/web test -- src/features/browse/SelectAllFloat.spec.tsx`

Expected: PASS (3 tests). If `toHaveTextContent` needs jest-dom, confirm `apps/web` vitest setup already imports `@testing-library/jest-dom` (same as other RTL specs). If none exist, add `import '@testing-library/jest-dom/vitest';` at the top of this spec only.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/browse/SelectAllFloat.tsx apps/web/src/features/browse/SelectAllFloat.spec.tsx
git commit -m "feat: floating Select all chrome kit"
```

---

### Task 3: Album (collection viewer)

**Files:**
- Modify: `apps/web/src/features/collections/CollectionViewerPage.tsx`
- Modify: `docs/features/collections.md` (View / buyer step 2)

**Interfaces:**
- Consumes: `SelectAllFloat`, `selectAllState` from browse
- Uses existing `shortlist.addMany` / `shortlist.removeIds` / `toShortlistEntry`

- [ ] **Step 1: Compute visible ids + float props**

In `CollectionViewerPage`, after `products` / `selectMode` are defined, add:

```tsx
const visibleDesignIds = products.map((product) => product.id);
const selectAll = selectAllState(visibleDesignIds, shortlist.productIds);
const onSelectAllAction = () => {
  if (selectAll.action === 'clear') {
    shortlist.removeIds(visibleDesignIds);
    return;
  }
  shortlist.addMany(
    products.map((product) => toShortlistEntry(product, product.companyName ?? companyName)),
  );
};
```

Delete the old `selectAllDesigns` function (lines around 160–164).

- [ ] **Step 2: Pad for the float + render it**

On the page wrapper `className`, keep the existing bottom pad when `selectedCount > 0`. Add top pad when the float is open:

```tsx
className={cx(
  'flex flex-col gap-4',
  selectedCount > 0 && 'pb-[calc(5rem+5.5rem)]',
  selectMode && products.length > 0 && 'pt-12',
)}
```

After `PageHeader` (not under the grid), render:

```tsx
<SelectAllFloat
  open={selectMode && products.length > 0}
  count={selectedCount}
  action={selectAll.action}
  onAction={onSelectAllAction}
/>
```

Delete the block that renders **Select all on this album** (the `data.products && selectMode` wrap + button around lines 455–466).

Leave `BrowseSelectBar` as-is for this task (count/Clear still on the dock until Task 5).

- [ ] **Step 3: Docs**

In `docs/features/collections.md` buyer view step 2, append: once **Select** / long-press starts, a floating **Select all** / **Clear** stays under the header (this album’s designs only; other-album shortlist members stay).

- [ ] **Step 4: Run units**

Run: `pnpm --filter @ekum/web test -- src/features/browse/selectAllState.spec.ts src/features/browse/SelectAllFloat.spec.tsx src/features/collections/collectionCover.spec.ts`

Expected: PASS. Manually confirm no leftover `selectAllDesigns` / “Select all on this album”.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/collections/CollectionViewerPage.tsx docs/features/collections.md
git commit -m "feat: album Select all floats as soon as selecting starts"
```

---

### Task 4: Saved + shop Designs

**Files:**
- Modify: `apps/web/src/features/saved/SavedPage.tsx`
- Modify: `apps/web/src/features/company/CompanyProfilePage.tsx`
- Modify: `docs/features/saved.md`, `docs/features/company.md`

**Interfaces:**
- Consumes: same `SelectAllFloat` + `selectAllState` as Task 3
- Saved visible ids = `productItems` mapped to `productId` (skip albums)
- Shop visible ids = `designs` mapped to `id` (Designs tab list only)

- [ ] **Step 1: Saved float**

```tsx
const visibleSavedIds = productItems
  .map((item) => item.productId)
  .filter((id): id is string => Boolean(id));
const selectAll = selectAllState(visibleSavedIds, shortlist.productIds);
const onSelectAllAction = () => {
  if (selectAll.action === 'clear') {
    shortlist.removeIds(visibleSavedIds);
    return;
  }
  shortlist.addMany(
    productItems.map(savedToEntry).filter((entry): entry is BrowseShortlistEntry => Boolean(entry)),
  );
};
```

Show float when `shortlist.selectMode && visibleSavedIds.length > 0`.  
Count = `shortlist.count`.  
Add `pt-12` on the page wrapper when the float is open (keep existing `pb-[calc(5rem+5.5rem)]` when `shortlist.count > 0`).

- [ ] **Step 2: Shop float**

Same pattern with `designs` / `toShopShortlistEntry`.  
`open={selecting && designs.length > 0}` (`selecting` is already `shortlist.selectMode || shortlist.count > 0`). Prefer `shortlist.selectMode && designs.length > 0` so the float does not appear on the Collections shop tab with leftover ticks.  
Add `pt-12` on the shop `<section>` when that open condition is true (keep existing bottom pad when `shortlist.count > 0`).

- [ ] **Step 3: Docs**

- `saved.md` step 3: mention the floating **Select all** / **Clear** for saved designs.  
- `company.md` shop designs: same one-liner.

- [ ] **Step 4: Run units**

Run: `pnpm --filter @ekum/web test -- src/features/browse src/features/saved/savedAlbumCount.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/saved/SavedPage.tsx apps/web/src/features/company/CompanyProfilePage.tsx docs/features/saved.md docs/features/company.md
git commit -m "feat: Saved and shop Select all float"
```

---

### Task 5: Slim `BrowseSelectBar`

**Files:**
- Modify: `apps/web/src/features/browse/BrowseSelectBar.tsx`
- Call sites may keep passing `onClear` until you delete the prop — delete the prop and remove `onClear={...}` from CollectionViewer, Saved, Company.

**Interfaces:**
- `BrowseSelectBar` no longer takes `onClear`. No count row. Actions row only (`extra` / Curate / Order).
- **Do not** change `AlbumSelectBar` (Explore **Clear** stays).

- [ ] **Step 1: Remove the count / Clear row**

Replace the portal inner layout with a single actions row:

```tsx
return createPortal(
  <div className="fixed inset-x-0 bottom-[4.75rem] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md">
    <div className="mx-auto flex max-w-md gap-2">
      {extra}
      {showCurate ? (
        <Button variant="secondary" className="min-w-0 flex-1" onClick={onCurate}>
          {curateLabel}
        </Button>
      ) : null}
      {onOrder && canOrder ? (
        <Button className="min-w-0 flex-1" onClick={onOrder}>
          {orderLabel}
        </Button>
      ) : null}
    </div>
  </div>,
  document.body,
);
```

Remove `onClear` from the props type and all three call sites. Drop the outdated file comment about “top chrome was wrong.” New comment: count / Select all live on `SelectAllFloat`; this dock is verbs only.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @ekum/web typecheck`

Expected: PASS (no leftover `onClear`).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/browse/BrowseSelectBar.tsx apps/web/src/features/collections/CollectionViewerPage.tsx apps/web/src/features/saved/SavedPage.tsx apps/web/src/features/company/CompanyProfilePage.tsx
git commit -m "fix: browse select dock is actions only"
```

---

### Task 6: My Catalog

**Files:**
- Modify: `apps/web/src/features/catalog/MyCatalogPage.tsx`
- Modify: `docs/features/catalog.md` (Select bullet)

**Interfaces:**
- Consumes: `SelectAllFloat`, `selectAllState`, `nextIdSet`
- `visibleIds` already exists (current filter). `setSelectedIds(nextIdSet(visibleIds, selectedIds))`.

- [ ] **Step 1: Add the float; drop Select all from the bottom portal**

When `selecting && visibleIds.length > 0`, render:

```tsx
<SelectAllFloat
  open
  count={selectedIds.size}
  action={selectAllState(visibleIds, selectedIds).action}
  onAction={() => setSelectedIds(nextIdSet(visibleIds, selectedIds))}
/>
```

Add `pt-12` on the page wrapper when that open condition is true (keep `pb-28` while `selecting`).

In the existing bottom portal (the `createPortal` around the Publish / Archive / Restore buttons):

- Delete the row with `{selectedIds.size} selected` and the **Select all** button.
- Keep only the action buttons + the “No actions for this selection.” line.

- [ ] **Step 2: Docs**

`catalog.md` step 3: **Select** / long-press → floating **Select all** / **Clear** (this filter) → Publish / Archive / Restore on the dock.

- [ ] **Step 3: Typecheck + catalog units**

Run: `pnpm --filter @ekum/web test -- src/features/catalog src/features/browse`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/catalog/MyCatalogPage.tsx docs/features/catalog.md
git commit -m "feat: My Catalog Select all float"
```

---

### Task 7: Chat forward-select

**Files:**
- Modify: `apps/web/src/features/chats/ThreadPage.tsx`
- Modify: `docs/features/chat.md` (Message actions row)

**Interfaces:**
- Consumes: `SelectAllFloat`, `SELECT_FLOAT_BELOW_PAGE`, `selectAllState`, `nextIdSet`
- Visible ids = `ordered.filter(canForward).map((m) => m.id)`

- [ ] **Step 1: Float + slim the bottom select chrome**

```tsx
const forwardableIds = ordered.filter((message) => canForward(message)).map((message) => message.id);
const selectAll = selectAllState(forwardableIds, selectedIds);
```

Render (near `PageHeader`, not in the composer):

```tsx
<SelectAllFloat
  open={selecting && forwardableIds.length > 0}
  count={selectedIds.size}
  action={selectAll.action}
  onAction={() => setSelectedIds(nextIdSet(forwardableIds, selectedIds))}
  offsetClass={SELECT_FLOAT_BELOW_PAGE}
/>
```

Replace the selecting footer (the block that currently has Cancel · N selected · Forward **and** a second Select all / Clear all row) with **one** row: **Cancel** + **Forward**. No count, no Select all, no Clear all.

Add `pt-12` on the message list (`listRef` div) when `selecting && forwardableIds.length > 0` so the first message is not under the float.

- [ ] **Step 2: Docs**

`chat.md` Message actions: while **Select** is on, floating **Select all** / **Clear** (forwardable messages in this thread). Dock: Cancel / Forward.

- [ ] **Step 3: Chat units + typecheck**

Run: `pnpm --filter @ekum/web test -- src/features/chats/chatMessageActions.spec.ts src/features/browse`

Run: `pnpm --filter @ekum/web typecheck`

Expected: PASS.

- [ ] **Step 4: Update gap matrix**

In `docs/superpowers/reviews/feature-gap-matrix.md`, set Browse / Select all float to **Works** / **Unit** (not Functional unless you add e2e). Date stays 2026-08-21.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/chats/ThreadPage.tsx docs/features/chat.md docs/superpowers/reviews/feature-gap-matrix.md
git commit -m "feat: chat Select all float for forward"
```

---

## Self-review (spec coverage)

| Spec rule | Task |
|-----------|------|
| Float the instant select starts, including 0 selected | 2, 3–7 `open={selectMode && list.length > 0}` |
| Select all ↔ Clear | 1, 2 |
| Page-local; traveling ids kept | 1 `nextIdSet` / album `removeIds` |
| Album, Saved, shop, My Catalog, chat | 3, 4, 6, 7 |
| No Explore float | File map + Task 5 (AlbumSelectBar untouched) |
| Bottom verbs only | 5, 6, 7 |
| Header not replaced | 3–7 |
| BM-07 top + bottom pad | 3, 4, 6, 7 `pt-12` + existing `pb-*` |
| Copy | 2 |
| Tests | 1, 2 + typecheck |

No placeholders. Point 6 (photo viewer) is out of this plan.
