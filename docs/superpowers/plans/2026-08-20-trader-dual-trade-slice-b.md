# Trader dual trade Slice B — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Trading presence gate (default off; on for QA), Manage (buyer↔trader + linked upstream, soft-hide), Direct-with-facilitator (informed + Take control), and curated-pack source auto-exclude on Explore.

**Architecture:** Extend trade presence with `tradingEnabled` / `presence.trading`. Extend `Order` with `tradeMode`, `facilitatorCompanyId`, and `downstreamOrderId`. `POST /orders/from-pack` creates Manage downstream + auto upstream batch when trader has trading on. Batch gains optional `facilitatorCompanyId`. Serializer soft-hides; audience excludes curated sources. Connection/collection settings UI still out of scope.

**Tech Stack:** NestJS + Prisma, `@ekum/domain-types`, React Query + React Router, Vitest.

**Spec:** [docs/superpowers/specs/2026-08-20-trader-dual-trade-slice-b-design.md](../specs/2026-08-20-trader-dual-trade-slice-b-design.md)

## Global Constraints

- **Trading presence:** product default **off**; **while building/testing B keep ON** via seeds + temporary `resolveTradePresence` unset→on; flip to unset→off before calling B done.
- Not an OTP Trader role — third toggle beside buy/sell only.
- When trading off: hide Curate + dual-trade UI; API `TRADING_REQUIRED` for from-pack / take-control / facilitator.
- Defaults: curated pack Order → **Manage**; forward Order → **Direct** + facilitator informed.
- Soft hide only (no Connection blocks). Hard anonymity = Slice D.
- Provenance remains **Reference** (`product.companyId` for upstream sellers).
- Reuse `create` / `createBatch` grouping by `product.companyId` for upstream.
- No Trade entity; link fields on `Order` (return-escalate style).
- Opaque businesses; plain UI copy — avoid jargon in chrome.
- Commit to `main` only when green; no feature branch required.
- Out of scope: Managed buyers UI, connection/collection settings ladder, on-behalf, multi-hop, supplier notify.

## File map

| Area | Files |
|------|--------|
| Trade presence | `packages/domain-types/src/company.ts`, `settings.ts`; `apps/api/src/identity/trade-presence.ts`; `settings.service.ts`; `ProfilePage.tsx`; seeds |
| Schema | `apps/api/prisma/schema.prisma` + migration |
| Enums / contracts | `packages/domain-types/src/enums.ts`, `orders.ts` |
| Orders API | `apps/api/src/orders/order.service.ts`, `order.controller.ts`, `order.serializer.ts`, specs |
| Audience | `apps/api/src/catalog/audience-visibility.ts` (+ spec), Explore/collection list queries |
| Web place / gate | Curate ＋ entry, `useShortlistOrderFlow.ts`, `OrderDetailPage.tsx` |
| Docs | `docs/features/orders.md`, `00-concepts.md`, `settings.md`, `feature-gap-matrix.md` |

## Locked field names

```prisma
// On Order (additions)
tradeMode            String  @default("bilateral") // bilateral | manage | direct
facilitatorCompanyId String?
downstreamOrderId    String? // set on upstream Manage orders → buyer-facing Manage order
```

- `manage` = buyer-facing Manage order (seller = trader).
- Upstream linked rows stay `tradeMode: "bilateral"` (normal trader-as-buyer) with `downstreamOrderId` set — trader is buyer, supplier is seller.
- `direct` = buyer↔supplier with `facilitatorCompanyId` set.

```ts
// domain-types
export const OrderTradeMode = {
  Bilateral: 'bilateral',
  Manage: 'manage',
  Direct: 'direct',
} as const;
```

`OrderView` additions:
- `tradeMode: string`
- `facilitatorCompanyId: string | null`
- `downstreamOrderId: string | null`
- `relatedOrders: Array<{ id: string; role: 'downstream' | 'upstream'; sellerName: string | null; buyerName: string | null; status: string }>` — **names null for actors who must soft-hide**
- `canTakeControl?: boolean` — true when actor is facilitator, mode direct, status requested, no seller quote yet

---

### Task 0: Trading presence toggle

