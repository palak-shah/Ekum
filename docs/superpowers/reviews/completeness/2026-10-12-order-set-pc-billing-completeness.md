# Feature Completeness Review — Order set / dispatch billing + packing slip

**Date:** 2026-10-12  
**Module / ask:** Bill pack orders as `qty × packSize × rate` (rate per dispatch); dual set+dispatch qty on order detail / How many / packing slip; fix Rate per mtr → Piece/pc; blank pack size = no invent (except obvious exchanges e.g. dozen=12).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/orders.md`  
**Disposition:** Redesign → **Proceed**

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Rate language was already per dispatch; money still treated rate as per order unit. Unlock deferred ₹ × pack size. Blank set/box/bundle contents stay blank; dozen=12 stays. |
| UX Designer | Order lines + How many + packing slip share one math. Quiet captions; no boxed billing panel. Dispatch noun (mtr/pc) everywhere — never hardcode pcs when dispatch is mtr. |
| Solution Architect | Reuse `unit` / `dispatchUnit` / `piecesPerPack` / `rate`. Shared helper web+API. No new DB columns. Chat `totalLabel` frozen at quote time (no backfill). |

---

## Platform consistency (required)

1. **Existing patterns?** How many footer, OrderLineFacts strip, packing slip PDF, formatCatalogRate.  
2. **Duplicates another feature?** No — completes deferred money path.  
3. **Should reuse an existing workflow?** Yes — same sell-as knobs.  
4. **Naming?** Sets / mtrs / pcs / Rate per {dispatch} — plain trader language.

**Philosophy conflict?** Yes vs prior “display per pc, charge per set” — **Redesign** money math to match rate label, then Proceed.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Billing + dual qty + packing totals |
| Business rules | OK | Blank vs obvious exchange; default Rate per among offered units |
| Workflows | OK | Create → How many → Order → Quote → Packing slip |
| Edge cases | OK | Blank pack size; mtr dispatch; mixed lines |
| Permissions | N/A | |
| User states | OK | On request rate → no ₹ |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Pure helpers |
| Mobile interactions | OK | Fact strip + footer BM-07 unchanged |
| First glance (BM-11) | OK | Dispatch unit loud on rate; dual qty quiet |
| Accessibility | OK | Existing labels |
| Platform consistency | OK | After Redesign |

---

## Gaps

### G-001 — Money ignores pack size

| Field | Content |
|-------|---------|
| Gap | Quote / How many / display use `qty × rate` while rate is labeled per dispatch |
| Why it matters | 10 sets × 4 pc × ₹100 must be ₹4,000 not ₹1,000 |
| Impact if ignored | Wrong trader money |
| Recommendation | Shared `lineBillAmount`; pack = qty × packSize × rate when known/obvious |
| Priority | Required before implementation |

### G-002 — Rate per mtr shows Piece/pc (F-001)

| Field | Content |
|-------|---------|
| Gap | Downstream hardcodes pcs / falls back to pc when dispatch is mtr |
| Why it matters | Client trust — create says mtr, output says Piece |
| Impact if ignored | Blocking client bug |
| Recommendation | Thread `dispatchUnit`; noun from dispatch; Explore rateUnit from dispatch on pack path |
| Priority | Required before implementation |

### G-003 — Cleared pack size refilled (F-002)

| Field | Content |
|-------|---------|
| Gap | Tag taxonomy autofills empty `piecesPerPack` mid-edit |
| Why it matters | Blank means not given |
| Impact if ignored | Fake conversions + wrong ₹ |
| Recommendation | Settings create seed only; stop tag refill |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Docs + gap matrix for billing formula, blank pack size, obvious exchanges, Rate per default among offered options.
- Shared billing / dual-qty helpers (web + API quote total).
- Order detail line breakdown + order total; How many money summary; packing slip dual qty + totals.
- Fix F-001 / F-002 (dispatch nouns, Explore rateUnit, stop tag piecesPerPack autofill).
- Units + trader-eye.

## Explicitly deferred / rejected

- Filter Rate per dropdown to relevant units (fabric vs piece) — next slice  
- Product editor full Order-and-dispatch chrome  
- Payment Ask / Paid flows  
- Backfill historical chat `totalLabel` metadata  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
