# Repost Batch 4 — Feature gap audit & scope proposal

**Date:** 2026-11-20  
**Mode:** Read-only code audit (no schema/code/tests changed)  
**Accepted foundation:** Batches **1–3.2**  
**Not Batch 4 features:** Batch **3.3** staging migrate/smoke, Batch **3.4** functional E2E (release gates only)  
**Disposition:** **Awaiting approval** — do not implement until scoped

---

## Executive verdict

Server locks for mesh, sticky exclude (API), soft-unavailable, Pack gates, identity hops, and pricing resolve/orders are largely **complete**. Remaining product gaps are mostly **UI/shell/notify** so traders can use those locks without fighting the product.

Ship-blockers if ignored:

1. Owner Remove/reload can **clear sticky exclusions** (F-01).  
2. Soft-unavailable albums still look like **Ask to see** (F-02 / F-11).  
3. Pricing calc UI exists only on **Explore RepostSheet**; design overrides and editor/curate paths are incomplete (F-03–F-05).

---

## Already complete (do not re-scope)

| Area | Evidence |
|------|----------|
| Mesh = one pack per company × immediate source | `20261120120000_repost_membership_mesh`; propagate survivor-by-source |
| Live sync manual + auto children | `collection-propagate.service.ts` `syncAllImmediateChildren` |
| Membership provenance / sticky exclude **API** | `packages/domain-types/src/repost-membership.ts`; `collection.service` `setProducts` |
| Soft-unavailable ≠ Draft (P1); restore without recreate | `repost-availability.ts`; `hideImmediateChildren` enqueue-only |
| P2 product filter on buyer album | `filterSoftAvailableProducts` / `excluded: false` joins in explore |
| P3/P4 Pack gates **server** | `setShopRepostPack`, propagate Pack checks |
| P5 Direct Link Pack-gated | propagate `deliverToTrader` |
| Full-chain credit fail-closed | `load-source-credit-hops.ts` |
| Share claim ≠ grant; 48h grant TTL | view-grant + share-link services |
| Pricing resolver + immediate-hop; design override **API** | `repost-pricing.ts`; `PATCH …/member-pricing` |
| Auto child defaults `same` | propagate pricing defaults |
| Order buyer-facing snapshot + passMill non-clobber | `order.service.ts` |
| Explore / shop / search omit soft-unavailable packs | explore / company / search serializers |
| Explore `RepostSheet` pack Same/Margin/Edit + Show rates separate | `RepostSheet.tsx` |

---

## Findings

### F-01 — Sticky exclusion owner UX broken — **defect · P1**

| | |
|--|--|
| **Current** | Owner detail includes tombstones with `excluded: true` (`catalog.serializer.ts` ~226–231; intentional per `collection.service` ~499). Web never reads `excluded` (no matches under `apps/web`). `collectionViewerListedProducts` filters status only (`collectionViewerChrome.ts` ~6–13). `ownerMemberIds` maps **all** `detail.products` (`CollectionViewerPage.tsx` ~653–656). Remove builds next membership from that full list (`packRemoveNextMembership`). Re-including an excluded id **clears** exclusion (`applyOwnerSetProductsToMembership` ~52–58). |
| **Expected vs actual** | Expected: omit from active UI; Remove omits without clearing other tombstones; explicit re-add only. Actual: tombstones behave as members; any membership PUT that re-lists them undoes sticky exclude. |
| **Deps** | Album manage, editor membership, sync, Explore counts |

### F-02 — Soft-unavailable shell = Ask to see — **defect · P1**

| | |
|--|--|
| **Current** | Soft-unavail → `products: null` for non-owners (`explore.service.ts` ~1369–1385, ~1599+). Viewer treats null products as Ask card (`CollectionViewerPage.tsx` ~1627–1639). Grant still cannot show products while soft-unavail (`showProducts` requires `!softUnavailable`). |
| **Expected vs actual** | Expected: plain “not available / waiting on source” — no Ask. Actual: Ask CTA → dead-end or false hope. |
| **Deps** | Album, Saved soft shells, share claim, chat refs |

### F-03 — Design pricing overrides: API only — **incomplete · P1**

| | |
|--|--|
| **Current** | `PATCH /collections/:id/member-pricing` + owner `memberPricing` payload (`collection.service` / controller). **No** web client calls `member-pricing` / `memberPricing`. |
| **Expected vs actual** | Locked: pack default + design override. Actual: override dead to traders. |
| **Deps** | Album/editor, resolver, Place snapshots |

### F-04 — Pricing calc only on Explore RepostSheet — **incomplete · P1**

| | |
|--|--|
| **Current** | `RepostSheet` sends `repostPricingMode` (~397). `CurateFromSelectionSheet` create posts name/cover/hop only (~223–228). Editor publish paths omit calc modes. |
| **Expected vs actual** | Same/Margin/Edit on all repost publish paths; Show rates stays `rateVisibility`. Actual: curate/editor packs often ship `null` mode. |
| **Deps** | Curate, Publish/editor, Explore Repost |

### F-05 — No post-publish calc edit / Edit invalidate UX — **incomplete · P1**

| | |
|--|--|
| **Current** | Publish DTO accepts pricing; editor doesn’t send it. `editInvalidated` (if returned) unused in web. |
| **Expected vs actual** | Trader can fix Margin/Edit and recover invalidated Edit. Actual: stuck / silent null rates. |
| **Deps** | F-03/F-04 |

### F-06 — Propagate sync notifications missing (G-008) — **incomplete · P2**

