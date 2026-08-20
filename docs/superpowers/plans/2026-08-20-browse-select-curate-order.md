# Browse select · Curate · multi-supplier Order — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Traveling session shortlist across Explore/collections/Saved, Curate + Order on the sticky select bar, faster Saved entry, and multi-supplier Order/Ask-rates that create N orders with a confirmation linking each chat.

**Architecture:** Client owns a single `sessionStorage` shortlist of product ids (+ display cache). Shared `BrowseSelectBar` + `CurateFromSelectionSheet` replace the primary Curate-pack picker loop. Server adds `POST /orders/batch` that groups lines by product owner, reuses `OrderService.create` per seller, and returns successes + failures. Web confirmation sheet lists chat links; never only deep-links the first thread.

**Tech Stack:** NestJS + Prisma, `@ekum/domain-types`, React Query + React Router, Vitest (api + web).

**Spec:** [docs/superpowers/specs/2026-08-19-browse-select-curate-order-design.md](../specs/2026-08-19-browse-select-curate-order-design.md)

## Global Constraints

- Opaque businesses — no Trader/Seller badges.
- Session shortlist = **product ids only** (not collection ids). Album tiles in Saved open the album.
- Shortlist must **survive route changes**; clear only on user clear, successful Order/Curate consume, or logout/session end.
- Order line seller = `product.companyId` (Reference). Never trust client-supplied seller for batch grouping without verifying product ownership.
- Trade rules = existing `TradeAccess` (connection or discoverable/open products).
- Curate = existing Slice A ceiling (`allowForward` + discoverability + audience).
- Share/Forward multi-select polish is **out of this plan** (single-card Forward unchanged).
- Album expand-on-select deferred.
- WhatsApp-dense copy; bottom bar above nav (`bottom-20`).

## File map

| Area | Files |
|------|--------|
| Shortlist | Create `apps/web/src/features/browse/browseShortlist.ts` (+ `.spec.ts`), `useBrowseShortlist.ts` |
| Select bar | Create `apps/web/src/features/browse/BrowseSelectBar.tsx` |
| Curate sheet | Create `apps/web/src/features/browse/CurateFromSelectionSheet.tsx` |
| Order confirm | Create `apps/web/src/features/orders/BatchOrderConfirmSheet.tsx` |
| Collection | Modify `apps/web/src/features/collections/CollectionViewerPage.tsx` (drop per-collection shortlist) |
| Saved hub | Modify `apps/web/src/features/saved/SavedPage.tsx` |
| Explore | Modify `ExplorePage.tsx`, `ExploreProductPage.tsx` |
| Shell | Modify `apps/web/src/app/AppShell.tsx` (＋ → Saved; Curate shortcut) |
| Icons | Modify `apps/web/src/ui/icons.tsx` (bookmark) |
| Curate route | Modify `CuratePackPage.tsx` → use shortlist / redirect |
| Domain | Modify `packages/domain-types/src/orders.ts` |
| API | Modify `order.service.ts`, `order.controller.ts`, add `order.service.batch.spec.ts` |
| Docs | `docs/features/saved.md`, `orders.md`, `collections.md`, `explore.md` |

---

### Task 1: Session browse shortlist (unit-tested)

**Files:**
- Create: `apps/web/src/features/browse/browseShortlist.ts`
- Create: `apps/web/src/features/browse/browseShortlist.spec.ts`
- Create: `apps/web/src/features/browse/useBrowseShortlist.ts`

**Interfaces:**
- Produces:
  - `STORAGE_KEY = 'ekum:browseShortlist'`
  - `BrowseShortlistEntry = { productId: string; name: string; thumbUrl: string | null; companyId: string; companyName: string; allowForward?: boolean }`
  - `readBrowseShortlist(): BrowseShortlistEntry[]`
  - `writeBrowseShortlist(entries: BrowseShortlistEntry[]): void`
  - `toggleBrowseShortlistEntry(entry: BrowseShortlistEntry): BrowseShortlistEntry[]`
  - `removeBrowseShortlistIds(productIds: string[]): BrowseShortlistEntry[]`
  - `clearBrowseShortlist(): void`
  - `useBrowseShortlist()` → `{ entries, productIds: Set<string>, count, toggle, addMany, removeIds, clear, selectMode, setSelectMode }`

- [ ] **Step 1: Write failing unit tests**

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearBrowseShortlist,
  readBrowseShortlist,
  removeBrowseShortlistIds,
  toggleBrowseShortlistEntry,
  writeBrowseShortlist,
} from './browseShortlist';

