# Feature Completeness Review — Remove returns

**Date:** 2026-09-30  
**Module / ask:** Take returns out of the product (list, type, Raise a return, Home).  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Orders = orders + samples. No return tickets, no raise. Complaints stay in chat. |
| UX Designer | Type is Order / Sample. Dispatched/Settled is complete — no “raise a return” cue. |
| Solution Architect | Web stops listing/raising/reviewing. `/returns` → `/orders`. API may still exist unused. Nav Needs you does not count return review. |

---

## Platform consistency

1. **Existing patterns?** Same Orders list, fewer kinds.  
2. **Duplicates?** No.  
3. **Reuse?** Complaints already cover shop issues.  
4. **Naming?** Raised / Approved / Resolved leave the Orders surface.

**Philosophy conflict?** No.

## Approved scope

- No Return type, no return rows, no Raise a return, no order Returns block, no Home Returns chip / review-return needs.
- `/returns` opens `/orders`.
- Buyer complete copy without raise-a-return.
- API leftover deferred.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