| | |
|--|--|
| **Current** | Completeness deferred G-008 → Batch 4. Propagate syncs membership / activity; `notification.listeners.ts` has no sync-add handler. |
| **Expected vs actual** | Notify when synced designs land. Actual: silent. |
| **Deps** | Propagate, Notifications, Explore |

### F-07 — Shop-wide Pack OFF (P3): API, no Settings UI — **incomplete · P2**

| | |
|--|--|
| **Current** | `PATCH /follows/shop-repost-pack` (`follow.controller.ts` ~31–36). Per-follower “They can repost” exists; **no** web call to shop-wide endpoint. |
| **Expected vs actual** | Mill can turn shop-wide Pack OFF. Actual: API-only. |
| **Deps** | Settings/Network, Direct Links gray CTA |

### F-08 — Owner blind to soft-unavailable buyer view — **UX · P2**

| | |
|--|--|
| **Current** | Soft-unavail skipped for owner (`explore.service.ts` ~1369–1380). No “buyers can’t see this” cue on own repost. |
| **Expected vs actual** | Quiet awareness + restore with source. Actual: surprise support load. |
| **Deps** | F-02, allowForward / Pack |

### F-09 — `exploreNewDesignCount` unused in UI — **UX · P3**

| | |
|--|--|
| **Current** | Serialized on cards; web usage only in test fixtures. |
| **Expected vs actual** | Optional “N new designs” signal. Actual: unused. |
| **Deps** | F-06, Explore cards |

### F-10 — Curate vs Repost naming — **UX · P3**

| | |
|--|--|
| **Current** | Design-set / multi-pick still **Curate**; Explore cart uses **Repost**. Plan listed entry polish as Batch 4 optional. |
| **Classification** | UX improvement |
| **Deps** | Explore / cart / Design set |

### F-11 — Allow ignores allowForward soft-unavail — **defect · P2**

| | |
|--|--|
| **Current** | Allow checks immediate source published/live only (`collection-view-request.service.ts` ~216–230). Soft-unavail also from `!allowForward`. |
| **Expected vs actual** | Don’t grant while content stays locked. Actual: grant possible, shell still empty. |
| **Deps** | F-02, view grants |

### F-12 — Unbounded hop walks — **complete behaviour · P3 watch**

| | |
|--|--|
| **Current** | Full-chain credit / soft-unavail walks unbounded by design (fail-closed vs old depth&lt;4). |
| **Note** | Optional latency instrumentation only if measured — not a product rebuild. |

---

## Explicit non-findings (rejected / do not invent)

| Idea | Why not |
|------|---------|
| `repostPricingMode=ask` / commission ledger | Completeness reject |
| Multi-hop Order parties | Deferred |
| Blind `on_request` migrate | Forbidden |
| Pack card inventing design `/pc` rates | `sell-as-units` |
| Replacing 3.3/3.4 with Batch 4 “features” | Release gates only |

---

## Proposed Batch 4 scope (for approval)

### Essential product gaps

1. **Exclusion owner contract** — filter active members; Remove membership math never re-lists tombstones; explicit re-add only (F-01).  
2. **Soft-unavailable shell** — distinct copy/CTA from Ask; refuse/hide Ask when soft-unavail; Align Allow with soft-unavail / allowForward (F-02, F-11).  
3. **Pricing UX completeness** — shared calc controls on RepostSheet **and** editor/curate publish; design override UI via `member-pricing`; edit-after-publish + invalidate recovery (F-03–F-05). Show rates = `rateVisibility` only.  
4. **Sync notify** — notify pack owner when sync adds designs (F-06 / G-008).  
5. **P3 shop Pack OFF settings** — wire `PATCH follows/shop-repost-pack` (F-07).  
6. **Owner soft-unavail awareness** — quiet banner when buyers can’t open (F-08).  
7. **Trader-eye BM-11** on the above at 390px (quality bar, not a separate feature).

### Optional enhancements

- Explore “N new designs” from `exploreNewDesignCount` (F-09).  
- Rename Design-set **Curate** → **Repost** where same job (F-10).  
- Deep-hop latency instrumentation (F-12).  
- Broader entry IA polish only after Essential lands.

### Release gates (not Batch 4 features)

- **3.3** staging migrate / integrity / smoke  
- **3.4** Playwright journeys (mesh/sync, soft-unavail/restore, pricing modes + on_request, Direct Link + own-repost + curate regressions)

### Suggested acceptance criteria (Essential)

- [ ] Owner remove of synced design stays excluded across reload / second remove  
- [ ] Explicit re-add clears exclusion only  
- [ ] Soft-unavailable album ≠ Ask; no dead-end Allow  
- [ ] Curate + editor publish can set Same/Margin/Edit; Show rates independent  
- [ ] At least one design override editable in UI; Place uses resolved buyer-facing  
- [ ] Sync add produces a notification  
- [ ] Shop-wide Pack OFF reachable and demotes Pack→Look  
- [ ] Owner sees when buyers can’t open their repost  
- [ ] No Ask calc mode; pack cards keep collection rate language  

---

## Edge cases

**Covered by Batches 1–3.2 (server):** mesh isolation; sticky exclude in DB; P1 restore; P2 member filter; identity fail closed; passMill non-clobber.  

**Open for Batch 4:** exclusion UI re-add leak; soft-unavail vs Ask; Allow vs allowForward; pricing path fragmentation; silent sync; P3 settings hole.

**Still needed after Essential:** Completeness Review update + feature docs lock before coding; functional/regression matrix per `feature-tests-required` (journeys may ride 3.4 once gates open — do not redefine 3.4 as Batch 4 scope).
