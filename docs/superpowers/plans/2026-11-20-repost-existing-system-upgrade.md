# Repost existing-system upgrade — Implementation Plan (Batch 0)

> **For agentic workers:** Extend existing Repost. Do **not** rebuild. REQUIRED: follow Completeness [`2026-11-20-repost-upgrade-completeness.md`](../reviews/completeness/2026-11-20-repost-upgrade-completeness.md) and Phase 3.1 locks. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Upgrade Ekum’s existing Repost (Collection lineage + propagate + ceilings + Explore/Curate UI + two-Order) for live sync, mesh paths, soft unavailable, four-dimension pricing, and bounded order snapshots.

**Architecture:** Delta on `Collection` / `CollectionProduct` / `CollectionPropagateService` / discovery serializers / `RepostSheet` / `order.service` — reuse TradeLane, Follow, chat. No parallel relationship graph. No Buyer/Trader/Supplier roles.

**Tech Stack:** NestJS + Prisma, `@ekum/domain-types`, React Query web, Vitest, Playwright.

**Locks:** Phase 1–3.1 audits; client prototype (behaviour reference, not blind copy).

**Batch 0 status:** Documentation only (this plan + Completeness). **No application code, schema, migrations, or tests in Batch 0. Do not start Batch 1 until READY accepted.**

---

## 1. Existing architecture assessment (verified 2026-11-20)

### What already works

| Capability | Evidence |
|------------|----------|
| Quick Repost Explore | `RepostSheet` → create + setProducts + publish; Who Followers/Selected; 48h link |
| Curated multi-pick | `CurateFromSelectionSheet`; add existing / draft / Publish |
| Immediate-source uniqueness | Partial unique `(companyId, repostSourceCollectionId\|ProductId)` |
| ALREADY_REPOSTED / reuse Draft or auto Selected | `resolveRepostSource`, `shouldReuseRepostChild` |
| Curation ceilings | `curation-ceiling.ts` look-only, allowForward, audience, rate visibility |
| Direct Link auto-repost (lane-gated) | `collection-propagate.service.ts` + `direct-link-repost-audience.ts` |
| Credit hop ceiling logic | `source-shop-credit.ts` `revealedCreditCompanyId` — first hide wins |
| Auto-repost forces `showSourceShops: true` | `collection-propagate.service.ts` ~238 — **must not** bypass upstream hide for visitor credit |
| Pack→Look chat line | `follow.service.ts` `share_revoked` |
| Two-Order Place | `createFromPack` / `pathForPair` — pack owner + `product.companyId` |
| Foreign Product rates not stamped on curate | `setProducts` stamps own catalog only |

### Partially works / defective

| Issue | Code | Locked fix |
|-------|------|------------|
| Auto unique per **root** collapses mesh | migration `20261028160000`; `deliverToTrader` OR root | Drop root unique; survivor by **immediate source only** |
| Propagate only TradeLane traders | `propagate()` `tradeLane.findMany` | Sync **all** children with matching `repostSourceCollectionId` |
| Manual one-shot for non-lane | no child walk | Live relationship for manual+auto |
| Unpublish → **Draft** children | `hideImmediateChildren` | P1 = soft **unavailable**, not Draft |
| `allowForward` off only skips new deliver | `deliverToTrader` early return | Descendants unavailable immediately |
| Credit loader `depth < 4` | `explore.service.ts` / `search.service.ts` | Full walk; fail closed |
| No calculation modes | Repost sheet Show rates only | Same / fixed ₹ / % / Edit + design overrides |
| Ask already = `rateVisibility` | `on_request` is Ask today | **Reuse** `rateVisibility: on_request`; **no** `repostPricingMode=ask`; **no** blind migrate/reinterpret |
| No membership provenance/exclude | `CollectionProduct` id/position only | synced/local/excluded + explicit re-add |
| `passMillLinesToParent` sets parent `rate` from mill | `order.service.ts` ~5447–5452 | Must not overwrite buyer-facing parent rate |
| Pack→Look does not stop sync explicitly | follow + deliver check Allowed only | P4: stop sync/curate on edge; P3 shop-wide bulk Look |

### Missing

- Soft unavailable API shell (all surfaces)
- Shop-wide Pack company policy (P3)
- Server pricing resolver (four dimensions)
- Propagate notifications (Batch 4)
- Unified entry-point polish (Batch 4 / optional)

