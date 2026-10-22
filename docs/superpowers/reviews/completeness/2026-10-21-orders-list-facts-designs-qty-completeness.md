# Feature Completeness Review — List facts: designs and summed qty

**Date:** 2026-10-21  
**Module / ask:** List facts should keep sets **and** N designs: `Order #VONR 2 designs 12 sets` (sets = total of those designs).  
**Anchors:** `docs/features/orders.md`, `2026-10-21-orders-list-compact-completeness`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Design count and shared-unit total are different jobs: how many SKUs vs how many sets. Show both when the unit is shared. Mixed units keep designs only (cannot add sets + mtrs). |
| UX Designer | One muted facts line, spaces not middot: `Order #VONR 2 designs 12 sets`. Quiet; protocol stays the teal job. |
| Solution Architect | Reuse `orderSheetTitle` + `tradeListQtyFact` (sum remaining lines of one unit). Declined lines drop out of both count and total. |

---

## Platform consistency

1. **Existing patterns?** Compact list facts under the name.  
2. **Duplicates?** No.  
3. **Reuse?** `formatOrderQty`, `orderSheetTitle`.  
4. **Naming?** `2 designs` / `12 sets` / `60 mtrs` — same nouns as How many / ticket.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Both facts on one line. |
| Business rules | OK | Qty only when remaining lines share a unit. |
| Workflows | N/A | List scan only. |
| Edge cases | OK | 1 design still `1 design 12 sets`; mixed → designs only. |
| Permissions | N/A | |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new chrome; facts already truncate. |
| First glance (BM-11) | OK | Phone: one muted caption. |
| Accessibility | OK | Same text node. |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Facts: `Order #VONR 2 designs 12 sets` (spaces, no middot).
- Designs = remaining (not declined) lines; `1 design` / `N designs`.
- Qty = sum of those lines when they share a unit; omit qty when mixed / unknown.
- Samples / complaints unchanged.

## Explicitly deferred / rejected

- For/to hop cue (already Redesign).
- Conversion (`= 40 pcs`) on the list.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
