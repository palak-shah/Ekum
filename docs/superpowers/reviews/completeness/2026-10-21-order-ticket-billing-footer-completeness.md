# Feature Completeness Review — Ticket billing beside unit total

**Date:** 2026-10-21  
**Module / ask:** Drop the **Billing · ₹** row above order items. Put ₹ right of the unit-family total (`60 mtrs` · `₹7,260`), same as How many / Edit.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-order-ticket-unit-chrome-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Top Billing is a second title for money already on each line. One total belongs with the metres/sets tally. Hide ₹ when any counted line has no rate (same rule as How many). |
| UX Designer | Reuse `OrderQtyFooterSummary`. No Billing word. Mill cards each get their own tally. |
| Solution Architect | Remove `orderBillingTotal` chrome. Summary already computes money; stop stripping it. |

---

## Platform consistency (required)

1. **Existing patterns?** How many / Edit sticky footer: qty left, ₹ right.  
2. **Duplicates another feature?** No — moves the same total.  
3. **Should reuse an existing workflow?** `howManyOrderFooterSummary`.  
4. **Naming matches the app?** ₹ amount only — not “Billing”.

**Philosophy conflict?** No — one job, less chrome.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Display only |
| Business rules | OK | ₹ only when every counted line is billable; skip declined |
| Workflows | OK | Ticket scan |
| Edge cases | OK | Mixed units (qty rows stack; ₹ on first row); missing rate |
| Permissions | N/A | |
| User states | OK | Parent list + mill cards |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | One less row above the list |
| First glance (BM-11) | OK | Designs first; total with 60 mtrs |
| Accessibility | OK | Same summary as How many |
| Platform consistency | OK | |

---

## Gaps

None required.

## Approved scope for this slice

- Remove ticket **Billing · ₹** above items.
- Pass money through `OrderTicketQtySummary` (right of first unit row).
- Declined lines stay off the tally.

## Explicitly deferred / rejected

- Changing line Bill columns.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units.