---

## 2. Requirement-to-code gap matrix

| Requirement | Class | Primary change |
|-------------|-------|----------------|
| Mesh: two paths → two packs | **Defective** | Drop root unique; fix survivor OR |
| Live sync manual+auto | **Partial** | Children-by-source sync |
| Exclusion sticky / explicit re-add | **Missing** | `CollectionProduct` fields |
| Synced vs local provenance | **Missing** | same |
| P1 collection Allow Repost OFF → unavailable | **Missing/Defective** | availability helper; stop Draft-for-disallow |
| P2 product forward OFF → product only | **Partial** | curate-check + sync skip + member shell |
| P3 shop-wide Pack OFF | **Missing** | company flag + bulk Look + block grants |
| P4 Pack→Look/unfollow | **Partial** | stop sync; keep packs |
| P5 Direct Link no bypass | **OK** | keep Pack gate + P1–P4 |
| Identity hide cumulative + fail closed | **Partial** | remove 4-cap; fail closed; **any upstream hide blocks revealing original supplier downstream forever on that path** — including auto-repost / Direct Link even when child `showSourceShops` is true |
| Ask = existing `rateVisibility: on_request` | **OK / Partial** | Reuse field + inquiry; cards already omit ₹ when not `visible`; do **not** add Ask enum |
| Same/Margin live + disclosed only | **Missing** | resolver |
| Edit independence + ownBase | **Missing** | resolver + storage |
| Independent quote permission | **Missing** | allow Edit without disclosed source |
| Never mutate foreign Product.rate | **OK** | guard in tests |
| Legacy `on_request` preserved | **Required** | no blind migrate; no reinterpret as a new Ask mode |
| Parent snapshot buyer-facing | **Missing** | `snapshotItems` |
| passMill no overwrite | **Defective** | `passMillLinesToParent` |
| Bounded order parties | **OK** | no change to party model |
| Notifications | **Missing** | Batch 4 |

---

## 3. Final target architecture

```text
Source Collection (S)
  └─ children: Collections where repostSourceCollectionId = S.id
       (manual OR automatic; unique per owner+immediate source)

Membership (CollectionProduct):
  origin synced|local · excluded · optional pricing override

Availability (≠ status):
  P1 on original supplier collection → soft-unavailable all descendants

Pricing (server resolveRepostDesignPricing):
  sourceRate · sourceDisclosed · buyerFacing · canQuoteIndependent
  calculation modes: same | margin_fixed | margin_percent | edit
  visibility (independent): Collection/Product.rateVisibility
    visible | on_request   ← on_request IS Ask (existing inquiry)

Orders (unchanged parties):
  Buyer ↔ pack owner ↔ product.companyId (SKU owner)
```

**Permission matrix (locked)** — see Completeness / Phase 3.1: P1–P5.

**Pricing dimensions (locked):** source rate; source disclosure; buyer-facing rate; independent quote permission.  
**Visibility (locked, separate):** `rateVisibility` — Ask = `on_request`; do **not** collapse into calculation mode.

---

## 4. Schema changes and migration plan

### Add (Batch 1–3 as needed)

**Collection** (Batch 3 calculation — **not** visibility)
- `repostPricingMode` String? (`same|margin_fixed|margin_percent|edit`) — **never** `ask`
- `repostMarginValue` Decimal?
- `repostEditedRate` Decimal?
- `repostEditOwnBase` Decimal? (null = independent Edit)
- Keep existing `rateVisibility` (`visible` \| `on_request`) — **Ask = `on_request`**
- Optional: `contentUnavailableAt` DateTime? (cache; derive preferred)
- P3 shop Pack: `tradeDefaults.shopRepostPackAllowed` (Batch 2 — done)

**CollectionProduct**
- `membershipOrigin` / `excluded` / `explicitlyAddedAt` (Batch 1 — done)
- Override: `pricingMode`, `marginValue`, `editedRate`, `editOwnBase` (nullable = inherit; modes same set — **no** `ask`)

### Change / drop

- **Drop** partial unique `(companyId, repostRootCollectionId) WHERE repostOrigin = 'automatic'` (Batch 1 — done)
- Keep `(companyId, repostSourceCollectionId|ProductId)` uniqueness

### Backfill

