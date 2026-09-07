# Curate albums as-is (Slice A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When Selection includes albums, **Curate** opens an Order-like resolve sheet (**Use whole pack** / **Pick designs**), expands into designs, then the existing Curate sheet (Save draft primary); designs-only skips resolve; locked (`allowForward: false`) rows stay gray with reason; continue with allowed only.

**Architecture:** Pure helpers partition relistable designs and default pack names. Generalize `OrderCollectionResolveSheet` with `intent: 'order' | 'curate'` (shared expand/dedupe). `SelectionPage` opens curate resolve when albums are present; after expand, write shortlist and open `CurateFromSelectionSheet` with allowed product ids + optional default name. Pack-lock gray is a **display** flag separate from discovery `unavailable` so Order/Bookmark/Share stay unaffected. **Slice B (Ask supplier) is out of this plan.**

**Tech Stack:** React + Vitest (`apps/web`), Playwright `@functional` (`apps/e2e`), existing browse shortlist/album pick session storage.

## Global Constraints

- Slice A only — no Ask CTA, no relist grants, no new API tables.
- Do not change Order resolve behaviour beyond shared component + copy props.
- `canRelistFlag`: locked only when `allowForward === false` (undefined stays allowed).
- Pack-lock gray ≠ discovery unavailable (do not drop locked from Order available counts).
- Zero allowed after expand → block Curate sheet; stay on Selection with toast/reason.
- No Instagram feed icons.
- Copy: plain trader words — Use whole pack / Pick designs / Save draft.
- BM-07: sheets + Selection bottom padding unchanged / still clear sticky chrome.

**Spec:** `docs/superpowers/specs/2026-09-04-curate-album-as-is-design.md` (Slice A)  
**Completeness:** `docs/superpowers/reviews/completeness/2026-09-04-curate-album-as-is-completeness.md`

## File map

| File | Role |
|------|------|
| `apps/web/src/features/browse/curateAlbumResolve.ts` | Pure: partition allowed/locked, skip message, default pack name |
| `apps/web/src/features/browse/curateAlbumResolve.spec.ts` | Unit tests for helpers |
| `apps/web/src/features/browse/albumSelectModel.ts` | `curateResolveSummary` + shared choice type alias if needed |
| `apps/web/src/features/browse/OrderCollectionResolveSheet.tsx` | Add `intent`; curate titles/labels/empty copy |
| `apps/web/src/features/browse/SelectionPage.tsx` | Curate → resolve when albums; gray pack-lock; wire expand → Curate sheet |
| `apps/web/src/features/browse/CurateFromSelectionSheet.tsx` | Optional `defaultName`; primary label **Save draft** |
| `apps/e2e/tests/functional/selection-workspace.journey.spec.ts` | Curate albums opens resolve with Use whole pack |
| `docs/features/saved.md` | Confirm Slice A wording matches shipped behaviour |

---

### Task 1: Pure helpers — partition, skip copy, default name

**Files:**
- Create: `apps/web/src/features/browse/curateAlbumResolve.ts`
- Create: `apps/web/src/features/browse/curateAlbumResolve.spec.ts`
- Modify: `apps/web/src/features/browse/albumSelectModel.ts` (add `curateResolveSummary`)

**Interfaces:**
- Consumes: `canRelistFlag` from `forwardGate.ts`; `BrowseShortlistEntry`
- Produces:
  - `partitionRelistableDesigns(entries: BrowseShortlistEntry[]): { allowed: BrowseShortlistEntry[]; locked: BrowseShortlistEntry[] }`
  - `curateLockedSkipMessage(lockedCount: number): string`
  - `curateDefaultPackName(input: { expandedAlbumNames: string[]; allowedDesignNames: string[] }): string`
  - `curateResolveSummary(designCount: number, albumCount: number): string` (in albumSelectModel or re-export)

- [ ] **Step 1: Write failing tests**

