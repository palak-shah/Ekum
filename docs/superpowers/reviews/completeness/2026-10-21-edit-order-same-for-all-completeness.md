# Feature Completeness Review — Edit order Same for all

**Date:** 2026-10-21  
**Module / ask:** Edit order still missing How many’s **Same for all** when every remaining line is the same unit (mill rolls all metres, qty 10). Show the chip on top to edit quantity once.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-edit-order-how-many-chrome-completeness`, `2026-10-20-how-many-unit-groups-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Six mill lines at 10 mtrs is one qty job. How many already has the chip; Edit is the same count sheet later. Mixed sets + metres still must not copy one number into both. |
| UX Designer | Same chip + editor as How many / builder: idle **Same for all** above the list; tap → foam − n + · Apply / Cancel. Hide when remaining &lt; 2 or order units mix. Qty only (Edit does not change rate). |
| Solution Architect | Sheet-local state. Apply calls existing `onQty` per remaining productId. No API change. Supersedes “no Same for all” deferral on Edit chrome. |

---

## Platform consistency (required)

1. **Existing patterns?** How many / Order builder chip + `SameForAllEditor` + `QtyStepper`.  
2. **Duplicates another feature?** No — same control, later in the ticket.  
3. **Should reuse an existing workflow?** Apply writes each remaining line qty.  
4. **Naming matches the app?** Same for all.

**Philosophy check?** No conflict — one unit, one shared qty.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Chip · editor · Apply to remaining only |
| Business rules | OK | Hide when mixed or one line left |
| Workflows | OK | Soft-removed lines ignored |
| Edge cases | OK | Mixed units; last remaining line; empty draft cannot Apply |
| Permissions | N/A | Existing amend window |
| User states | OK | Edit inquiry uses the same sheet |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Client loop |
| Mobile interactions | OK | Chip above list; footer unchanged (BM-07) |
| First glance (BM-11) | OK | Chip only when the mill list is one unit |
| Accessibility | OK | aria-label Same quantity for all designs |
| Platform consistency | OK | Shared How many pieces |

---

## Gaps

None required. Quote / dispatch / confirm Same for all already exists in those sheets.

## Approved scope for this slice

- Edit order / Edit inquiry: **Same for all** qty chip on top when 2+ remaining lines share one order unit.
- Hide when mixed units or one remaining line.
- Apply remaining lines only (not soft-removed).

## Explicitly deferred / rejected

- Per-group Same for all on mixed sheets.
- Changing mill catalog units.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units on AmendOrderSheet.