| Data | Strategy |
|------|----------|
| `repostPricingMode` | New/updated reposts: default **`same`** when rates are being calculated. **Never** invent `ask`. **Never** rewrite existing `rateVisibility` |
| `rateVisibility` | Unchanged — existing `on_request` / `visible` rows keep current behaviour |
| Members | In source → `synced`; else `local`; `excluded=false` (Batch 1) |
| Product rates | **No writes** |

---

## 5. Implementation batches and dependencies

```text
Batch 0 (this doc) ──► Batch 1 (mesh + membership + sync)
                         │
                         ├─► Batch 2 (P1–P5 + identity)
                         │
                         └─► Batch 3 (pricing + orders)  [needs membership rows for overrides]
                                      │
                                      └─► Batch 4 (UX + notify + e2e)
```

Adjust only if schema for pricing overrides must land with Batch 1 (prefer Batch 1 membership columns; Batch 3 pricing columns on same or follow-up migration).

### Batch 0 — Documentation (DONE in this task)

- [x] Completeness `2026-11-20-repost-upgrade-completeness.md`
- [x] This delta plan
- [x] Feature doc locks (`explore.md`, `collections.md`, `orders.md`)
- [x] Gap matrix row (`feature-gap-matrix.md`)

### Batch 1 — Mesh, provenance, propagation, exclusions

**Files:** `collection-lineage.ts`, `collection-propagate.service.ts`, `collection.service.ts`, Prisma + migration, domain types, specs, e2e mesh/sync

**Status:** Implemented 2026-11-20 (unit + propagate specs). Playwright mesh/sync e2e deferred to Batch 4 with UX journeys.

**AC:**
- [x] S1→A→C and S1→B→C both exist; sync A ≠ mutate C_via_B (unit: mesh immediate-source lookup)
- [x] Manual child receives new source designs (unit: syncAllImmediateChildren + Example C)
- [x] Exclusion sticky; explicit re-add clears; sync cannot re-exclude (unit: `repost-membership.spec`)
- [x] Manual + Direct Link same immediate source → one pack (unit)

**Depends on:** Batch 0 feature docs accepted

### Batch 1.1 — Hardening (membership leaks, share-link, sync lock, migration ops)

**Status:** Implemented 2026-11-20. Closes Batch 1 review findings H1–H3 / M1–M7 (H4 → Batch 2).

**AC:**
- [x] Buyer-facing membership ignores `excluded` (Place, Explore thumbs, feed cover, has-published, trade-access, search/shop)
- [x] Owner album still sees excluded tombstones (`ProductView.excluded`)
- [x] Share: create unrestricted; guest `open=false` no designs; claim navigates only (no auto view grant); teasers skip excluded; unpublished refuse claim
- [x] Source sync uses `Collection` `FOR UPDATE` + `forcePreserveExclusions`
- [x] Migration one-shot docs + watermark orphan DELETE + root-mesh audit SQL (no auto-delete of history)

### Share-link access lock (post Batch 1.1 — before Batch 2)

**Status:** Locked + implemented 2026-11-20. Does **not** start Batch 2.

**Locks:**
- [x] Share/forward unrestricted; claim never creates `CollectionViewGrant`
- [x] Recipient **Ask / Request Access** → pack owner **Allow** (reuse existing workflow)
- [x] Allow writes `CollectionViewGrant.expiresAt` = grantedAt + 48h; link TTL remains independent 48h from mint
- [x] Every view-access check treats `expiresAt <= now` as inactive (even if row not deleted)
- [x] Revoke deletes grant immediately; trader Allow refuses when immediate source unavailable (`UPSTREAM_RESTRICTED`)
- [x] Specs: `share-link.service.spec`, `share-link-access.spec`, `collection-view-grant.spec`

### Batch 1.1.1 — Collection FOR UPDATE on catalog/relocate repost writes

**Status:** Implemented 2026-11-20. Closes remaining Batch 1.1 lock gap. Does **not** start Batch 2.

**AC:**
- [x] `setProducts` catalog branch: `Collection FOR UPDATE` when `isRepost` (before stamp/relocate/membership writes)
- [x] `setProducts` relocate-into-regular branch: same Collection lock when `isRepost`
- [x] Default + sync paths keep existing lock ordering; Product `FOR UPDATE` for catalog stamps unchanged after Collection lock
- [x] Specs: `set-products-repost-lock.spec` + existing `sync-repost-membership.spec` / `repost-membership.spec`

### Hop permission lock (pre–Batch 2 — docs + curate enforcement)

