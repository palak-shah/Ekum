# Feature Completeness Review — Repost catalog inherit + margin + curated edit

**Date:** 2026-11-23  
**Module / ask:** Client Repost sheet #1–#5 — catalog stays catalog on curate; margin starts at 0 / allows negative; buyer-facing round ₹1/pc · 0.25/mtr; album Edit on repost = name + own price only.  
**Anchors:** `docs/features/explore.md`, `docs/features/collections.md`, `docs/features/orders.md`, `sell-as-units`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Whole-order / pick catalogues must survive Repost so Place / How many stay one job. Margin 0 + discount (−) matches trader quote habits. Rounding by Rate per avoids paisa noise on pcs. Album Edit must not let traders rewrite mill Order and dispatch. |
| UX Designer | Grey “10/5” placeholder reads as a filled value — default **0**. Album Edit strip Order/dispatch + Apply-all; show trader buyer-facing ₹. Explore Edit repost unchanged (Who / rates / Remove). |
| Solution Architect | Inherit `kind`+`orderMode` in `CollectionService.create` / reuse from source catalog. Buyer-facing round in domain `resolveRepostDesignPricing`; keep paisa for equality. No backfill of existing `regular` children. |

---

## Platform consistency (required)

1. **Existing patterns?** Curate already copies membership; catalogs already have whole/pick; from-pack already keys off child `kind`/`orderMode`. Margin UI is shared `RepostPricingFields`.
2. **Duplicates another feature?** No — download remains the pick-and-choose escape, not a second curate mode.
3. **Should reuse an existing workflow?** Yes — inherit on create; CollectionEditor gate like GC (limited fields).
4. **Naming matches the app?** Catalogue / collection chrome unchanged this slice.
5. **Units?** Whose = pack (collection Rate per / buyer-facing). Which = Rate per (`catalogRateUnit`). Surface = Explore / album / How many preview + Place stamp. Pack Explore = collection. Round: **pc → ₹1**, **mtr → 0.25**, other Rate-per → ₹1.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Inherit catalog; margin 0/−; round; curated edit strip |
| Business rules | OK | New curates only; no silent pick-and-choose |
| Workflows | OK | Repost → Place whole; album Edit name+price |
| Edge cases | OK | Product-source stays regular; source orderMode change does not cascade |
| Permissions | OK | Unchanged Pack/ceiling |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky chrome |
| First glance (BM-11) | OK | Trader-eye on new catalog repost + Edit |
| Units (order / dispatch / Rate per) | OK | Rate per drives round; order/dispatch unchanged on curate |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Existing regular children of catalogs

| Field | Content |
|-------|---------|
| Gap | Children already created as `regular` stay regular |
| Why it matters | Old client repro packs remain pick-and-choose |
| Impact if ignored | Known; traders re-repost or we migrate later |
| Recommendation | Defer — new curates only (locked) |
| Priority | Future improvement |

### G-002 — Album Edit “own price” vs Margin mode

| Field | Content |
|-------|---------|
| Gap | Saving a plain ₹ on album Edit must not wipe mill Order/dispatch; should set trader Edit / pack buyer-facing without rewriting units |
| Why it matters | Margin packs vs edited ₹ |
| Impact if ignored | Accidental mode wipe or unit stamp |
| Recommendation | Hydrate buyerFacing; save via rate/Edit path; omit unit/MOQ PATCH |
| Priority | Required before implementation |

---

## Approved scope for this slice

- API: inherit `kind=catalog` + source `orderMode` on collection-source curate create/reuse.
- Web: margin default `0`; − below 0; placeholders not 10/5.
- Domain + resolver + sheet preview: buyer-facing round by Rate per.
- CollectionEditor curated/repost: name (+ description) + own price only; hide Order and dispatch + Apply-all + order-mode; hydrate trader buyer-facing.
- Tests + audit #1–#5/#11; #11 via #1.

## Explicitly deferred / rejected

- Backfill existing regular children
- #6 menu, #7 supplier rate on album, #15 inherit settings, #47 select ⋯
- Changing Explore Edit repost Who/rates surface

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
