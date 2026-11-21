# Feature Completeness Review — Repost existing-system upgrade

**Date:** 2026-11-20  
**Module / ask:** Upgrade existing Ekum Repost (pricing, ceilings, mesh, live sync, availability, bounded orders) — extend, do not rebuild  
**Anchors:** `docs/features/explore.md`, `collections.md`, `orders.md`, `access-and-connections.md`, `saved.md`; Phase 1–3.1 audits; client Repost prototype  
**Disposition:** Redesign (IA/behaviour expansion) → **Proceed** for Batches 0–4 as scoped below  

> Completeness keeps Ekum **coherent**. This slice upgrades Collection lineage / propagate / ceilings / two-Order — no parallel Direct graph, no Buyer/Trader/Supplier roles.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need live collection relationships, independent commercial quotes, and trust ceilings that fail closed. Orders stay pack-owner desk. |
| UX Designer | Keep Explore `RepostSheet` + Curated sheets; add Same/Margin/Edit beside existing Show rates (`rateVisibility` / Ask=`on_request`) without a second Repost dialect. Unavailable ≠ Draft soft shell. |
| Solution Architect | Delta on `Collection` + `CollectionProduct` + propagate/lineage; drop root auto unique; single server pricing resolver; fix `passMillLinesToParent`. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — extend Collection lineage, TradeLane, Follow Pack/Look, curate ceilings, Explore/Curate sheets, two-Order snapshots.  
2. **Duplicates another feature?** No — upgrades Repost, does not add a second share/path system.  
3. **Should reuse an existing workflow?** Yes — Quick `RepostSheet`, Curated `CurateFromSelectionSheet`, existing **Ask for rates** inquiry when `rateVisibility=on_request`, Place from-pack.  
4. **Naming matches the app?** User-facing **Repost**; no Seller/Buyer on card bodies.  
5. **Units?** Root supplier rate via existing catalog/collection/design hierarchy; buyer-facing uses same unit fields; no invented ₹ (see `sell-as-units`).

**Philosophy conflict?** No — if order parties remain Buyer ↔ pack owner ↔ SKU owner (bounded). Multi-hop Order parties = separate Completeness later.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | Pricing modes, soft unavailable, live sync for manual, mesh, provenance |
| Business rules | Gap | P1–P5 ceilings; four pricing dimensions; Edit independence |
| Workflows | OK | Keep entry/publish sheets; extend fields |
| Edge cases | Gap | Mesh; exclude/re-add; disclosure revoke; >4 hop identity |
| Permissions | Gap | Collection vs product vs shop-wide vs Pack→Look |
| User states | Gap | Unavailable shell; `on_request` buyer-facing hide (existing cards) |
| Notifications | Later | New-design propagate notify — Batch 4 |
| Error handling | Gap | Fail closed identity/availability |
| Scalability | OK | Job propagate already exists |
| Mobile interactions | OK | Extend sheets; BM-07 on soft shells |
| First glance (BM-11) | Gap | Trader-eye after UI batch |
| Units | Gap | Resolver must honour existing rounding/units |
| Accessibility | OK | Soft shell copy plain |
| Platform consistency | OK | Extend, don’t parallel |

---

## Verified current code (2026-11-20)

| Area | Finding | Path |
|------|---------|------|
| Lineage fields | `repostSource*`, `repostRoot*`, `repostOrigin`, sync stamps | `schema.prisma` Collection |
| Unique per immediate source | Partial unique indexes | migration `20261011120000` |
| Unique auto per root | **Collapses mesh** | migration `20261028160000` |
| Survivor merge by root | `deliverToTrader` OR root/source | `collection-propagate.service.ts` |
| Propagate traders | **TradeLane mill only** — not all manual children | `propagate()` |
| Unpublish children | **Draft** via `hideImmediateChildren` | same |
| Membership join | id/position only — no origin/exclude/pricing | `CollectionProduct` |
| Credit hops | **depth &lt; 4** loop | `explore.service.ts` `loadSourceCreditHopRows` |
| Rate on repost | No Same/Margin/Edit calculation; Ask already = `on_request`; foreign Product untouched | `RepostSheet`, create/publish |
| Orders | Parent rate can be overwritten by mill | `passMillLinesToParent` ~5447–5452 |
| Pack→Look | Chat line; lanes kept; no sync stop helper beyond look-only curate | `follow.service.ts` |

