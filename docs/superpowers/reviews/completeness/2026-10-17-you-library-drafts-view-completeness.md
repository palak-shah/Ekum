# Feature Completeness Review — You library page ⋯ Drafts

**Date:** 2026-10-17  
**Module / ask:** Idle page ⋯ on My collections adds **Drafts** beside **Archived collections** and **Bookmarks**, showing only draft/ready collections.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/settings.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Default list stays published + draft together. Drafts is an optional view, same job as Archived — not a second editor. |
| UX Designer | Idle menu order: Drafts, Archived, Bookmarks. Select-mode ⋯ stays Draft / Publish / Archive (hide/publish), not this view. |
| Solution Architect | `view=draft` mirrors `view=archived`. Mutually exclusive with saved and archived. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Archived collections toggle via page ⋯ and `view=`.  
2. **Duplicates another feature?** Select **Draft** hides published rows; this view only lists drafts. Different job, different menu.  
3. **Should reuse an existing workflow?** Reuse `youLibraryWriteSearch` + status filter.  
4. **Naming matches the app?** **Drafts** (plural view), not Seller/Buyer.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Toggle on/off; Draft + Ready only |
| Business rules | OK | Default list unchanged |
| Workflows | OK | Clear returns to the mixed list |
| Edge cases | OK | Switching to Designs drops `view=draft` |
| Permissions | N/A | Own library |
| User states | OK | Empty copy already exists for drafts |
| Notifications | N/A | |
| Error handling | OK | Existing list error state |
| Scalability | OK | Client filter of own collections |
| Mobile interactions | OK | Sheet menu; no new sticky bar |
| First glance (BM-11) | OK | Quiet menu item; list stays name-first |
| Accessibility | OK | Menu item + active state |
| Platform consistency | OK | |

---

## Gaps

None required.

---

## Approved scope for this slice

- Idle page ⋯ item **Drafts** (`you-library-page-drafts`), `view=draft`, toggle, exclusive with Bookmarks and Archived.
- List filter Draft + Ready; **Showing Drafts** + Clear; **New collection** stays on this view.
- Docs + e2e helper path when the collections filter square is absent.

## Explicitly deferred / rejected

- Changing select-mode **Draft** (hide published).
- A separate Drafts page or bottom-nav entry.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
