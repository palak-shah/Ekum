# Feature Completeness Review — Chats cross-chat find

**Date:** 2026-09-13  
**Module / ask:** WhatsApp-style find across chats from Chats list search — Photos, Documents, Collections, Designs (not Orders).  
**Anchors:** `docs/features/chat.md`, ChatsPage search, in-thread scopes, Starred cross-chat  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders hunt a photo or pack shared weeks ago across many chats. WhatsApp Media search is the muscle memory. Orders stay on Orders tab. |
| UX Designer | Empty Chats search shows **In chats** shortcuts (not “Media”). Photos = grid; docs/cards = list. Tap → thread `?message=`. |
| Solution Architect | Cursor API across memberships by message type; reuse message hides + membership; dedicated `/chats/find` page. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — ListSearchRow, PageHeader back, PhotoAlbum thumbs, deep link `?message=`, Starred list precedent.  
2. **Duplicates another feature?** No — Starred is starred-only; Explore is catalog; Orders tab is tickets.  
3. **Should reuse an existing workflow?** Yes — message list filters + inbox deep search infrastructure.  
4. **Naming matches the app?** **In chats** · Photos · Documents · Collections · Designs — no Seller/Buyer.

**Philosophy conflict?** No — WhatsApp muscle memory + Ekum trade card types; Orders excluded to avoid dual homes.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Shortcuts → scoped results → thread |
| Business rules | OK | Visible threads only; hides respected |
| Workflows | OK | Empty search shortcuts; typed search stays chat list |
| Edge cases | OK | Empty kinds; deleted-for-me |
| Permissions | OK | Membership gate |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Empty / load fail |
| Scalability | OK | Cursor page ~40 |
| Mobile interactions | OK | Sticky search; grid clearance |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None Required for v1.

---

## Approved scope

- Chats search empty → **In chats**: Photos, Documents, Collections, Designs  
- Results: Photos grid (month groups); others list  
- API find by kind; tap → `/chats/:id?message=`  
- Docs: chat.md  

## Explicitly deferred

- Orders in this find  
- GIFs / Videos / Links / Audio  
- Recent searches avatars  
- List/grid toggle for Photos  

## Sign-off

Proceed — implement approved scope only.
