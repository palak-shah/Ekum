# Feature Completeness Review — Order line stepper · money under name · edit at right

**Date:** 2026-10-21  
**Module / ask:** Price/Bill sit tight under the name (How many identity). Confirm + Dispatch qty use − n +. Same type as other order sheets. Ticket pencil/close at the far right, not glued to the name.  
**Anchors:** `docs/features/orders.md`, `designLineChrome`, How many `QtyStepper`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Piece counts are − n + everywhere a trader types qty (How many, Edit, Confirm, Dispatch). Money after confirm is info, not a column. |
| UX Designer | Money uses `designSubtextClass` + `mt-0.5` under the name (same as Set · 39 pcs). Confirm: Qty stepper \| Rate box. Dispatch: This LR stepper (How many trailing), strip Ordered · Shipped · Balance. Pencil/close = `nameEnd` at the right of the name row. Fact strip stays compact 10/12. |
| Solution Architect | Reuse `QtyStepper`. Same confirm/dispatch payloads. Off Dispatch line: stepper disabled at 0. |

---

## Platform consistency (required)

1. **Existing patterns?** `QtyStepper`, `OrderDesignTitle` subtext, How many `nameEnd` ×.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same Confirm / Dispatch sheets.  
4. **Naming matches the app?** This LR · Ordered · Shipped · Balance.

**Philosophy conflict?** No — one qty control language.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Confirm qty still `lineConfirmQty`; Dispatch still `shipQty` |
| Business rules | OK | Over-ship unclamped; Confirm rate still optional |
| Workflows | OK | Remaining-0 Dispatch still start off |
| Edge cases | OK | Off line stepper disabled showing 0 |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | Stepper 32px; pencil not overlapping name |
| First glance (BM-11) | OK | Name · money · strip; − n + is the qty |
| Accessibility | OK | aria-label Quantity / Ship in this LR |
| Platform consistency | OK | How many stepper + compact fact labels |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Price · Bill as `designSubtextClass` under the name after confirm (ticket, Dispatch, settle/fulfill).  
- Confirm Qty and Dispatch This LR use `QtyStepper` (− n +).  
- Compact 10/12 fact strip on Dispatch (same as ticket).  
- Ticket edit/close via `nameEnd` at the right of the name row.  
- Docs + units.

## Explicitly deferred / rejected

- Settle Final stays the compact box (not this ask). Mill Send qty unchanged.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units; e2e still finds `order-lines-qty-*` and `order-dispatch-line-qty`.
