# Feature Completeness Review — Place Order opens the ticket, not the list

**Date:** 2026-09-29  
**Module / ask:** After Place, landing on `/orders` hides the new ticket under Needs you. Open the order they just placed.  
**Anchors:** `docs/features/orders.md`, `docs/features/saved.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Place is “I sent this.” Next job is that card in chat — not hunt the Pending list. Needs you is other people’s wait, not this leave. |
| UX Designer | One success → that chat (or `/orders/:id` if no thread). Several shops / partial → first successful ticket. Toast still says how many. |
| Solution Architect | Change `batchSuccessLeave` only. Shop / Explore already use `navigateToOrderChat`. |

---

## Platform consistency

1. **Existing patterns?** One ticket already opens chat.  
2. **Duplicates?** No.  
3. **Reuse?** `navigateToOrderChat`.  
4. **Naming?** Unchanged.

**Philosophy conflict?** No. List dump fights “never get lost.”

---

## Approved scope

- Any Place/Ask with ≥1 created order opens the first ticket.  
- Zero created → stay; no `/orders` leave.

## Sign-off

Required gaps closed: Yes  
Ready: Yes