**Files:**
- Modify: `packages/domain-types/src/company.ts` (`TradePresence.trading: boolean`)
- Modify: `packages/domain-types/src/settings.ts` (`tradingEnabled` on update schema)
- Modify: `apps/api/src/identity/trade-presence.ts` (+ `.spec.ts`)
- Modify: `apps/api/src/settings/settings.service.ts` (+ spec)
- Modify: `apps/web/src/features/settings/ProfilePage.tsx`
- Modify: seed company settings (demo traders `tradingEnabled: true`)
- Gate: Curate ＋ sheet / routes that offer Curate pack — hide when `!tradePresence.trading`

**Interfaces:**
- Produces: `resolveTradePresence` → `{ buying, selling, trading }`
- Produces: `UpdateCompanySettingsDto.tradingEnabled?: boolean`

- [ ] **Step 1: Failing tests**

```ts
// trade-presence.spec.ts
it('trading defaults off when unset (product rule)', () => {
  // After QA flip: expect trading false when unset
});

it('trading on when tradingEnabled true', () => {
  expect(resolveTradePresence({ tradingEnabled: true }).trading).toBe(true);
});
```

During Slice B WIP, implement resolve as:

```ts
trading: defaults.tradingEnabled === true || defaults.tradingEnabled === undefined
// TODO(slice-b-ship): change to `defaults.tradingEnabled === true` only (unset = off)
```

Comment must stay until ship flip. Seeds set `tradingEnabled: true` explicitly for demo dual-network companies.

- [ ] **Step 2: Wire settings + Profile**

Same pattern as buy/sell: `tradingEnabled` merged into `tradeDefaults`. Profile third toggle:

```tsx
<TradeToggle
  label="I trade on Ekum"
  on={presence.trading}
  disabled={setTradeSide.isPending}
  onToggle={() => setTradeSide.mutate({ tradingEnabled: !presence.trading })}
/>
```

Helper copy: “Curate packs and manage orders for buyers. Turn off if you only buy or sell your own catalog.”

Allow all three off? Prefer: at least one of buy/sell remains (existing rule); trading independent (can be on with buy and/or sell).

- [ ] **Step 3: Gate Curate entry**

If `!presence.trading`, hide Curate pack in ＋ / Catalog. Deep link to Curate shows plain “Turn on Trading in Profile” (or redirect).

- [ ] **Step 4: Build domain-types, unit tests PASS, commit**

`git commit -m "feat: trading presence toggle beside buy and sell"`

---

### Task 1: Schema + domain types

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (`Order` model)
- Create: migration `order_trade_link`
- Modify: `packages/domain-types/src/enums.ts`, `orders.ts`, package export/build

**Interfaces:**
- Produces: `OrderTradeMode`, extended `OrderView`, `createOrdersFromPackSchema`, batch optional `facilitatorCompanyId`, `takeControl` empty body

- [ ] **Step 1: Write failing domain-types compile check** — add `OrderTradeMode` and extend schemas; build should fail until Prisma/serializer catch up is fine; first make types build.

```ts
// enums.ts — add
export const OrderTradeMode = {
  Bilateral: 'bilateral',
  Manage: 'manage',
  Direct: 'direct',
} as const;
export type OrderTradeMode = (typeof OrderTradeMode)[keyof typeof OrderTradeMode];
export const orderTradeModeValues = values(OrderTradeMode);
```

```ts
// orders.ts — extend createOrdersBatchSchema
facilitatorCompanyId: z.string().min(1).optional(),

// new
export const createOrdersFromPackSchema = z.object({
  collectionId: z.string().min(1),
  kind: z.enum(orderKindValues).default(OrderKind.Standard),
  intent: z.enum(orderIntentValues).default(OrderIntent.Order),
  note: z.string().trim().max(1000).optional(),
  items: z
    .array(orderItemInputSchema.extend({ productId: z.string().min(1) }))
    .min(1)
    .max(200),
});
export type CreateOrdersFromPackDto = z.input<typeof createOrdersFromPackSchema>;
```

Extend `OrderView` with fields listed above (`relatedOrders` default `[]`).

- [ ] **Step 2: Prisma fields on Order**

