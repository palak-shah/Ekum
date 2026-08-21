# Direct vs I handle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pack owner Profile default **Direct** / **I handle**, overridable on each forward/publish/curate; buyer’s ticket seller matches that path; soft-hide + **Shared** / **Take over** copy stay trustworthy.

**Architecture:** Store `orderPathPreference: 'direct' | 'handle'` on company `tradeDefaults` (Profile) and on `Collection` (pack override). Stamp the same on chat share metadata / query (`path=direct|handle`) for forwards. At place time, resolve preference → either batch to design owners + facilitator **Shared**, or Manage `from-pack` / handle seller = sharer. Phase B: hold upstream from supplier until **Send**.

**Tech Stack:** NestJS, Prisma, Zod `@ekum/domain-types`, React web, Vitest.

**Spec:** [2026-08-21-direct-vs-handle-settings-design.md](../specs/2026-08-21-direct-vs-handle-settings-design.md)

## Global Constraints

- Default preference **`direct`** (curate ≠ handle).
- Switch owner = **pack/share company only** (not buyer/supplier Profiles).
- **pack/share stamp > Profile default**; seller fixed at order **create**.
- Plain forward uses same default + per-share override (not Direct-only).
- UI: **Direct** / **I handle** + hints; list **Shared**; escape **Take over** (not Take control / Manage / toll).
- Direct multi-supplier confirm must list **each owner name**.
- Never guess upstream; never leak ends on handle hops.
- Trading on still required to curate / Send desk / Take over.
- Phase A (Tasks 1–7) ships routing without requiring Send-hold; Phase B (Task 8) adds hold-until-Send.

## File map

| File | Role |
|------|------|
| `packages/domain-types/src/enums.ts` (or settings/orders) | `OrderPathPreference` values |
| `packages/domain-types/src/settings.ts` | `orderPathPreference` on settings DTO |
| `packages/domain-types/src/catalog.ts` | collection create/update + view field |
| `apps/api/prisma/schema.prisma` | `Collection.orderPathPreference` |
| `apps/api/src/identity/trade-presence.ts` / settings | read/write default in `tradeDefaults` |
| `apps/web/src/features/settings/ProfilePage.tsx` | Profile switch UI |
| `apps/web/src/features/catalog/*` publish/curate | pack override control |
| `apps/web/src/features/browse/CatalogShareSheet.tsx` | per-share override + stamp |
| `apps/web/src/features/browse/orderPathPreference.ts` | resolve default vs override helpers |
| `apps/web/src/features/chats/ThreadPage.tsx` | forward link includes `path=` |
| `apps/web/src/features/collections/CollectionViewerPage.tsx` | route place by path |
| `apps/web/src/features/orders/*` | Shared / Take over copy; Direct confirm names |
| `apps/api/src/orders/order.service.ts` | from-pack only when handle; Direct uses batch + facilitator |
| `docs/features/orders.md`, `settings.md` | shipped behaviour |

---

### Task 1: Domain — `OrderPathPreference`

**Files:**
- Modify: `packages/domain-types/src/enums.ts`
- Modify: `packages/domain-types/src/settings.ts`
- Modify: `packages/domain-types/src/catalog.ts` (collection schemas / `CollectionView`)
- Test: `packages/domain-types` build / existing zod consumers

**Produces:**
- `OrderPathPreference = { Direct: 'direct', Handle: 'handle' }`
- Settings: optional `orderPathPreference` on `updateCompanySettingsSchema` (mirrors buy/sell/trading flags → merge into `tradeDefaults.orderPathPreference`)
- Collection DTO/view: optional `orderPathPreference` (null/omit = use Profile)

- [ ] **Step 1: Add enum + zod**

```ts
export const OrderPathPreference = {
  Direct: 'direct',
  Handle: 'handle',
} as const;
export type OrderPathPreference =
  (typeof OrderPathPreference)[keyof typeof OrderPathPreference];
export const orderPathPreferenceValues = values(OrderPathPreference);
```

Add to `updateCompanySettingsSchema`:
`orderPathPreference: z.enum(['direct', 'handle']).optional()`

Add to collection create/update/publish schemas and `CollectionView`:
`orderPathPreference: z.enum(['direct', 'handle']).nullable().optional()`

- [ ] **Step 2: Build domain-types**

Run: `pnpm --filter @ekum/domain-types build`  
Expected: success

- [ ] **Step 3: Commit**

```bash
git add packages/domain-types
git commit -m "feat: add OrderPathPreference for Direct vs I handle"
```