**Status:** Locked 2026-11-20. Docs + `relistGrantedProductIds` owner-pack-only + `repost-permission-hops.spec`. Does **not** start Batch 2 soft-unavailable / P3 / pricing.

**Locks:**
- [x] Repost permission is **relationship-specific** (collection × recipient) — never auto-inherited by the recipient’s buyers or further descendants
- [x] Each hop needs its own explicit grant (TradeLane Pack / ProductRelistGrant / **original seller** pack open) — reuse existing graph; no parallel permission system
- [x] Trader Allow / mid-hop `allowForward` cannot override an upstream lock for the next curator
- [x] Direct Link + auto-repost obey the same hop rule (mill Pack for trader ≠ Pack for that trader’s buyers)
- [x] View (`CollectionViewGrant`) ≠ Repost/Curate
- [x] Do **not** silently rewrite existing audience / live packs when locking this rule
- [x] Specs: `repost-permission-hops.spec` (+ curation-ceiling grant isolation)

### Batch 2 — Permission ceilings, availability, identity

**Status:** Implemented 2026-11-20. Pricing / Batch 3 not started.

**Files:** `repost-availability.ts`, `load-upstream-packs.ts`, `load-source-credit-hops.ts`; `follow.service.ts` / controller; explore/search/company credit loaders; `collection-propagate.service.ts`; tradeDefaults `shopRepostPackAllowed`

**AC:**
- [x] P1 soft-unavailable derived from upstream allowForward/status (no Draft children); restore without recreate
- [x] P2 product-only filter on buyer album surfaces
- [x] P3 shop-wide Pack OFF via `tradeDefaults.shopRepostPackAllowed` + bulk Pack→Look; block new Pack grants
- [x] P4 Pack gate on deliver + child sync (`isPackFollow`)
- [x] P5 Direct Link still requires Pack + allowForward
- [x] Credit full walk (no depth&lt;4); incomplete/cyclic fail closed; `showSourceShops: true` cannot override upstream hide
- [x] Hop permission preserved (owner-pack-only unlock + Pack gate)
- [x] Specs: `repost-availability`, `source-shop-credit-full-chain`, `follow-shop-pack`, `collection-propagate-pack-gate`, hop regressions

**Depends on:** Batch 1 lineage/sync stable

### Batch 3 — Pricing resolver + order snapshots

**Status:** Docs corrected 2026-11-20 (Ask = `rateVisibility: on_request`). **Not started in code** until this correction is accepted.

**Files:** `packages/domain-types` resolver + specs; Collection/member **calculation** columns; `RepostSheet` / `PublishAudienceFields` / editor; serializers that already respect `rateVisibility`; `snapshotItems`; `passMillLinesToParent`

**AC:**
- **Ask** = existing `rateVisibility: on_request` — reuse inquiry (`intent: inquiry` / Ask for rates); **no** `repostPricingMode=ask`; **no** new Ask enum/DB field; **no** duplicate inquiry workflow
- Calculation modes only: **Same / fixed ₹ / % / Edit** (collection default + design override)
- `rateVisibility` stays independent of calculation mode (visible vs on_request)
- Legacy `on_request` / `visible` rows: **preserve** current behaviour — do **not** blind-migrate or reinterpret as a new Ask mode
- When `on_request`: do not expose buyer-facing ₹ on buyer-facing card serializers; do not leak restricted upstream source rates through metadata/API
- Same/Margin: disclosed+present only; live recompute from **immediate** upstream buyer-facing (not root)
- Edit independence matrix (missing/restricted/revoke/value change; `ownBase`)
- Parent buyer-facing snapshot; mill hop separate; passMill no overwrite; history immutable
- Never mutate foreign `Product.rate`

**Depends on:** Batch 1 member rows (for overrides); Batch 2 availability so unavailable packs don’t leak rates

#### Batch 3 Ask / visibility audit (locked 2026-11-20)

| Fact | Evidence |
|------|----------|
| Ask already exists | `RateVisibility.OnRequest = 'on_request'` (`packages/domain-types/src/enums.ts`); Publish defaults often `on_request` |
| Card band already gated | `collectionCardRateFields` returns empty unless `rateVisibility === visible` (`collection-card-rate.ts`) |
| Inquiry already exists | Orders **Ask for rates** → `intent: inquiry` (`orders.md`); reuse — no new Ask inquiry |
| Album/product detail today | Connected viewers may still see rates when `on_request` on some detail paths — **legacy behaviour to preserve** for existing rows; do not invent a parallel Ask mode to “fix” this |
| Auto-repost | Propagate copies source visibility as visible→visible else on_request (`collection-propagate.service.ts`) |

