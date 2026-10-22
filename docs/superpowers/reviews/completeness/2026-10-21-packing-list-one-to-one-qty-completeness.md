# Feature Completeness Review — Packing list 1:1 dual qty

**Date:** 2026-10-21  
**Module / ask:** Packing list PDF for `#633L` this LR (Georgette 27 · Banarasi 50 · parcels 1) prints `50 sets (= 50 sets)` and `Total 77 sets and 77 sets`. Same shipment as Previous dispatch; qty is right, conversion is noise.  
**Anchors:** `docs/features/orders.md` (slip qty = shipment in the **order unit**); `2026-10-12-order-set-pc-billing` (dual only when pack converts); ticket Total skip `12 sets = 12 pcs`.  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | PDF must match this truck: those two designs, those qtys. Platform usual is order + dispatch both **set** with pack 1 — that is not a conversion. Mill reads `50 sets`, not `50 sets (= 50 sets)`. |
| UX Designer | Dual stays for a real pack (`10 sets (= 40 pcs)` / `Total 80 pcs and 20 sets`). 1:1 (pack 1, or dispatch count = order count) is order-unit only. Row order follows the ticket / dispatch sheet (Georgette then Banarasi), not whatever the shipment row insert order was. |
| Solution Architect | Same helpers: `formatDualQty` + `formatPackingSlipTotal`. Skip dual when pack is 1 or dispatch qty equals order qty. Sort slip rows by `orderItems` index. How many / ticket captions unchanged this slice. |

---

## Platform consistency (required)

1. **Existing patterns?** Packing list PDF; ticket Total skips 1:1 pack conversion.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — shared dual-qty helpers.  
4. **Naming?** Sets / pcs; Packing list.

**Philosophy conflict?** No. Dual qty without a conversion fights clutter-free.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | This-shipment lines; order-unit qty |
| Business rules | OK | Dual only when pack converts |
| Workflows | OK | Open PDF from this LR |
| Edge cases | OK | Pack 4 stays dual; metres stay native |
| Permissions | N/A | |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | N/A | PDF |
| First glance (BM-11) | OK | `50 sets` / `Total 77 sets` |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — 1:1 prints as dual

| Field | Content |
|-------|---------|
| Gap | `piecesPerPack: 1` + dispatch `set` → `50 sets (= 50 sets)` and `Total 77 sets and 77 sets` |
| Why it matters | Looks like the wrong truck / broken math |
| Impact if ignored | Blocking mill document |
| Recommendation | Skip dual when pack is 1 or dispatch qty = order qty |
| Priority | Required before implementation |

---

## Approved scope

- Packing list qty = this shipment in the **order unit**.
- Dual `(= …)` / `Total N pcs and M sets` only when pack converts (count differs).
- Slip row order follows ticket / Previous dispatch (order line order).
- Units on `formatDualQty` / `formatPackingSlipTotal` / packing slip.

## Explicitly deferred

- How many footer `12 sets = 12 pcs`.
- Order-detail billing captions.
- Mixed set + mtr packing-slip grand total.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
