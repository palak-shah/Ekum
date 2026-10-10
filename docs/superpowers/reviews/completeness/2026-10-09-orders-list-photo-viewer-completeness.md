# Feature Completeness Review — Orders list thumb → PhotoViewer

**Date:** 2026-10-09  
**Module / ask:** Tap design stack (or complaint images) on Orders list cards opens shared PhotoViewer; rest of card still opens the ticket.  
**Anchors:** `docs/features/orders.md`, `docs/features/media.md`, Completeness `2026-10-09-orders-list-textile-card`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders glance fabric on the list without opening the ticket — same as How many / order detail. |
| UX Designer | Reuse kit PhotoViewer; tap media only (not whole card). Fixed media column stays. Avatar (no photos) is not tappable for viewer. |
| Solution Architect | Pure client: gallery from list OrderView / complaint images. No API change. |

---

## Platform consistency

1. **Existing patterns?** Shared `PhotoViewer`; How many thumb → viewer; order detail line gallery.  
2. **Duplicates?** No — list glance only.  
3. **Reuse?** `orderItemGalleryUrls` / captions / details; PhotoViewer.  
4. **Naming?** Photo viewer / Close — unchanged.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Soft-hide already on list payloads |
| Workflows | OK | Media → viewer; elsewhere → detail/chat |
| Edge cases | OK | No photos → avatar, no viewer; overflow stack still opens full gallery |
| Permissions | N/A | Same as list visibility |
| User states | OK | Orders + complaints with images |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | One viewer per open row |
| Mobile interactions | OK | stopPropagation so Link does not navigate |
| First glance (BM-11) | OK | Thumbs remain glanceable |
| Accessibility | OK | button + aria-label; PhotoViewer dialog |
| Platform consistency | OK | |

---

## Approved scope

- Tap list design stack / complaint thumbs → PhotoViewer (swipe full gallery).  
- Card body / protocol still navigates to order or chat.  
- Docs + unit/regression for open-without-navigate.

## Explicitly deferred

- Samples (no list photos today).  
- Header action from list viewer (e.g. Open order).

## Sign-off

Required gaps closed: Yes  
Ready for implementation: Yes
