# Feature Completeness Review — Orders nav Needs you count

**Date:** 2026-09-26  
**Module / ask:** Bottom nav Orders tab shows how many tickets **Need you**, same teal pill as Chats unread.  
**Anchors:** `docs/features/orders.md`, `docs/features/chat.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders already scan Chats by the nav number. Orders should do the same for work they must do — not every open ticket. |
| UX Designer | Same pill, exact count (not 9+). Aria: **Orders, N need you**. Tap still opens `/orders` (Pending, Needs you first). |
| Solution Architect | `GET /orders/needs-you-count`. Count uses the same `matchesOrderNeedsYou` / sample / return rules as the list. Poll like chat unread. `invalidateQueries(['orders'])` already refreshes it. |

---

## Platform consistency (required)

1. **Existing patterns?** Chats bottom-nav teal count. Orders list **Needs you** accent.  
2. **Duplicates another feature?** Home “needs attention” stays; this is the tab badge.  
3. **Should reuse an existing workflow?** Yes — list predicates, not a new inbox.  
4. **Naming matches the app?** **Need you** / **Needs you**, not Seller action.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Badge = list Needs you (orders + samples + returns) |
| Business rules | OK | Same as `matchesNeeds` / sample / return |
| Workflows | OK | Tap Orders |
| Edge cases | OK | 0 hides pill; otherwise the real count |
| Permissions | OK | Same as list GET |
| User states | OK | Staff see the tickets they already see on the list |
| Notifications | N/A | Not the Home bell |
| Error handling | OK | Failed fetch → no badge (same as Chats) |
| Scalability | OK | Paginate open list at 100; samples/returns are counts |
| Mobile interactions | OK | Pill on icon; BM-07 unchanged |
| Accessibility | OK | Aria includes count |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Teal count on Orders nav = Needs you rows (unified feed).
- Shared domain predicates so API and list cannot drift.
- Docs + units.

## Explicitly deferred / rejected

- Badge for Pending (waiting on them) — no, only Needs you.
- Changing Home attention list.
- Push when the count changes.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (unit; same as Chats unread — no new e2e this slice)