```ts
// curateAlbumResolve.spec.ts
import { describe, expect, it } from 'vitest';
import {
  partitionRelistableDesigns,
  curateLockedSkipMessage,
  curateDefaultPackName,
} from './curateAlbumResolve';
import { curateResolveSummary } from './albumSelectModel';
import type { BrowseShortlistEntry } from './browseShortlist';

function entry(
  productId: string,
  name: string,
  allowForward?: boolean,
): BrowseShortlistEntry {
  return {
    productId,
    name,
    thumbUrl: null,
    companyId: 'c1',
    companyName: 'Shop',
    allowForward,
  };
}

describe('partitionRelistableDesigns', () => {
  it('treats undefined allowForward as allowed; false as locked', () => {
    const { allowed, locked } = partitionRelistableDesigns([
      entry('a', 'A'),
      entry('b', 'B', true),
      entry('c', 'C', false),
    ]);
    expect(allowed.map((e) => e.productId)).toEqual(['a', 'b']);
    expect(locked.map((e) => e.productId)).toEqual(['c']);
  });
});

describe('curateLockedSkipMessage', () => {
  it('counts skipped locked lines', () => {
    expect(curateLockedSkipMessage(1)).toBe('1 locked — seller doesn’t allow pack');
    expect(curateLockedSkipMessage(3)).toBe('3 locked — seller doesn’t allow pack');
  });
});

describe('curateDefaultPackName', () => {
  it('prefills from one expanded album', () => {
    expect(
      curateDefaultPackName({
        expandedAlbumNames: ['Wedding Edit'],
        allowedDesignNames: ['A', 'B'],
      }),
    ).toBe('Wedding Edit');
  });

  it('prefills single design when no album expand', () => {
    expect(
      curateDefaultPackName({
        expandedAlbumNames: [],
        allowedDesignNames: ['Silk border'],
      }),
    ).toBe('Silk border');
  });

  it('leaves empty for multiple albums or multiple designs without single album', () => {
    expect(
      curateDefaultPackName({
        expandedAlbumNames: ['A', 'B'],
        allowedDesignNames: ['x'],
      }),
    ).toBe('');
    expect(
      curateDefaultPackName({
        expandedAlbumNames: [],
        allowedDesignNames: ['x', 'y'],
      }),
    ).toBe('');
  });
});

describe('curateResolveSummary', () => {
  it('mirrors order summary shape', () => {
    expect(curateResolveSummary(0, 2)).toBe('You selected 2 collections.');
    expect(curateResolveSummary(1, 1)).toBe('You selected 1 design + 1 collection.');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm --filter @ekum/web exec vitest run src/features/browse/curateAlbumResolve.spec.ts
```

Expected: FAIL (module / exports missing)

- [ ] **Step 3: Implement helpers**

```ts
// curateAlbumResolve.ts
import { canRelistFlag } from './forwardGate';
import type { BrowseShortlistEntry } from './browseShortlist';

export function partitionRelistableDesigns(entries: BrowseShortlistEntry[]) {
  const allowed: BrowseShortlistEntry[] = [];
  const locked: BrowseShortlistEntry[] = [];
  for (const entry of entries) {
    if (canRelistFlag(entry.allowForward)) allowed.push(entry);
    else locked.push(entry);
  }
  return { allowed, locked };
}

export function curateLockedSkipMessage(lockedCount: number): string {
  if (lockedCount === 1) return '1 locked — seller doesn’t allow pack';
  return `${lockedCount} locked — seller doesn’t allow pack`;
}

export function curateDefaultPackName(input: {
  expandedAlbumNames: string[];
  allowedDesignNames: string[];
}): string {
  if (input.expandedAlbumNames.length === 1) {
    return input.expandedAlbumNames[0]!.trim();
  }
  if (input.expandedAlbumNames.length === 0 && input.allowedDesignNames.length === 1) {
    return input.allowedDesignNames[0]!.trim();
  }
  return '';
}
```

Add to `albumSelectModel.ts`:

```ts
export function curateResolveSummary(designCount: number, albumCount: number): string {
  // Same sentences as orderResolveSummary (shared wording).
  return orderResolveSummary(designCount, albumCount);
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm --filter @ekum/web exec vitest run src/features/browse/curateAlbumResolve.spec.ts
```

- [ ] **Step 5: Commit** (only if user asked to commit; otherwise skip)

```bash
git add apps/web/src/features/browse/curateAlbumResolve.ts apps/web/src/features/browse/curateAlbumResolve.spec.ts apps/web/src/features/browse/albumSelectModel.ts
git commit -m "test: curate album resolve helpers for Slice A"
```

---

### Task 2: Shared collection resolve sheet (`intent: order | curate`)

**Files:**
- Modify: `apps/web/src/features/browse/OrderCollectionResolveSheet.tsx`
- Modify: `apps/web/src/features/browse/orderCollectionResolve.spec.ts` (optional label assertion via pure strings if extracted)

