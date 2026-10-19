# Feature Completeness Review — You collections list

**Date:** 2026-10-17  
**Module / ask:** My Collections becomes a published-plus-draft list. Designs stay a two-column grid.  
**Anchors:** `docs/features/settings.md`, `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Drafts sit on the main list so Find is not a second journey. Archived collections and Bookmarks are the page ⋯. Row actions stay on the row. |
| UX Designer | List thumb, name, count, Draft chip. Swipe More then Share (chat gesture). Select dock is Share · Order. Designs grid unchanged. |
| Solution Architect | `libraryThumb` on the owner collection payload. Explore mosaics stay position-based and published-only. |

---

## Platform consistency (required)

1. **Existing patterns?** List swipe matches Chats. ⋯ is MoreActionsSheet. Select dock matches shop Share · Order.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Hide, publish sheet, archive, order, share.  
4. **Naming matches the app?** Draft, Archived collections, Bookmarks, Hide Draft, Unhide Draft.

**Philosophy conflict?** No. Feed/Grid on You Collections and Repost on the collection row are dropped on purpose.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | List, chip, thumb, page ⋯, swipe, dock |
| Business rules | OK | Published + draft; archived and bookmarks are views |
| Workflows | OK | |
| Edge cases | OK | No photo → foam initial; long name truncates; share toast if not published |
| Permissions | N/A | |
| User states | OK | Select turns swipe off |
| Notifications | N/A | |
| Error handling | OK | Existing archive/hide toasts |
| Scalability | OK | |
| Mobile interactions | OK | Swipe on the list; dock clears the bottom (nav already hidden on `/more`) |
| First glance (BM-11) | OK | One list job; Draft chip is quiet |
| Accessibility | OK | Row name, menu items |
| Platform consistency | OK | |

---

## Approved scope

- Collections list + newest-photo thumb + page menu + swipe More/Share + dock without ⋯/Repost.
- Designs grid and Designs Find (Draft / Archived) stay. Designs select may still Repost.

## Explicitly deferred

- Per-photo timestamps in the database.
- Changing Explore or shop mosaics.