---

### Task 2: Persist Profile default + Collection override

**Files:**
- Modify: `apps/api/src/settings/settings.service.ts` — merge `orderPathPreference` into `tradeDefaults`
- Modify: `apps/api/prisma/schema.prisma` — `orderPathPreference String?` on `Collection`
- Create migration under `apps/api/prisma/migrations/`
- Modify: collection serializer + create/update services to read/write field
- Modify: company/settings serializers so Profile clients receive `tradeDefaults.orderPathPreference` (default treat missing as `direct`)
- Test: settings unit or API test for merge; collection round-trip

**Produces:**
- `resolveOrderPathPreference(tradeDefaults): 'direct' | 'handle'` → missing ⇒ `'direct'`
- Collection column nullable; null means “use Profile at order time”

- [ ] **Step 1: Helper**

```ts
export function resolveOrderPathPreference(
  tradeDefaults: unknown,
): 'direct' | 'handle' {
  const d = (tradeDefaults ?? {}) as Record<string, unknown>;
  return d.orderPathPreference === 'handle' ? 'handle' : 'direct';
}
```

Place next to `resolveTradePresence` in `apps/api/src/identity/trade-presence.ts` (or small `order-path.ts`).

- [ ] **Step 2: Settings merge** — when `dto.orderPathPreference` set, write `tradeDefaults.orderPathPreference`.

- [ ] **Step 3: Prisma field + migration**

```prisma
orderPathPreference String? // direct | handle; null = use company Profile default
```

- [ ] **Step 4: Tests** — missing defaults to direct; handle persists; collection null vs `handle`.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: persist order path preference on settings and collections"
```

---

### Task 3: Profile UI switch

**Files:**
- Modify: `apps/web/src/features/settings/ProfilePage.tsx`
- Modify: `docs/features/settings.md`

**Produces:** Toggle under “I trade on Ekum” (only meaningful when trading on; still visible with hint).

- [ ] **Step 1: UI**

Two-option control (not jargon dump):

- Label: **When buyers order from what I share**
- Options: **Direct** — “Buyers order from the design owners” / **I handle** — “Buyers order from me”
- Save via existing settings PATCH (`orderPathPreference` or `tradeDefaults`)

- [ ] **Step 2: Manual check** — toggle persists after reload.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: Profile Direct vs I handle default"
```

---

### Task 4: Pack publish/curate override + share sheet override

**Files:**
- Modify: catalog publish / curate pack UI (where audience is set — e.g. `CuratePackPage` / collection publish sheet)
- Modify: `apps/web/src/features/browse/CatalogShareSheet.tsx`
- Create: `apps/web/src/features/browse/orderPathPreference.ts` + `.spec.ts`

**Produces:**

```ts
export function effectiveOrderPath(input: {
  profileDefault: 'direct' | 'handle';
  override: 'direct' | 'handle' | null | undefined;
}): 'direct' | 'handle' {
  return input.override ?? input.profileDefault;
}
```

- [ ] **Step 1: Unit tests** for `effectiveOrderPath` (null override → profile; override wins).

- [ ] **Step 2: Pack UI** — preselect from Profile; allow change; persist on collection.

- [ ] **Step 3: CatalogShareSheet** — same control; for pack share use collection override; for product/collection forward of others, pass chosen path into share payload / deep link.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: per pack and share order path override"
```

---

### Task 5: Stamp path on chat forward links + resolve on browse

**Files:**
- Modify: `apps/web/src/features/browse/forwardAttribution.ts` — extend with `path` query (`path=direct|handle`) alongside `facilitator`
- Modify: `apps/web/src/features/chats/ThreadPage.tsx` — build links with resolved path for that share
- Modify: `CollectionViewerPage.tsx`, `ExploreProductPage.tsx` — read `path` (sticky in session like facilitator)

**Rule:**

| Path | Place behaviour |
|------|-----------------|
| `direct` | Seller = design `companyId`; stamp `facilitatorCompanyId` = sharer when sharer ≠ owner ≠ buyer |
| `handle` | Seller = sharer/pack owner; Manage / from-pack (no facilitator on buyer ticket) |

- [ ] **Step 1: Tests** for query helpers `withOrderPathQuery` / `resolveOrderPathForCatalog`.

- [ ] **Step 2: Thread cards** — when building `collectionPath` / `productPath`, append `path=` from share-time choice (stored on message metadata if available; else Profile of sender is insufficient on receiver — **must stamp on send**).

**Message stamp:** On share/forward API payload, include `orderPathPreference` in message reference metadata so the recipient’s link is authoritative (trust: don’t re-resolve sender Profile later).

- [ ] **Step 3: Wire browse pages** to prefer query `path`, then collection.orderPathPreference, then owner Profile only when opening owner’s own pack without query.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: stamp Direct vs I handle on forward and browse links"
```