Add `tradeMode`, `facilitatorCompanyId`, `downstreamOrderId` + index on `downstreamOrderId` + optional self-relation:

```prisma
facilitatorCompanyId String?
downstreamOrderId    String?
tradeMode            String   @default("bilateral")

facilitator Company? @relation("OrderFacilitator", fields: [facilitatorCompanyId], references: [id], onDelete: SetNull)
downstream  Order?   @relation("OrderUpstreamLink", fields: [downstreamOrderId], references: [id], onDelete: SetNull)
upstreams   Order[]  @relation("OrderUpstreamLink")
```

Wire `OrderFacilitator` on `Company`. Migrate:

`pnpm --filter @ekum/api exec prisma migrate dev --name order_trade_link`

- [ ] **Step 3: Build domain-types**

`pnpm --filter @ekum/domain-types build` — expect PASS.

- [ ] **Step 4: Commit**

`git add apps/api/prisma packages/domain-types && git commit -m "feat: order tradeMode and link fields for Slice B"`

---

### Task 2: snapshotItems Manage + `createFromPack`

**Files:**
- Modify: `apps/api/src/orders/order.service.ts` (`snapshotItems`, new `createFromPack`)
- Modify: `apps/api/src/orders/order.controller.ts`
- Test: `apps/api/src/orders/order.service.spec.ts` (extend)

**Interfaces:**
- Consumes: `CreateOrdersFromPackDto`, `OrderTradeMode`
- Produces: `createFromPack(actor, userId, dto) → { downstream: OrderView; upstreams: OrderView[]; failures: CreateOrdersBatchFailure[] }`

- [ ] **Step 1: Failing tests**

```ts
it('createFromPack: curated collection → manage downstream + upstream per supplier', async () => {
  // mock collection owned by trader T with products of S1 and S2
  // expect one order seller=T tradeMode=manage
  // expect two upstreams buyer=T downstreamOrderId=downstream.id
});

it('createFromPack: rejects when collection has no foreign members (not curated)', async () => {
  // expect BadRequest CURATION_REQUIRED or use normal batch message
});

it('snapshotItems manage: allows foreign productId when seller is trader', async () => {
  // product.companyId !== sellerCompanyId still snapshots
});
```

Run: `pnpm --filter @ekum/api test -- order.service.spec` — expect FAIL.

- [ ] **Step 2: Relax `snapshotItems`**

Add optional flag or overload: when `opts.allowForeignProducts === true`, load products by id only (no `companyId: dto.sellerCompanyId` filter). Keep default strict for bilateral/direct.

- [ ] **Step 3: Implement `createFromPack`**

1. Load collection by `dto.collectionId`; 404 if missing.
2. Load products for item ids; verify each product is a **member** of the collection (or allow any discoverable member set — prefer membership check).
3. Require **at least one** `product.companyId !== collection.companyId` (curated). Else `BadRequest` `{ code: 'NOT_CURATED', message: 'Use Order for a curated pack.' }`.
4. `assertCanTrade(buyer, collection.companyId, { productIds })` — buyer↔trader.
5. If pack owner `!resolveTradePresence(...).trading` → `{ code: 'TRADING_REQUIRED', message: 'This business is not taking pack orders right now.' }`.
6. Create downstream via internal create path: seller = collection.companyId, `tradeMode: manage`, `allowForeignProducts: true`, all items, buyer thread with trader only.
7. Group items by `product.companyId`. For each supplier: `assertCanTrade(trader, supplier, …)` then create order buyer=trader, seller=supplier, `downstreamOrderId=downstream.id`, normal snapshot (products belong to supplier), note optional `For order #…`.
8. On upstream trade-access failure, push to `failures` (downstream still created — trader can retry upstream later). Document this in test.
9. Return `{ downstream, upstreams, failures }`.

Controller: `POST /orders/from-pack` → that result (HTTP 200 with partial failures).

- [ ] **Step 4: Tests PASS + commit**

`git commit -m "feat: manage orders from curated pack with upstream links"`

---

### Task 3: Soft hide + relatedOrders in serializer / getById

**Files:**
- Modify: `apps/api/src/orders/order.serializer.ts`
- Modify: `apps/api/src/orders/order.service.ts` (`get` / `requireOrder` access)
- Test: serializer or service spec

