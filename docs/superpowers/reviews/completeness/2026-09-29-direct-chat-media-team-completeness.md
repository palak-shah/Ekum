# Feature Completeness Review — 1:1 Media and Team

**Date:** 2026-09-29  
**Module / ask:** Individual business chats should have Media and Team like groups  
**Anchors:** `docs/features/chat.md`, `2026-09-23-group-info-media-settings-completeness.md`, `2026-09-23-group-info-your-team-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same jobs as the group page: find photos/files/cards in **this** chat; see **our** people on it. Not the other shop’s staff. Shop catalogue stays a shop page. |
| UX Designer | Same gesture as groups: tap the **chat title**. Same Media kinds. Tab **Team** (not a third Settings — Mute/Pin stay on thread ⋯). Hero is the other business; tap opens the shop (`fromChat`). |
| Solution Architect | Reuse `/chats/:id/info`, `GroupInfoMediaPanel`, `ThreadDetail.people`, `ThreadPeopleSheet`. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Group info tabs, Media kinds, Your team rows, shop from chat.  
2. **Duplicates another feature?** In-thread search stays; this is browse-by-kind.  
3. **Should reuse?** Same info route and media panel.  
4. **Naming?** **Media** · **Team**. Shop is the business name, not “Profile”.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Title → info; Media; Team; shop on hero |
| Business rules | OK | Our people only; owners Add / × |
| Workflows | OK | Chat → info → shop or media kind or team sheet |
| Edge cases | OK | Pending 1:1 still has info; empty media copy |
| Permissions | OK | canManagePeople same as group |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Same as group page |
| Scalability | OK | Same message views |
| Mobile interactions | OK | Same list pad (BM-07) |
| Accessibility | OK | Title link; tabs |
| Chrome / clip (BM-07) | OK | Same pb as group info |
| Platform consistency | OK | |

---

## Approved scope

- 1:1 title → `/chats/:id/info` (no longer straight to the shop).  
- Hero: other shop → `/company/:id` with `fromChat`.  
- Tabs **Media · Team**. Media = Photos / Documents / Designs / Collections in this chat.  
- Team = Your team list + owner Add / × (same sheet as groups).

## Explicitly deferred

- Settings tab on 1:1 (Mute / Pin / Leave stay on thread ⋯).  
- Group invite / add businesses on 1:1.

## Sign-off

Required gaps closed: Yes  
Ready: Yes
