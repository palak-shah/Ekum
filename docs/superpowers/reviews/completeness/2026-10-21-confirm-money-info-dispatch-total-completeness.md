# Feature Completeness Review — Confirm money info · Dispatch This LR total

**Date:** 2026-10-21  
**Module / ask:** After confirm, Price/Bill under the name as info; ship strip is Ordered / Shipped / Balance. Dispatch adds Ship in this LR textbox; This LR sets = pcs + ₹ lives at the bottom.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-dispatch-sheet-row-chrome-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | After confirm the job is ship, not re-quote. Money stays visible as quiet info. Dispatch total must show what this LR actually sends (sets = pcs) and the ₹ when every ticked line has a rate. |
| UX Designer | Requested keeps Qty · Price · Bill. Confirmed ticket: Price · Bill under the name (How many money-under-name). Hairline **Ordered · Shipped · Balance**. Dispatch: same + **Ship in this LR** textbox. Drop the top This LR banner; put the How many-style footer total above Confirm. |
| Solution Architect | Presentation + footer placement. Same `lineDispatchQty` / payload. Footer reuses `howManyOrderFooterSummary` (pack conversion on). |

---

## Platform consistency (required)

1. **Existing patterns?** Hairline `OrderLineFactStrip`; How many money under the name; How many `OrderQtyFooterSummary` (qty left, ₹ right).  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same ticket + Dispatch sheet.  
4. **Naming matches the app?** Ordered · Shipped · Ship in this LR · Balance · This LR. No SKU.

**Philosophy conflict?** No — fewer loud columns after confirm; money is info, not a fifth ship column.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | This LR still the typed qty |
| Business rules | OK | ₹ omitted when any ticked line has no rate (How many rule) |
| Workflows | OK | Requested strip unchanged |
| Edge cases | OK | Missing rate: no money cue; remaining-0 still start off |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | Sticky footer + total still clears last row (BM-07) |
| First glance (BM-11) | OK | Name · money info · ship strip; total at the bottom |
| Accessibility | OK | Input aria-label Ship in this LR |
| Platform consistency | OK | Ticket hairlines; How many footer |

---

## Gaps

None Required.

---

## Approved scope for this slice

- After confirm (ticket, fulfill expand, settle, Dispatch): Price · Bill quiet under the name; strip Ordered · Shipped · Balance.  
- Dispatch also: **Ship in this LR** textbox in that strip; no top This LR banner; sticky **This LR** total = sets = pcs + ₹ (when billable).  
- Docs + units.

## Explicitly deferred / rejected

- Native checkboxes; putting transport in the scroll body; SKU on the row.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units; existing fulfillment still finds `order-dispatch-line-qty`.