const a = {
  productId: 'p1',
  name: 'Grey',
  thumbUrl: null,
  companyId: 'c1',
  companyName: 'Ahmedabad Loom Co',
};

describe('browseShortlist', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearBrowseShortlist();
  });

  it('persists toggles across read', () => {
    toggleBrowseShortlistEntry(a);
    expect(readBrowseShortlist()).toEqual([a]);
    toggleBrowseShortlistEntry(a);
    expect(readBrowseShortlist()).toEqual([]);
  });

  it('keeps other ids when removing a subset', () => {
    writeBrowseShortlist([
      a,
      { ...a, productId: 'p2', companyId: 'c2', companyName: 'Jaipur Emporium' },
    ]);
    removeBrowseShortlistIds(['p1']);
    expect(readBrowseShortlist().map((e) => e.productId)).toEqual(['p2']);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `pnpm --filter @ekum/web exec vitest run src/features/browse/browseShortlist.spec.ts`

- [ ] **Step 3: Implement storage helpers + React hook**

Implement `browseShortlist.ts` with JSON in `sessionStorage` (try/catch). Hook: `useState` seeded from `readBrowseShortlist`, sync writes on every mutation, expose `selectMode` boolean (true when count > 0 or user tapped Select).

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/browse
git commit -m "feat(web): session browse shortlist for multi-surface select"
```

---

### Task 2: Migrate CollectionViewer to global shortlist

**Files:**
- Modify: `apps/web/src/features/collections/CollectionViewerPage.tsx`
- Keep: existing Order / Save-selected / HowManyEachSheet wiring; switch state source

**Interfaces:**
- Consumes: `useBrowseShortlist`
- Produces: collection page no longer uses `ekum:shortlist:{collectionId}`

- [ ] **Step 1: Remove per-collection shortlist helpers**

Delete `shortlistKey`, `readShortlist`, `writeShortlist` and the `useEffect` that wrote per-id storage.

- [ ] **Step 2: Wire toggle / select-all / long-press**

```ts
const shortlist = useBrowseShortlist();
// selected = shortlist.productIds.has(product.id)
// onLongSelect → shortlist.toggle({ productId, name, thumbUrl: images[0], companyId: product.companyId, companyName: data.company.name, allowForward: product.allowForward })
// Select all (visible) → shortlist.addMany(visibleEntries) — must NOT clear off-page ids
// Clear → shortlist.clear()
```

Map collection `products` through `ProductView` (`companyId` already on type). If collection detail company is the pack owner, still use **each product’s** `companyId` for shortlist entries (curated packs).

- [ ] **Step 3: Keep sticky bar when `shortlist.count > 0` even if current page has 0 visible selected**

Bar label: `{shortlist.count} selected`. Save designs still saves selected ids that appear in **this** collection’s product list (unchanged intent for Save).

- [ ] **Step 4: Manual smoke**

Open album A, select 1 design, navigate to album B — count still ≥ 1.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/collections/CollectionViewerPage.tsx
git commit -m "feat(web): collection viewer uses traveling browse shortlist"
```

---

### Task 3: Faster Saved entry + Curate shortcut

**Files:**
- Modify: `apps/web/src/ui/icons.tsx` — add `BookmarkIcon`
- Modify: `apps/web/src/features/explore/ExplorePage.tsx` — header control → `/saved`
- Modify: `apps/web/src/app/AppShell.tsx` — ＋ sheet **Saved** + change **Curate pack** to open select flow
- Modify: `apps/web/src/features/saved/SavedPage.tsx` — honor `?select=1`

**Interfaces:**
- Produces: Explore bookmark → `navigate('/saved')`; ＋ → Saved; Curate pack → `/saved?select=1`

- [ ] **Step 1: Add BookmarkIcon** (24px outline, match other icons stroke style)

- [ ] **Step 2: Explore chrome**

Near search / top actions, add `aria-label="Saved"` button with BookmarkIcon → `/saved`.

- [ ] **Step 3: AppShell ＋ sheet**

```tsx
<Button variant="secondary" fullWidth onClick={() => go('/saved')}>
  Saved
</Button>
{selling ? (
  <Button variant="secondary" fullWidth onClick={() => go('/saved?select=1')}>
    Curate pack
  </Button>
) : null}
```

- [ ] **Step 4: SavedPage reads `select=1`**

On mount, if search param `select=1`, call `setSelectMode(true)` via shortlist hook.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/ui/icons.tsx apps/web/src/features/explore/ExplorePage.tsx apps/web/src/app/AppShell.tsx apps/web/src/features/saved/SavedPage.tsx
git commit -m "feat(web): Saved entry from Explore and plus sheet"
```

---

### Task 4: CurateFromSelectionSheet + bar Curate action

**Files:**
- Create: `apps/web/src/features/browse/CurateFromSelectionSheet.tsx`
- Create: `apps/web/src/features/browse/BrowseSelectBar.tsx`
- Modify: `CollectionViewerPage.tsx`, `SavedPage.tsx` to render shared bar

**Interfaces:**
- Consumes: shortlist entries; `POST /collections`, `PUT /collections/:id/products` (Slice A)
- Produces: `CurateFromSelectionSheet({ open, productIds, onClose, onCreated })`
- Produces: `BrowseSelectBar({ onOrder, onCurate, onClear, canOrder, canCurate })`

- [ ] **Step 1: Implement Curate sheet**

Fields: name (`defaultCollectionName()`), Save draft / Publish… — same createDraft logic as today’s `CuratePackPage` but `productIds` from props (shortlist), not local Saved multi-select.

On success: `removeBrowseShortlistIds(productIds)` or `clear()` if all consumed; navigate to `/catalog/collections/:id` with publish state when requested.

- [ ] **Step 2: BrowseSelectBar**

Fixed `bottom-20`, count, Clear, **Order**, **Curate**. Hide Curate when `canCurate === false` (any entry `allowForward === false` if known; else show and let API fail with toast).

- [ ] **Step 3: Wire CollectionViewer + Saved**

Saved: Select / long-press on **design** tiles only; album tiles still navigate to collection. Show `BrowseSelectBar` when count > 0.

- [ ] **Step 4: Smoke Curate from two suppliers’ shortlisted designs → one draft pack**

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/browse apps/web/src/features/collections/CollectionViewerPage.tsx apps/web/src/features/saved/SavedPage.tsx
git commit -m "feat(web): Curate from traveling shortlist via select bar"
```

---

### Task 5: Explore design select + product detail Curate

**Files:**
- Modify: `apps/web/src/features/explore/ExplorePage.tsx` (design shelf tiles)
- Modify: `apps/web/src/features/explore/ExploreProductPage.tsx`

**Interfaces:**
- Consumes: `useBrowseShortlist`, `BrowseSelectBar`, `CurateFromSelectionSheet`

- [ ] **Step 1: Design shelf long-press / select**

On `ExploreDesignOpportunity` cards: long-press toggles shortlist entry from `product` + `company` fields on the card. Show checkmark when selected. Render `BrowseSelectBar` on Explore when count > 0.

- [ ] **Step 2: ExploreProductPage**

Sticky bar: existing Order/Ask rates; add **Curate** → add this product to shortlist → open `CurateFromSelectionSheet` with current shortlist (including this design).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/explore
git commit -m "feat(web): Explore select and Curate beside Order"
```

---

### Task 6: Domain types + POST /orders/batch

**Files:**
- Modify: `packages/domain-types/src/orders.ts`
- Modify: `apps/api/src/orders/order.controller.ts`
- Modify: `apps/api/src/orders/order.service.ts`
- Create: `apps/api/src/orders/order.service.batch.spec.ts`

**Interfaces:**
- Produces:

```ts
export const createOrdersBatchSchema = z.object({
  kind: z.enum(orderKindValues).default(OrderKind.Standard),
  intent: z.enum(orderIntentValues).default(OrderIntent.Order),
  note: z.string().trim().max(1000).optional(),
  items: z
    .array(
      orderItemInputSchema.extend({
        productId: z.string().min(1),
      }),
    )
    .min(1)
    .max(200),
});
export type CreateOrdersBatchDto = z.input<typeof createOrdersBatchSchema>;

export interface CreateOrdersBatchResult {
  orders: Array<OrderView & { threadId?: string | null }>;
  failures: Array<{
    sellerCompanyId: string;
    sellerName: string | null;
    productIds: string[];
    code: string;
    message: string;
  }>;
}
```

- Service: `createBatch(actorCompanyId, userId, dto): Promise<CreateOrdersBatchResult>`
  1. Load products by id; group by `product.companyId`.
  2. Unknown ids → failure bucket `sellerCompanyId: 'unknown'`.
  3. For each group, call existing `create(...)` with that `sellerCompanyId` + group items (same kind/intent/note).
  4. Catch per-group errors → push `failures` with plain message; continue other groups.
  5. Always return `{ orders, failures }` (HTTP 200) so UI can render confirmation even when partial/all fail.

- Controller: `@Post('batch')` registered **before** `@Post(':id/...')` routes.

- [ ] **Step 1: Add types + build**

Run: `pnpm --filter @ekum/domain-types build`

- [ ] **Step 2: Failing unit test**

Mock prisma product find + `create` spy: two products two companies → `create` called twice; one `create` throws → one order + one failure.

- [ ] **Step 3: Implement createBatch + controller**

- [ ] **Step 4: Tests PASS**

Run: `pnpm --filter @ekum/api exec vitest run src/orders/order.service.batch.spec.ts`

- [ ] **Step 5: Commit**

```bash
git add packages/domain-types apps/api/src/orders
git commit -m "feat(orders): batch create splits lines by supplier"
```

---

### Task 7: Batch Order UX + confirmation sheet

**Files:**
- Create: `apps/web/src/features/orders/BatchOrderConfirmSheet.tsx`
- Modify: `HowManyEachSheet.tsx` — allow multi-seller (`sellerId` optional; remember qty under `ekum:qty-each:multi` when mixed)
- Modify: collection / Saved / Explore bar `onOrder` paths to call `/orders/batch`
- Modify: `CuratePackPage.tsx` — if shortlist non-empty, open curate sheet; else redirect `/saved?select=1`

**Interfaces:**
- Consumes: `CreateOrdersBatchResult`
- Produces: confirmation copy `N orders placed` / `K of N placed` with `Link` to `/chats/:threadId` per success (fallback `/orders/:id` if no threadId)

- [ ] **Step 1: BatchOrderConfirmSheet**

Props: `open`, `result: CreateOrdersBatchResult | null`, `onClose`, optional `onRetryFailure`.

List successes (seller business name) + failures with message.

- [ ] **Step 2: Wire Order from BrowseSelectBar**

Open HowManyEachSheet over shortlist entries; on submit:

```ts
await api.post<CreateOrdersBatchResult>('/orders/batch', {
  kind: OrderKind.Standard,
  intent: OrderIntent.Order, // Inquiry for Ask rates
  items: lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    images: [],
  })),
});
```

On any success: `removeBrowseShortlistIds` for succeeded product ids; show confirm sheet (do **not** navigate only to the first chat).

Ask rates: same endpoint with `intent: Inquiry`.

- [ ] **Step 3: ExploreProductPage**

May keep single `POST /orders` for one design; bars always use batch.

- [ ] **Step 4: Repoint CuratePackPage**

On mount: if `shortlist.count > 0` → show `CurateFromSelectionSheet`; else `navigate('/saved?select=1', { replace: true })`.

- [ ] **Step 5: Smoke**

Ravi: select Kavita design + Meena design → Order → confirmation shows 2 chat links.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/orders apps/web/src/features/browse apps/web/src/features/collections apps/web/src/features/saved apps/web/src/features/explore apps/web/src/features/catalog/CuratePackPage.tsx
git commit -m "feat(web): multi-supplier order confirmation with chat links"
```