**Interfaces:**
- Consumes: existing expand loop + `mergeShortlistWithProducts`
- Produces: same `onResolved` shape; new prop `intent?: 'order' | 'curate'` (default `'order'`)

- [ ] **Step 1: Add copy map at top of sheet file**

```ts
const RESOLVE_COPY = {
  order: {
    title: 'Order collections',
    prompt: 'How would you like to order this collection?',
    allTitle: 'All designs',
    allHint: 'Select all designs in this collection',
    chooseTitle: 'Choose designs',
    chooseHint: 'Open the collection and select specific designs',
    emptyCode: 'NO_DESIGNS',
    emptyMessage: 'Pick at least one design to order.',
  },
  curate: {
    title: 'Curate from collections',
    prompt: 'How would you like to curate this collection?',
    allTitle: 'Use whole pack',
    allHint: 'Put every design from this pack into your Curate set',
    chooseTitle: 'Pick designs',
    chooseHint: 'Open the collection and select specific designs',
    emptyCode: 'NO_DESIGNS',
    emptyMessage: 'Pick at least one design to curate.',
  },
} as const;
```

- [ ] **Step 2: Add `intent = 'order'` prop; wire title, prompts, labels, empty message, summary**

Use `intent === 'curate' ? curateResolveSummary(...) : orderResolveSummary(...)`.

Keep expand API path identical: `GET /explore/collections/:id` → `mergeShortlistWithProducts`.

Add `data-testid="collection-resolve-sheet"` and for curate options:
- `data-testid="resolve-use-whole-pack"` on Use whole pack button
- `data-testid="resolve-pick-designs"` on Pick designs button

(Order can keep existing text without new testids, or share the same testids for both intents.)

- [ ] **Step 3: Smoke-check Order path still compiles**

```bash
pnpm --filter @ekum/web exec vitest run src/features/browse/orderCollectionResolve.spec.ts src/features/browse/albumSelectModel.spec.ts
```

Expected: PASS

- [ ] **Step 4: Commit** (if requested)

```bash
git commit -m "feat: collection resolve sheet supports curate intent"
```

---

### Task 3: SelectionPage — Curate opens resolve; expand → Curate sheet

**Files:**
- Modify: `apps/web/src/features/browse/SelectionPage.tsx`

**Interfaces:**
- Consumes: `OrderCollectionResolveSheet` with `intent="curate"`; `partitionRelistableDesigns`, `curateLockedSkipMessage`, `curateDefaultPackName`
- Produces: `curateResolveOpen` state; after resolve, `setCurateProductIds` + `setCurateDefaultName` + `setCurateOpen(true)`

- [ ] **Step 1: Add state**

```ts
const [curateResolveOpen, setCurateResolveOpen] = useState(false);
const [curateDefaultName, setCurateDefaultName] = useState('');
```

- [ ] **Step 2: Replace `onCurate`**

Behaviour:

1. If `availableTotal < 1` return.
2. `toastSkippedUnavailable()` (discovery skips only).
3. If `availableAlbumCount > 0` → `setCurateResolveOpen(true)` and return.
4. Else designs-only path:
   - `partitionRelistableDesigns` on available (or resolving) designs
   - if `allowed.length === 0` → `showToast(RELIST_LOCKED_TOAST, 'danger')` return
   - if locked → `showToast(curateLockedSkipMessage(locked.length))` (or keep existing skip toast)
   - `setCurateDefaultName(curateDefaultPackName({ expandedAlbumNames: [], allowedDesignNames: allowed.map(e => e.name) }))`
   - `setCurateProductIds(allowed.map(e => e.productId))`
   - `setCurateOpen(true)`

Remove the old toast that says open a collection / use Order first.

- [ ] **Step 3: Render second resolve sheet (or reuse one sheet with mode)**

Prefer **one** `OrderCollectionResolveSheet` instance controlled by `resolveIntent: 'order' | 'curate' | null` to avoid duplicate album maps — OR two sheets with separate open flags (simpler, matches current Order-only sheet). Two sheets is fine if clearer:

```tsx
<OrderCollectionResolveSheet
  intent="curate"
  open={curateResolveOpen}
  onClose={() => setCurateResolveOpen(false)}
  albums={resolving ? albumPick.entries : availableAlbums}
  designCount={resolving ? shortlist.count : availableDesigns.length}
  existingShortlist={resolving ? shortlist.entries : availableDesigns}
  onResolved={({ shortlist: nextShortlist, remainingAlbums, navigateToCollectionId }) => {
    setCurateResolveOpen(false);
    const unavailableAlbums = albumPick.entries.filter(
      (e) => e.availability… // mirror Order handler: keep discovery-unavailable albums
    );
    // Mirror Order's writeBrowseShortlist / writeBrowseAlbumPick pattern from SelectionPage Order onResolved
    writeBrowseShortlist([...unavailableDesigns, ...nextShortlist]);
    writeBrowseAlbumPick([...unavailableAlbums, ...remainingAlbums]);

    if (navigateToCollectionId) {
      navigate(`/collections/${navigateToCollectionId}`); // use same path Order uses
      return;
    }

    const { allowed, locked } = partitionRelistableDesigns(nextShortlist);
    if (allowed.length === 0) {
      showToast(RELIST_LOCKED_TOAST, 'danger');
      return;
    }
    if (locked.length > 0) {
      showToast(curateLockedSkipMessage(locked.length));
    }
    const expandedNames = /* albums that were resolved with 'all' this turn — pass via onResolved if needed */;
    setCurateDefaultName(
      curateDefaultPackName({
        expandedAlbumNames: expandedNames,
        allowedDesignNames: allowed.map((e) => e.name),
      }),
    );
    setCurateProductIds(allowed.map((e) => e.productId));
    setCurateOpen(true);
  }}
/>
```

**Expanded album names for default:** extend `onResolved` result with `expandedAlbumNames: string[]` (albums processed with choice `'all'`). Implement in Task 2 sheet:

```ts
onResolved({ shortlist, remainingAlbums, navigateToCollectionId, expandedAlbumNames });
```

Order handler ignores `expandedAlbumNames`.

- [ ] **Step 4: Pass `defaultName={curateDefaultName}` into CurateFromSelectionSheet; clear on close**

- [ ] **Step 5: Manual sanity** — albums-only Curate opens “Curate from collections”; Use whole pack → Curate pack sheet.

- [ ] **Step 6: Commit** (if requested)

```bash
git commit -m "feat: Curate on albums uses collection resolve then pack sheet"
```

---

### Task 4: CurateFromSelectionSheet — defaultName + Save draft label

**Files:**
- Modify: `apps/web/src/features/browse/CurateFromSelectionSheet.tsx`

**Interfaces:**
- Consumes: `defaultName?: string`
- Produces: name field initialized from `defaultName` when sheet opens

- [ ] **Step 1: Add prop and effect**

```ts
defaultName?: string;

useEffect(() => {
  if (!open) return;
  setName(defaultName?.trim() ?? '');
  setMode('new');
  setQuery('');
}, [open, defaultName]);
```

- [ ] **Step 2: Primary button label**

Change primary from `Save Collection in Draft` → `Save draft` (spec). Keep secondary as `Publish…` or existing `Publish to Collection` — prefer shorter **Publish…** only if product docs already allow; otherwise keep `Publish to Collection` to avoid drive-by copy churn. Spec says Save draft primary; secondary Publish… still available — use:

- Primary: `Save draft`
- Secondary: keep `Publish to Collection` (existing) unless a one-line doc update prefers Publish…

- [ ] **Step 3: Unit not required** if covered by e2e; optional small test of effect via helper `initialCurateName(defaultName)`.

- [ ] **Step 4: Commit** (if requested)

```bash
git commit -m "feat: Curate sheet default name and Save draft primary"
```

---

### Task 5: Pack-lock gray on Selection rows (separate from unavailable)

**Files:**
- Modify: `apps/web/src/features/browse/SelectionPage.tsx` (`SelectionRow` + row props)
- Create or modify: `apps/web/src/features/browse/selectionPackLock.spec.ts` (pure reason helper)

**Interfaces:**
- Produces: `packLockReason(allowForward?: boolean): string | undefined` — returns `"Can't put in a pack"` when `allowForward === false`

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from 'vitest';
import { packLockReason } from './curateAlbumResolve'; // or selectionPackLock.ts

