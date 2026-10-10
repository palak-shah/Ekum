# Feature Completeness Review — Orders list textile card

**Date:** 2026-10-09  
**Module / ask:** Redesign Orders list cards — fixed media column, status+time top-right, one protocol footer (not dual ball / Confirm verb); keep Pending/Completed chrome.  
**Anchors:** `docs/features/orders.md`, plan `orders_list_compare`, Completeness `2026-09-30-orders-inbox-rows`  
**Disposition:** Proceed  
**Note (prototype polish):** List pill **Placed** for `requested`; protocol e.g. **Waiting for you to confirm order**; no counterpart name repeat under title.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Trader needs fabric glance + who has the ball without opening the ticket. Soft-hide must not leak mills/buyers. |
| UX Designer | Card stack; overlapped thumbs (≤3 +N); StatusPill + time under it; Needs-you verb + left accent; quiet two-column ball strip. No Accepted / Call / Reminder. |
| Solution Architect | Pure view helpers from OrderView (counterpart already soft-hidden on list). No API change this slice. |

---

## Platform consistency

1. **Existing patterns?** Kit StatusPill, Avatar fallback, explore relative time, BM-01 +N thumbs.  
2. **Duplicates?** No — list glance only; desk mill cards stay on detail.  
3. **Reuse?** `statusLabel`, `tradeNeedsYouLabel`, `linkedMills` / counterpart.  
4. **Naming?** Ekum verbs (Confirm / Accept quote / Dispatch); never Accepted.

**Philosophy conflict?** No — Status on right is an intentional Orders divergence from Chats (product ask). Soft-hide preserved.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Soft-hide via visible names only |
| Workflows | OK | Tap → order detail unchanged |
| Edge cases | OK | No images → avatar; samples/complaints thinner |
| Permissions | N/A | |
| User states | OK | Buyer / seller / trader strip titles |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | ≤3 thumbs |
| Mobile interactions | OK | No sticky chrome change |
| First glance (BM-11) | OK | Verb + ball strip loudest when Needs you |
| Accessibility | OK | Text statuses remain |
| Platform consistency | OK | |

---

## Approved scope

- Overlapping design thumbs (1 per line, cap 3, +N).  
- StatusPill top-right + relative time under.  
- Needs-you teal verb + left accent.  
- Dual-party ball strip (You / counterpart or Buyer’s order / mill|trader).  
- Ship progress line when dispatch in play.  
- Docs + unit tests.

## Explicitly deferred

- Selling/Buying primary tabs.  
- Forward cue if list payload lacks attribution.  
- ₹ totals on facts line.  
- Dual strip on samples/complaints (orders only).

## Sign-off

Required gaps closed: Yes  
Ready for implementation: Yes
