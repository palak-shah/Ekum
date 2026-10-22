# Feature Completeness Review — Compact list row + Total ₹ at row end

**Date:** 2026-10-21  
**Module / ask:** Ticket Total ₹ jammed next to qty. List Needs you sat under a hairline with a middot. Prototype is a compact card: shop, Needs you Dispatch, `Order # · 2 sets`. Order-for / order-to is useful — suggest, do not invent mill names.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-orders-list-protocol-completeness`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Total money belongs at the **right of the row**, not squeezed beside metres. List scan is shop + next action + a short fact. Qty (`12 sets` / `60 mtrs`) beats `1 design` when the unit is shared. Order-for / order-to waits — Manage parent must not name mills. |
| UX Designer | Needs you is a teal line under the name, no card hairline, no `·`. Facts stay muted under that. |
| Solution Architect | Total footer is flex (label + qty · ₹ `ml-auto`). List protocol drops `·`. Facts use summed order-unit qty when every remaining line shares a unit. |

---

## Platform consistency

1. **Existing patterns?** Ticket mill bill; list text-first cards.  
2. **Duplicates?** No.  
3. **Reuse?** `formatOrderQty`, `howManyOrderFooterSummary` (ticket only).  
4. **Naming?** `Needs you Dispatch` (no middot).

**Philosophy conflict?** No.

---

## Approved scope

- Ticket Total: qty left of the tally, ₹ right-aligned to the **row**.
- List: Needs you under the shop name; no `border-t`; `Needs you Dispatch` (space, not `·`).
- Facts: `Order # · 12 sets` / `60 mtrs` when remaining lines share one unit; else `N designs`.

## Explicitly deferred

- Order for / order to on the row (soft-hide mill names on Manage parent). Suggest only this slice.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