describe('packLockReason', () => {
  it('returns reason only when allowForward is false', () => {
    expect(packLockReason(false)).toBe("Can't put in a pack");
    expect(packLockReason(true)).toBeUndefined();
    expect(packLockReason(undefined)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Implement + wire SelectionRow**

```tsx
const packReason = packLockReason(row.allowForward);
const discoveryUnavailable = row.availability?.available === false;
const faded = discoveryUnavailable || Boolean(packReason);
const reason = row.availability?.reason ?? packReason;
// data-unavailable only for discovery (verbs); also data-pack-locked={packReason ? 'true' : undefined}
```

Do **not** exclude pack-locked designs from `availableDesigns` used for Order counts.

Curate still partitions via `partitionRelistableDesigns`.

- [ ] **Step 3: Run unit tests**

```bash
pnpm --filter @ekum/web exec vitest run src/features/browse/curateAlbumResolve.spec.ts
```

- [ ] **Step 4: Commit** (if requested)

```bash
git commit -m "fix: gray pack-locked selection rows without blocking Order"
```

---

### Task 6: Functional e2e — Curate albums opens resolve

**Files:**
- Modify: `apps/e2e/tests/functional/selection-workspace.journey.spec.ts`

- [ ] **Step 1: Add test**

```ts
test('Curate on albums opens Use whole pack resolve', async ({ page }) => {
  await loginAsRavi(page);
  await page.goto('/explore');
  await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });
  await seedSelection(page); // has album + design
  await page.reload();
  await page.getByTestId('selection-workspace-bar').click();
  await expect(page.getByRole('heading', { name: 'Your selection' })).toBeVisible();
  await page.getByTestId('selection-curate').click();
  await expect(page.getByRole('heading', { name: 'Curate from collections' })).toBeVisible();
  await expect(page.getByText('Use whole pack').first()).toBeVisible();
  await expect(page.getByText('Pick designs').first()).toBeVisible();
});
```

- [ ] **Step 2: Add pack-lock gray test (session seed)**

```ts
test('pack-locked design stays visible with reason', async ({ page }) => {
  await loginAsRavi(page);
  await page.goto('/explore');
  await page.evaluate(() => {
    sessionStorage.setItem(
      'ekum:browseShortlist',
      JSON.stringify([
        {
          productId: 'seed-product-1',
          name: 'Locked design',
          thumbUrl: null,
          companyId: 'seed-company-kavita',
          companyName: 'Ahmedabad Loom Co',
          allowForward: false,
        },
      ]),
    );
  });
  await page.goto('/selection');
  await expect(page.getByText('Locked design')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Can't put in a pack")).toBeVisible();
});
```

Note: if `seed-product-1` fails availability fetch, discovery reason may win — use a real seed product id that resolves available, with `allowForward: false` only in session (availability may refresh allowForward from API). If API overwrites, assert via unit only for lock reason and keep e2e for resolve sheet.

If live availability clears `allowForward`, skip e2e lock assertion and keep unit coverage; document in test comment.

- [ ] **Step 3: Run**

```bash
pnpm test:e2e:functional -- selection-workspace
```

Expected: PASS for new Curate resolve test; Order resolve test still PASS.

- [ ] **Step 4: Commit** (if requested)

```bash
git commit -m "test: functional Curate album resolve on Selection"
```

---

### Task 7: Docs sync + gap matrix

**Files:**
- Modify: `docs/features/saved.md` (confirm Slice A text matches ship)
- Modify: `docs/superpowers/reviews/feature-gap-matrix.md` — Slice A → Works when verified
- Optional one-liner in `docs/features/00-concepts.md` only if Forward vs Curate needs “album expand” mention

- [ ] **Step 1: Align saved.md Curate bullet with shipped labels (Use whole pack / Pick designs / Save draft).**
- [ ] **Step 2: After green tests, set matrix Slice A status to Works + note unit + functional.**
- [ ] **Step 3: Do not implement Slice B.**

---

## Spec coverage checklist (self-review)

| Spec (Slice A) | Task |
|----------------|------|
| Album Curate → Use whole pack / Pick designs | 2, 3, 6 |
| Designs only → Curate sheet | 3 |
| Save draft primary | 4 |
| Name default one album / one design | 1, 3, 4 |
| Gray locked + reason | 5, 6 |
| Continue with allowed; zero → block | 3 |
| Union albums + designs / dedupe | 2 (existing merge) |
| No Ask / no feed icons | Global — not in tasks |
| Order unchanged | 2 default intent |

**Placeholder scan:** none intentional.  
**Type consistency:** `expandedAlbumNames` added to `onResolved` in Task 2; consumed in Task 3.

---

## Out of plan (Slice B)

Ask supplier, RelistRequest, ProductRelistGrant, chat Allow/Deny, revoke UI — separate plan after A ships.