---

### Task 6: Order place routing (API + web)

**Files:**
- Modify: `apps/api/src/orders/order.service.ts` — `createFromPack` only for handle path; add/confirm Direct pack order via `createBatch` by `product.companyId` + optional `facilitatorCompanyId` = pack owner
- Modify: `useShortlistOrderFlow.ts`, `CollectionViewerPage.tsx` — branch on effective path
- Test: extend `order.service.from-pack.spec.ts`; add Direct curated batch + facilitator case

**Produces:**

- Handle + curated → existing Manage downstream + upstream links (Phase A may still auto-create upstream; Phase B holds).
- Direct + curated multi-supplier → batch split to owners; `facilitatorCompanyId` = pack company; buyer confirm lists owner names.
- Forward Direct → current facilitator batch behaviour.
- Forward Handle → create order seller = sharer, foreign product lines allowed (same as Manage snapshots), then upstream link to owner (Phase A: create upstream immediately or draft; Phase B: hold).

- [ ] **Step 1: Failing API tests** for Direct curated pack (seller ≠ pack owner on each order; facilitator = pack owner).

- [ ] **Step 2: Implement routing branches.

- [ ] **Step 3: Web place** — Direct path never POST `/orders/from-pack`; uses `/orders/batch` with facilitator. Handle path uses `/orders/from-pack`.

- [ ] **Step 4: Live/API spot-check** — Meena orders Ravi pack Direct → Kavita (+ Rekha) tickets; Ravi GET sees Shared. Meena orders Handle → Meena↔Ravi.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: route pack and forward orders by Direct vs I handle"
```

---

### Task 7: Trust copy + Direct multi-supplier confirm

**Files:**
- Modify: `OrdersPage.tsx`, `OrderDetailPage.tsx` — **Shared**; button **Take over** (replace Take control label)
- Modify: `HowManyEachSheet` / batch confirm — when Direct multi-owner, show “Order goes to: {names}”
- Modify: `docs/features/orders.md`, gap matrix row if needed
- Remove leftover “In the loop” / Manage jargon from user-visible strings touched here

- [ ] **Step 1: Copy sweep** on facilitator + take-control UI.

- [ ] **Step 2: Confirm sheet** lists each seller company name for Direct multi.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: Shared and Take over copy; Direct multi-seller confirm"
```

---

### Task 8 (Phase B): Hold upstream until Send

**Files:**
- Modify: `order.service.ts` createFromPack / handle forward — create upstream in `held` / omit supplier visibility until send
- Add: `POST /orders/:id/send-up` (or per-upstream) — copies lines (optional rate edits) and releases to supplier
- Modify: order detail for handle seller — **Send** / **Change** desk
- Test: supplier cannot GET held upstream; after Send, can

**Produces:** Spec desk verbs; soft-hide unchanged.

- [ ] **Step 1: Spec visibility rule** — `requireOrder` denies supplier while `upstreamReleaseAt` null (or status `held`).

- [ ] **Step 2: API Send-up with optional line rate/qty patches.

- [ ] **Step 3: Web desk CTAs**.

- [ ] **Step 4: Live test** — Handle path: Kavita 404/empty until Ravi Send.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: hold upstream until Send on I handle path"
```

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| Profile default Direct/I handle | 2–3 |
| Override on forward/publish/curate | 4–5 |
| Forward uses same default | 5–6 |
| Direct → owners + Shared | 6–7 |
| I handle → me then Send | 6, 8 |
| Multi-supplier Direct names | 7 |
| Soft-hide / no guess | 6, 8 |
| Take over escape | 7 (label); existing takeControl API |
| Curate ≠ handle default | 1–2 default `direct` |

## Self-review notes

- No TBD left for Phase A routing.
- Phase B is explicitly gated so Phase A can ship trustworthy **seller identity** first.
- Message metadata stamp is required so recipients don’t re-read a changed Profile (trust).

---

## Execution

Plan saved to `docs/superpowers/plans/2026-08-21-direct-vs-handle-settings.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — this session, executing-plans with checkpoints  

Which approach?