---

### Task 8: Docs + spec status

**Files:**
- Modify: `docs/features/saved.md`, `docs/features/orders.md`, `docs/features/collections.md`, `docs/features/explore.md`
- Modify: `docs/superpowers/specs/2026-08-19-browse-select-curate-order-design.md` — Status → Implemented (when work is done)

- [ ] **Step 1: Update feature docs**

Document: Explore bookmark → Saved; traveling shortlist; Curate on select bar; `POST /orders/batch`; confirmation with per-chat links; album tiles still open-to-pick.

- [ ] **Step 2: Seed walkthrough** in `saved.md` / `orders.md` matching success criteria.

- [ ] **Step 3: Commit**

```bash
git add docs
git commit -m "docs: browse select, Curate bar, and batch order split"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Explore header → Saved | 3 |
| ＋ → Saved | 3 |
| Select / long-press → bar Order + Curate | 2, 4, 5 |
| Traveling shortlist across surfaces | 1, 2, 5 |
| Album tiles open (no collection id lines) | 4 (Saved) |
| Curate from selection (no pick-again primary) | 4, 7 |
| Explore Curate + select | 5 |
| Multi-supplier Order + confirmation links | 6, 7 |
| Ask rates same split | 7 |
| Share multi deferred | Global constraints |
| Album expand deferred | Global constraints |

## Self-review notes

- No TBD steps; batch always returns structured result for UI.
- `ProductView.companyId` required for shortlist entries from collections.
- Nest route `POST orders/batch` must not collide with `:id` routes.
- E2E optional later; unit coverage required for shortlist + batch service.
