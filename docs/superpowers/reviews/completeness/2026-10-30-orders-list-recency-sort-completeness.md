# Feature Completeness Review — Orders list recency sort

**Date:** 2026-10-30  
**Module / ask:** Stop bumping Needs you rows to the top of Pending. Sort the Orders list by last update only (`updatedAt` desc) on Pending, Completed, and Find.  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`, `2026-10-30-orders-list-card-glance-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Recency is the honest pile. A just-updated wait must not sit under an older Confirm. Lime disc still marks whose move; the nav count still names how many Need you. |
| UX Designer | Same cards and chips. Newest first on both Pending and Completed (and Find in the tab). Time on the row matches list order. |
| Solution Architect | No API change. `sortTradePending` drops the Needs you key; one sort on all filtered rows. |

---

## Platform consistency (required)

1. **Existing patterns?** Orders tab already documented as last-edited first. Chats is last message, not unread-first.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** `sortKey` / `updatedAt` already on `toTradeItems`.  
4. **Naming matches the app?** Unchanged.  
5. **Units?** N/A.

**Philosophy conflict?** No. Needs you as a sort bump misleads; Needs you as a cue is enough.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Recency only |
| Business rules | OK | Whose-move still on the card |
| Workflows | OK | Tap ticket unchanged |
| Edge cases | OK | Same `updatedAt` keeps stable sort from `Array.sort` |
| Permissions | N/A | |
| User states | OK | Buyer / seller / trader same list |
| Notifications | OK | Nav count unchanged |
| Error handling | N/A | |
| Scalability | N/A | Client sort of the loaded page |
| Mobile interactions | OK | No new chrome |
| First glance (BM-11) | OK | Newest card is first; older Confirm still has lime disc |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | |
| Platform consistency | OK | Matches last-edited first already in orders.md |

---

## Gaps

None required.

---

## Approved scope for this slice

- Pending, Completed, and Find: `updatedAt` descending.
- Drop Needs you sort bump.
- Nav Needs you count and lime cues stay.

## Explicitly deferred / rejected

- Server-side list sort / pagination.
- Unread-first or pin.
- Changing nav badge behaviour.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
