# Feature Completeness Review — Ticket per-unit Total + grand ₹

**Date:** 2026-10-21  
**Module / ask:** Mixed mill-bill Total stacked qty (`100 sets` / `50 pcs`) without ₹ per family or a sum of both. When rates and qty exist, show amount per unit being ordered, then total of all.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-ticket-total-mill-bill-completeness`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Mill bill is cloth + ₹. Mixed Sets + Pcs are two bills, then one add. Missing a rate on a family → no ₹ there, and no All (cannot add). |
| UX Designer | Same Total row language: qty left, ₹ at row end. One **Total** caption. Mixed: one row per family, then **All**. One family: no All. |
| Solution Architect | Display-only. `ticketTotalSummary` + `groupHowManyByOrderUnit` + `orderBillTotal`. How many footer `{ rows, money }` unchanged. |

---

## Platform consistency

1. **Existing patterns?** Ticket mill-bill Total; Sets / Pcs headings already group the list.  
2. **Duplicates?** No.  
3. **Reuse?** `lineBillAmount` / `orderBillTotal` (same as line Bill).  
4. **Naming?** Total / All / sets / pcs / mtrs.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Per-family ₹ + All |
| Business rules | OK | All only when every remaining line is billable |
| Workflows | N/A | Ticket scan |
| Edge cases | OK | Pack without pack size → no ₹ for that family |
| Permissions | N/A | |
| User states | OK | Requested and confirmed; no Ship/Balance total |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | nowrap qty; ₹ shrink-0 |
| First glance (BM-11) | OK | Phone: Total then All quieter than designs |
| Accessibility | OK | All is text, not a second heading |
| Platform consistency | OK | How many sticky footer stays one lump ₹ |

---

## Approved scope for this slice

- Ticket `OrderTicketQtySummary` only (parent + mill cards).
- One unit: `Total` · qty · ₹. No All.
- Mixed: one qty+₹ row per order-unit family; **All** + grand ₹ when every remaining line is billable.
- Family incomplete: qty, blank ₹; omit All.
- Qty is order-unit only (`100 sets`). Pack ₹ still `rate × qty × pack`.

## Explicitly deferred / rejected

- How many / Amend / builder split rows.
- Summing Ship or Balance.
- List facts line.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