### Batch 4 — UX, notifications, regression

**Files:** entry-point polish if scoped; notification listeners; Playwright journeys

**AC:** Notify on synced add; regress Direct Link + own-repost + curate journeys; trader-eye BM-11

---

## 6. API and UI integration points

| Surface | Change |
|---------|--------|
| `POST/PATCH` collections publish | Pricing DTO; availability asserts |
| `PUT …/products` | Provenance; exclusions; ceilings |
| Propagate job | Children-by-source; respect exclude/unavailable/P4 |
| Explore/album/search/chat serializers | Unavailable shell; `rateVisibility` gate; credit hops |
| `RepostSheet` / Publish / editor | Calculation mode UI (Same/Margin/Edit) + existing Show rates (`rateVisibility`) |
| Follow Pack / shop-wide | P3/P4 |
| `createFromPack` / snapshot / passMill | Buyer-facing vs mill; no party model change |

---

## 7. Permission and pricing test matrix

**Unit:** P1–P5 predicates; resolve Same/Margin/Edit × missing/restricted/disclosed/revoke; ownBase; commission display owner-only; `on_request` omits buyer-facing ₹ on card serializers; no `ask` mode enum.

**API:** Soft shell endpoints; product-level skip; shop-wide Pack; Pack→Look sync stop; Direct Link Pack required; legacy `on_request` unchanged after Batch 3 migrate.

**E2E:** `on_request` → inquiry path (no new Ask workflow); Edit phone quote survives; P1 unavailable/restore.

---

## 8. Mesh, propagation, exclusion tests

- Two paths at C; sync isolation
- Manual live add; excluded sticky; explicit re-add; source remove/re-add
- Auto+manual same source → single pack

---

## 9. Order regression tests

- from-pack Direct + I-handle parties unchanged
- Parent rate = buyer-facing; hop = mill; passMill does not clobber parent when rates differ
- `on_request` → existing inquiry path; `confirmedRate` write-once
- Existing `explore.auto-repost-selected`, `explore.own-repost`, curate journeys green

---

## 10. Rollout and rollback

**Rollout:** Migrate schema (calculation columns only) → deploy API resolver → enable Same/Margin/Edit UI beside existing Show rates → do **not** rewrite `rateVisibility` → feature docs live.

**Rollback:** Keep calculation columns nullable; soft-unavailable already derive-fail-closed (Batch 2); do **not** re-add root unique without data audit; Product rows never written so safe.

**Risks:** Live sync behaviour change for historical manual packs (intentional); legacy `on_request` must keep today’s behaviour (no silent hard-hide reinterpret); traders may confuse Show rates with calculation mode — UI must keep them separate.

---

## File map (implementation)

| Area | Files |
|------|--------|
| Schema | `apps/api/prisma/schema.prisma`, new migration(s) |
| Domain | `packages/domain-types` — pricing DTOs + `repost-pricing.ts` pure resolve |
| Lineage / propagate | `collection-lineage.ts`, `collection-propagate.service.ts`, `direct-link-repost-audience.ts` |
| Collections | `collection.service.ts`, `curation-ceiling.ts` |
| Availability / permission | **new** `repost-availability.ts`, `repost-permission.ts` |
| Credit | `source-shop-credit.ts`, `explore.service.ts`, `search.service.ts` hop loaders |
| Follow / P3 | `follow.service.ts`, company settings |
| Orders | `order.service.ts` (`snapshotItems`, `passMillLinesToParent`) |
| Web | `RepostSheet.tsx`, `PublishAudienceFields.tsx`, editor/viewer shells, explore cards, chat cards |
| Docs | `explore.md`, `collections.md`, `orders.md`, gap matrix |
| Tests | unit + API specs + Playwright `@functional` |

---

## READY

**READY FOR IMPLEMENTATION** of Batches 1–4 after:

1. Feature docs (`explore` / `collections` / `orders`) updated with locked rules (Batch 0 remainder).
2. Product acceptance of this delta plan.

**Batch 0 code boundary respected:** no application code, Prisma schema, migrations, or tests modified in this task.
