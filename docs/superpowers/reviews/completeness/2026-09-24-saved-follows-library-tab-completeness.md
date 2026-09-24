# Feature Completeness Review — Saved follows Designs / Collections

**Date:** 2026-09-24  
**Module / ask:** Saved must not nest its own Designs / Collections tabs  
**Anchors:** `docs/features/saved.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Kind is chosen once: Designs → Saved or Collections → Saved. A second pair inside Saved is the same job twice. |
| UX Designer | Parent pills stay. Saved chip only filters the list. Buyers still get Designs / Collections so they can switch saved kind. |
| Solution Architect | Embedded SavedPage never renders kind tabs. Kind from `tab=collections` / Designs default. |

---

## Platform consistency (required)

1. **Existing patterns?** One mode pill row (Chats, catalog).  
2. **Duplicates another feature?** Inner Saved tabs duplicated Designs / Collections.  
3. **Should reuse?** Parent library tabs.  
4. **Naming matches the app?** Saved.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Album vs design bookmarks stay independent |
| Workflows | OK | Bookmark still lands Designs+Saved or Collections+Saved |
| Edge cases | OK | Buyers: pills + saved list, no Published chips |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | One fewer pill row |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Approved scope for this slice

- No Designs / Collections inside the Saved list.
- You always shows Designs / Collections; Saved follows that tab.

## Explicitly deferred / rejected

- Mixed saved designs + collections in one list.

## Sign-off

Required gaps closed: Yes. Ready: Yes.
