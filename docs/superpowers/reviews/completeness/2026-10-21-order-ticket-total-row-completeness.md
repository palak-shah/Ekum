# Feature Completeness Review — Ticket Total row + 3 columns

**Date:** 2026-10-21  
**Module / ask:** Mill-bill total: word **Total** left of `130 mtrs`; no vertical bars on that row; qty under Qty, ₹ under Bill. Missing rate keeps empty Price + Bill — still three columns.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-order-ticket-bill-column-total-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | A mill bill says Total, then the qty tally, then the amount. Do not sum rates in Price. Hide ₹ in Bill when any counted line is unbillable — leave the cell empty, do not collapse to two columns. |
| UX Designer | Line strips keep Qty · Price · Bill hairlines. Total row: no divide-x; **Total** in the thumb column so it sits left of `130 mtrs`. How many / Edit footer unchanged. |
| Solution Architect | Always emit Price + Bill cells on ticket `OrderLineFacts`. Total row always those three (plus empty Ship/Balance when the lines have them). |

---

## Platform consistency (required)

1. **Existing patterns?** Ticket fact strip; mill-bill amount under Bill.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same strip + family rows.  
4. **Naming matches the app?** **Total** — not Billing / Grand total.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Display only |
| Business rules | OK | ₹ only when every counted line is billable; skip declined |
| Workflows | OK | Ticket + mill cards with `OrderLineFacts` |
| Edge cases | OK | No rate → empty Price + Bill, still 3 cols; mixed units stack in Qty |
| Permissions | N/A | |
| User states | OK | Requested 3-col; after ship extra Ship/Balance stay |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky bar |
| First glance (BM-11) | OK | Total is quiet; designs stay loud |
| Accessibility | OK | `aria-label="Order total"` |
| Platform consistency | OK | How many footer unchanged |

---

## Gaps

None required this slice.

### G-001 — Timeline Updated copy

| Field | Content |
|-------|---------|
| Gap | Bare **Updated** + **6 designs** on every edit. User asked for qty vs removed-design wording. |
| Why it matters | Design count is not the change. |
| Impact if ignored | Timeline still says 6 designs. |
| Recommendation | Suggest copy in the reply; do not ship until they pick. |
| Priority | Future improvement (this slice) |

---

## Approved scope for this slice

- Ticket total: **Total** left of family qty; no vertical bars; qty under Qty; ₹ under Bill; Price empty.
- Ticket lines always Qty · Price · Bill (empty Price/Bill when no rate).
- How many / Edit / builder unchanged.

## Explicitly deferred / rejected

- Timeline **Updated qty** / **Removed designs** until copy is chosen.
- Summing rates into the Price column.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units + trader-eye.
