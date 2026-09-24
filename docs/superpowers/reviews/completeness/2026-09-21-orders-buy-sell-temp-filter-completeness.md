# Feature Completeness Review — Orders Buy/Sell as a temporary feed filter

**Date:** 2026-09-21  
**Module / ask:** Orders list: Buy/Sell is a view filter on the unified feed, not an account/role mode.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Proceed

> Dual-capability companies stay one account. Direction chips filter the same list. Confirm stays off I-handle Trading rows (separate).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | All is the default feed. Buy/Sell is a glance filter. Leaving Orders (Home, Explore, Chats, You) starts All again. Opening a ticket and Back keeps the filter. |
| UX Designer | One row: stronger Pending/Completed chips; quieter All/Buy/Sell group. Compact at 390px — no second row, no clip (BM-07). |
| Solution Architect | Direction stays client-only in-memory (module session). Not URL, localStorage, or API. Reset when pathname leaves `/orders`. List remount on `/orders/:id` must read the same session. |

---

## Platform consistency (required)

1. **Existing patterns?** FilterRail/Chip + existing ink pill for direction.  
2. **Duplicates another feature?** No — Find menu still has type/status; this is buy vs sell on the feed.  
3. **Should reuse an existing workflow?** Yes — current in-list `direction` filter.  
4. **Naming matches the app?** **Buy** / **Sell** / **All**; rows still **You buy** / **You sell**.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Two groups; All default |
| Business rules | OK | Not a preference |
| Workflows | OK | Detail Back keeps filter; other tabs reset |
| Edge cases | OK | Reload = All; Find respects direction |
| Permissions | N/A | |
| User states | OK | Dual buy+sell |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Client filter |
| Mobile interactions | OK | One compact row, 390px |
| Accessibility | OK | Two `role=group` labels |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- One filter row: Pending/Completed + All/Buy/Sell.
- In-memory session for direction; reset off `/orders`.
- Search still unified unless Buy or Sell is selected.

## Explicitly deferred / rejected

- URL/localStorage/account persistence for Buy/Sell.
- Redesign of Orders or order cards.

## Sign-off

Proceed.