**Interfaces:**
- Produces: `relatedOrders` on detail; soft-null names

- [ ] **Step 1: Failing tests**

```ts
it('buyer on manage order does not see upstream supplier names', async () => {
  // relatedOrders role upstream → sellerName null, buyerName null for buyer actor
});

it('supplier on upstream does not see downstream buyer name', async () => {
  // relatedOrders downstream → buyerName null
});

it('trader sees both sides on relatedOrders', async () => {
  // names present
});
```

- [ ] **Step 2: Access**

`requireOrder` / get: allow actor if buyer, seller, **or** `facilitatorCompanyId === actor` (Direct informed).

- [ ] **Step 3: Load related**

When serializing detail for order O:
- If O has upstreams (`downstreamOrderId` null and others point at O): include them as `upstream`.
- If O.`downstreamOrderId`: include downstream as `downstream`.
- Apply soft-hide by actor role (buyer of manage / seller of upstream vs trader who is seller of manage or buyer of upstream).

- [ ] **Step 4: PASS + commit**

`git commit -m "feat: soft-hide related orders for manage dual trade"`

---

### Task 4: Curated source auto-exclude on discover

**Files:**
- Modify: `apps/api/src/catalog/audience-visibility.ts` (+ `.spec.ts`)
- Modify: Explore / shop list paths that use `canDiscoverCollection` or `audienceVisibilityOr` — likely `collection.service.ts` / explore feed builder; ensure list queries also exclude (AND NOT viewer in source set).

**Interfaces:**
- Produces: `canDiscoverCollection(..., { sourceCompanyIds?: string[] })` or separate `isCuratedSourceViewer(viewerId, memberCompanyIds)`

- [ ] **Step 1: Failing tests**

```ts
it('source supplier cannot discover curated pack even when connections audience', () => {
  expect(canDiscoverCollection('supplier-a', coll, { connected: true }, ['supplier-a'])).toBe(false);
});

it('other connected buyer can discover', () => {
  expect(canDiscoverCollection('buyer-b', coll, { connected: true }, ['supplier-a'])).toBe(true);
});

it('owner can always discover', () => {
  expect(canDiscoverCollection('trader', coll, {}, ['supplier-a'])).toBe(true);
});
```

- [ ] **Step 2: Implement**

After owner check: if `sourceCompanyIds.includes(viewerCompanyId)` → false.  
For Prisma list: when fetching published collections for viewer, exclude collections that have any `CollectionProduct.product.companyId === viewerCompanyId` **and** any foreign member (curated). Efficient approach: raw filter in service after join, or `NOT: { products: { some: { product: { companyId: viewerId } } } }` **only when** collection also has foreign products — approximate with: exclude if viewer owns a product on the collection **and** collection.companyId !== viewerId (viewer is never owner). That matches “source company of a member on someone else’s pack.”

```ts
// Explore AND clause addition when viewer is not browsing own shop:
{
  OR: [
    { companyId: viewerCompanyId },
    { NOT: { products: { some: { product: { companyId: viewerCompanyId } } } } },
  ],
}
```

Own shop listing for the curator unchanged (they are owner).

- [ ] **Step 3: PASS + commit**

`git commit -m "fix: hide curated packs from source supplier companies"`

---

### Task 5: Direct facilitator on batch + Take control

**Files:**
- Modify: `order.service.ts` `create` / `createBatch`, controller `POST /orders/:id/take-control`
- Test: `order.service.spec.ts`

**Interfaces:**
- Consumes: `facilitatorCompanyId` on batch/create
- Produces: `takeControl(actor, userId, orderId) → { downstream, upstream, cancelledOrderId }`

- [ ] **Step 1: Failing tests**

```ts
it('createBatch with facilitatorCompanyId sets tradeMode direct', async () => { ... });

it('facilitator can get order', async () => { ... });

it('takeControl: cancels direct and creates manage pair', async () => { ... });

it('takeControl forbidden if not facilitator or after quote', async () => { ... });
```

- [ ] **Step 2: create / createBatch**