---

## Gaps

### G-001 — Mesh uniqueness / survivor

| Field | Content |
|-------|---------|
| Gap | Automatic `(company, root)` unique + root survivor merge collapses S1→A→C and S1→B→C |
| Why it matters | Locked: two independent paths |
| Recommendation | Drop root unique; survivor/reuse by immediate source only |
| Priority | Required before implementation |

### G-002 — Live sync for all children

| Field | Content |
|-------|---------|
| Gap | Propagate only walks TradeLane traders; manual children not generally synced |
| Recommendation | Sync all non-archived children with `repostSourceCollectionId = source.id` |
| Priority | Required |

### G-003 — Soft unavailable ≠ Draft

| Field | Content |
|-------|---------|
| Gap | `allowForward` off skips new deliver; unpublish Drafts children |
| Recommendation | P1 soft unavailable gate on all read/write; keep status/config |
| Priority | Required |

### G-004 — Pricing resolver + visibility (Ask = `on_request`)

| Field | Content |
|-------|---------|
| Gap | No four-dimension **calculation** (Same/Margin/Edit); Ask already exists as `rateVisibility: on_request` |
| Recommendation | Collection + member calculation config; **reuse** `rateVisibility` for Ask (inquiry); **never** add `repostPricingMode=ask`; **never** blind-migrate/reinterpret legacy `on_request`; keep visibility independent of calculation mode; do not leak restricted upstream rates |
| Priority | Required |
| Correction | 2026-11-20 — removed “separate Ask mode / hard-hide migrate” instruction |

### G-005 — Membership provenance / exclusions

| Field | Content |
|-------|---------|
| Gap | No synced/local/excluded; sync would re-add removals |
| Recommendation | Extend `CollectionProduct`; only explicit re-add clears exclusion |
| Priority | Required |

### G-006 — Identity ceiling + &gt;4 hops fail closed

| Field | Content |
|-------|---------|
| Gap | Credit loader caps at 4; auto-repost sets `showSourceShops: true` which must not reverse an upstream hide |
| Recommendation | Full walk; incomplete → no mill names. **Locked:** if any intermediary hides the original supplier, no downstream trader can reveal that supplier again — including automatic / Direct Link hops. Ceiling is server-side on every visitor surface. |
| Priority | Required |

### G-007 — passMillLinesToParent overwrites buyer rate

| Field | Content |
|-------|---------|
| Gap | Parent `rate` set from mill item |
| Recommendation | Do not overwrite distinct buyer-facing parent rate |
| Priority | Required before margin ships |

### G-008 — Notifications

| Field | Content |
|-------|---------|
| Gap | No propagate notifications |
| Recommendation | Batch 4 |
| Priority | Recommended enhancement |

---

## Approved scope for this slice

- Batches 0–4 as in `docs/superpowers/plans/2026-11-20-repost-existing-system-upgrade.md`
- Extend existing Collection/propagate/ceilings/orders/UI
- Bounded orders: Buyer ↔ pack owner ↔ SKU owner

## Explicitly deferred / rejected

- Multi-hop Order parties (T1…Tn as Order rows)
- Parallel Direct Connection graph
- Commission ledger / settlement
- Blind migrate / reinterpret legacy `on_request` as a new Ask pricing mode
- Separate `repostPricingMode=ask` (or Ask enum/DB field) — Ask stays `rateVisibility: on_request`
- Buyer/Trader/Supplier account roles
- Visitor-profile relationship summary (separate)

## Sign-off

Required gaps closed or deferred in writing: **Yes** (G-008 Later)  
Ready for implementation / `@functional` journeys: **Yes** after Batch 0 docs land — **do not start Batch 1 until this file + plan are accepted**
