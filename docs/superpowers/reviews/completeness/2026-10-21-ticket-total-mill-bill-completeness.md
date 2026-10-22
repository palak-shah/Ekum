# Feature Completeness Review — Ticket Total mill bill (no Ship/Balance total)

**Date:** 2026-10-21  
**Module / ask:** Confirmed ticket Total copied empty Ship / Balance cells, wrapped `12 sets = 12 pcs`, and drifted ₹. Ship and Balance are per design — they do not get a Total. Qty under Qty, ₹ right under Bill, no wrap.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-order-ticket-total-row-completeness`, `2026-10-21-ticket-qty-number-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Total is mill bill: how much cloth, how much ₹. Ship and Balance are live per line. |
| UX Designer | Same column template as the line. Total writes Qty (nowrap) and Bill (right). Price empty. Ship/Balance tracks unused. |
| Solution Architect | Display only in `OrderTicketQtySummary` + fact strip grid. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Mill-bill Total already Qty + Bill on Placed tickets.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** `howManyOrderFooterSummary`.  
4. **Naming matches the app?** Total / Qty / Bill.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Footer display |
| Business rules | OK | No ship/balance sum |
| Workflows | N/A | |
| Edge cases | OK | Mixed units stack, each nowrap |
| Permissions | N/A | |
| User states | OK | Requested 3-col; confirmed extra tracks unused |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | nowrap may clip mixed; prefer one line |
| First glance (BM-11) | OK | One Total caption |
| Accessibility | OK | aria Order total |
| Platform consistency | OK | How many footer unchanged |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Shared column template for line + Total.
- Total fills Qty + Bill only; Price empty; no Ship/Balance totals.
- Qty nowrap; Bill `text-right`.

## Explicitly deferred / rejected

- Summing Ship or Balance.
- Hiding Total after confirm.
- Moving Ship/Balance off the line strip.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