If `facilitatorCompanyId` present: require facilitator `trading` on; set `tradeMode: direct`, store facilitator; reject if facilitator === buyer or seller. Do not add facilitator to trade thread yet (bilateral thread stays buyer↔supplier). Facilitator informed via order get + Orders list filter including facilitator.

List query: `OR: [{ buyer }, { seller }, { facilitatorCompanyId: actor }]`.

- [ ] **Step 3: Take control** (only `requested`, all lines open, no seller Rate quote)

Actor must be `facilitatorCompanyId` and have `trading` on. Then:
1. `createFromPack`-like pair **without** collection: downstream buyer=original.buyer, seller=facilitator, same items, `tradeMode: manage`, foreign snapshots allowed.
2. Upstream: buyer=facilitator, seller=original.seller, same items, `downstreamOrderId=newDownstream.id`.
3. Cancel original Direct order (existing cancel path); chat event noting takeover plain copy: “Taken over by {facilitatorName}.”
4. Return new pair views.

Multi-supplier Direct: Take control only on **one** order at a time (per supplier order). UI shows per-order button.

- [ ] **Step 4: PASS + commit**

`git commit -m "feat: direct facilitator watch and take control"`

---

### Task 6: Web — place from curated pack + order detail

**Files:**
- Modify: browse/shortlist or collection Order CTA to call `/orders/from-pack` when `collectionId` is curated context
- Modify: `OrderDetailPage.tsx` — Related orders block; Take control button when `canTakeControl`
- Modify: `useShortlistOrderFlow.ts` — optional `collectionId` / `facilitatorCompanyId` on mutate
- Test: focused component/unit if present; else manual checklist below

- [ ] **Step 1: Place path**

When ordering from a collection detail / curated pack surface, POST `/orders/from-pack` with `collectionId` + lines. Confirmation sheet: show downstream chat link + upstream failure list if any.

When ordering from shortlist **without** pack id, keep `/orders/batch`. If share/forward metadata later supplies `facilitatorCompanyId`, pass it on batch (wire prop now; can be unused until forward attribution exists).

- [ ] **Step 2: Detail UX**

- Related orders / Take control only when `tradePresence.trading` (or order already marks actor as facilitator/manage seller — show Take control if `canTakeControl` from API).
- Take control: confirm sheet → POST take-control → navigate to new manage order.

- [ ] **Step 3: Manual smoke**

1. Curated pack (2 suppliers) → from-pack → buyer sees one You-buy order with trader; trader sees related upstreams; supplier order has no buyer name of end customer.
2. Source supplier account: curated pack not on Explore.
3. Direct batch + facilitator id (API or UI) → facilitator opens order; Take control while requested.

- [ ] **Step 4: Commit**

`git commit -m "feat: web manage pack order and take control UX"`

---

### Task 7: Docs + gap matrix

**Files:**
- Modify: `docs/features/orders.md`, `docs/features/00-concepts.md`
- Modify: `docs/superpowers/reviews/feature-gap-matrix.md` (Slice B rows → Works / Unit)
- Spec status line → Implemented when shipped

- [ ] **Step 1: Document** Manage / Direct / from-pack / soft-hide / source exclude; settings deferred.
- [ ] **Step 2: Commit**

`git commit -m "docs: Slice B dual trade orders"`

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Trading presence toggle (default off; QA on) | 0 |
| Gate Curate / dual-trade when off | 0, 2, 5, 6 |
| Manage from curated pack | 2, 6 |
| Upstream split + link | 2 |
| Soft hide | 3 |
| Direct + informed | 5 |
| Take control | 5, 6 |
| Source auto-exclude | 4 |
| Deeper settings deferred | Global + 7 |
| Batch split reuse | 2 |
| No hard anonymity | Global |

## Open resolved in this plan

| Open in spec | Lock |
|--------------|------|
| Prisma fields | `tradeMode`, `facilitatorCompanyId`, `downstreamOrderId` |
| Status sync | None automatic in B — related list only |
| Take control shape | Cancel Direct → new Manage pair (requested only) |
| Forward attribution | Optional `facilitatorCompanyId` on batch; full share metadata later |
| Facilitator chat ACL | Order access + list only in B (not third participant on buyer↔supplier thread) |
