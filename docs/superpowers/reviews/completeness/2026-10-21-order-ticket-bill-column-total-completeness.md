# Feature Completeness Review — Ticket Bill-column total

**Date:** 2026-10-21  
**Module / ask:** Ticket total under the **Bill** column (mill-bill), not a full-width `60 mtrs …… ₹7,260` bar.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-order-ticket-billing-footer-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | A mill bill totals the amount column. The bar restates Qty + ₹ as a second title. Put family qty under Qty, ₹ under Bill. Hide ₹ when any counted line is unbillable (same rule). |
| UX Designer | Same fact-strip columns as the lines (empty Price / Ship / Balance so Bill stays in its slot). Indent past the thumb so the total sits under the strip, not full-card. How many / Edit keep left/right sticky footer — those are conversion, not a bill. |
| Solution Architect | `OrderTicketQtySummary` stops wrapping `OrderQtyFooterSummary`. Reuse `howManyOrderFooterSummary` + line fact columns. |

---

## Platform consistency (required)

1. **Existing patterns?** Ticket fact strip (Qty · Price · Bill).  
2. **Duplicates another feature?** No — moves the same total.  
3. **Should reuse an existing workflow?** Fact cells + family rows.  
4. **Naming matches the app?** ₹ amount; no “Total” / “Billing” word.

**Philosophy conflict?** No — quieter record, same numbers.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Display only |
| Business rules | OK | ₹ only when every counted line is billable; skip declined |
| Workflows | OK | Ticket + mill cards that show `OrderLineFacts` |
| Edge cases | OK | Mixed units stack in Qty cell; missing rate hides Bill total |
| Permissions | N/A | |
| User states | OK | Requested (Qty/Price/Bill) and after ship (empty Ship/Balance) |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky bar; BM-07: last line still above dock |
| First glance (BM-11) | OK | Designs first; mill-bill total last |
| Accessibility | OK | Same strip `role=group` |
| Platform consistency | OK | How many footer unchanged |

---

## Gaps

### G-001 — Mill Send From/To grid

| Field | Content |
|-------|---------|
| Gap | Held mill **Send** rows hide `OrderLineFacts` (From/To rates). A Qty/Price/Bill total will not line up with those cells. |
| Why it matters | Trader Send is a different chrome. |
| Impact if ignored | Total still useful; alignment is off on that card only. |
| Recommendation | Keep the same summary; restack Send later. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Ticket parent list + mill cards that already show `OrderTicketQtySummary`.
- Family qty under Qty; ₹ under Bill; empty other columns for alignment.
- How many / Edit / builder keep `OrderQtyFooterSummary`.

## Explicitly deferred / rejected

- Totalling Ship / Balance.
- Changing How many sticky footer.
- Per-group subtotals (one mill-bill row at the end).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units + trader-eye.
