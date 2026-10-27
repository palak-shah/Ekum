# Feature Completeness Review — Orders Pending / Completed chips

**Date:** 2026-10-23  
**Module / ask:** Pending / Completed on `/orders` should look like Chats inbox chips (**All · Unread · Groups · Requests**). Need-you count on Pending like **Unread 1**.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/chat.md`  
**Disposition:** Proceed (Redesign vs large count cards)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Two jobs stay: open vs finished. Chip shows that list’s count (including 0). Need you stays on the row / nav, not a third tab. |
| UX Designer | Same kit `Chip` + `FilterRail` as Chats. Count is plain type, not a teal Unread badge. |
| Solution Architect | Count pending / completed in the active Selling / Buying / Others tab. |

---

## Platform consistency (required)

1. **Existing patterns?** Chats inbox chips. Kit Chip 28px. Badge `bg-badge` idle, `bg-white/25` when the chip is on.  
2. **Duplicates another feature?** No — restyle of existing Pending / Completed. Nav Needs you stays.  
3. **Should reuse an existing workflow?** Yes — Chip + FilterRail + shared count badge.  
4. **Naming matches the app?** **Pending** / **Completed**.  
5. **Units?** N/A.

**Philosophy conflict?** Yes vs “two compact counts” cards — **Redesign** that chrome to chips. Still not a third Needs action bucket.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Chips still filter pending vs completed |
| Business rules | OK | Chip count = pending / completed in this tab; show **0** |
| Workflows | OK | Selling / Buying / Others unchanged |
| Edge cases | OK | Find still dims chips; empty copy unchanged |
| Permissions | N/A | |
| User states | OK | Both chips always show a count |
| Notifications | N/A | Nav pill unchanged |
| Error handling | N/A | |
| Scalability | N/A | In-memory list count (same as today’s 31 / 5) |
| Mobile interactions | OK | Chips are smaller than the cards (BM-07 easier) |
| First glance (BM-11) | OK | Quiet chips; number is not a second highlight |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Chip label + badge text |
| Platform consistency | OK | Same Chip as Chats |

---

## Gaps

### G-001 — Loud count cards vs Chats chips

| Field | Content |
|-------|---------|
| Gap | Pending / Completed are two large numbered cards, not kit chips |
| Why it matters | Same filter job as All / Unread should share chrome |
| Impact if ignored | Orders looks like a different app |
| Recommendation | FilterRail + Chip; plain pending / completed counts, including 0 |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Replace the two count cards with kit **Pending** / **Completed** chips.  
- Each chip shows that list’s count in plain type, including **0**. No teal Unread-style badge.  
- Keep testids `orders-summary-pending` / `orders-summary-completed`.

## Explicitly deferred / rejected

- A third Needs action chip / tab.  
- Highlighting the count like Chats **Unread**.  
- Changing bottom-nav Needs you.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
