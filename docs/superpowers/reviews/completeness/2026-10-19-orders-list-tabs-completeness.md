# Feature Completeness Review — Orders list tabs and row actions

**Date:** 2026-10-19  
**Module / ask:** Orders list only. Tabs Selling / Buying / Others. Pending and Completed stay the only status summaries. Text-first cards. Confirm + Decline or Accept + Decline only when the whole ticket can be decided from the list.  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed  

> Listing chrome. Order detail, schema, and lifecycle APIs stay as they are.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Selling / Buying replace All / Buy / Sell. Others holds complaints and standalone samples. Two status summaries, not Needs action / In progress / Completed — Needs you stays the accent, the next-action line, and the nav count. |
| UX Designer | Search, filter, and ＋ stay. Cards stay avatar + name + order facts + next action + time. No product thumbs. No StatusPill on the list. Decline confirms. Complex rows open the ticket. |
| Solution Architect | Same list endpoints. Row writes reuse `POST /orders/:id/confirm`, `accept-quote`, and `decline`. One Trading main row. Mill subsets stay off the trader list. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Avatar, Button, ConfirmActionSheet, search row, Pending / Completed meaning.  
2. **Duplicates another feature?** No. Detail dock still owns quote, dispatch, settle, and Send.  
3. **Should reuse an existing workflow?** Yes — `sellerCanConfirm` and `canAcceptQuote`.  
4. **Naming matches the app?** Selling, Buying, Others, Pending, Completed. Confirm and Accept, not Seller/Buyer on the card body.

**Philosophy conflict?** No. Two status choices keep one open list. Quick actions only when the decision is the whole ticket.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Tabs, counts, row actions |
| Business rules | OK | I-handle parent has no list Confirm. Logged tickets have no Accept. |
| Workflows | OK | Forward, Send, dispatch, settle stay on detail |
| Edge cases | OK | Converted or same-design samples are not listed twice. Returns stay off. |
| Permissions | OK | Existing seller/buyer endpoints |
| User states | OK | Tab kept on Back; reset when leaving Orders. Default Selling. |
| Notifications | N/A | Nav Needs you count unchanged |
| Error handling | OK | Failure toast; Decline sheet stays available to cancel |
| Scalability | OK | In-memory filter of the existing page |
| Mobile interactions | OK | Actions sit on the card; no new sticky bar |
| First glance (BM-11) | OK | Shop and next action are the card. Optional filter stays in the icon. |
| Accessibility | OK | Tabs and summaries are buttons with names |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Selling, Buying, Others. Pending and Completed counts for the active tab.  
- Text-first cards without a status pill or product thumbs.  
- Confirm + Decline, or Accept + Decline, only for a straightforward whole-ticket decision. Decline uses the confirm sheet.  
- Others: complaints and standalone samples. No returns.  
- Docs, units, and one functional list journey.

## Explicitly deferred / rejected

- Needs action / In progress as a third status bucket.  
- List Forward, Send, dispatch, or partial line edits.  
- Order detail and schema changes.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
