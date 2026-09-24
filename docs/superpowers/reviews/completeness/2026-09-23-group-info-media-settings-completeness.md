# Feature Completeness Review — Group info Media + Settings

**Date:** 2026-09-23  
**Module / ask:** Media and Settings beside the businesses list. Media = Photos, Documents, Designs, Collections. Ekum-related only.  
**Anchors:** `docs/features/chat.md`, `2026-09-23-group-info-completeness.md` (deferred Media/Settings tabs)  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders open a group to see **who**, **what was shared**, and **quiet controls**. Media is this chat’s packs/files — not a third In chats home. Settings is mute / pin / our team / leave — not WhatsApp Voice or Admin. |
| UX Designer | One segmented row like All Chats / Requests: **Businesses · Media · Settings**. Media first shows four In-chats **rows**; tap a kind to list this thread only. Settings = tappable rows, confirm sheets for Leave / Remove. Mute keeps the sibling flyout. |
| Solution Architect | Reuse `GET /threads/:id/messages?view=`. No new table. Photo grid + PhotoViewer; other kinds jump to `?message=`. |

---

## Platform consistency (required)

1. **Existing patterns?** Chats tab bar; In chats kind rows; thread search scopes; mute flyout; Team on chat sheet.  
2. **Duplicates another feature?** Thread header search still searches the conversation. Media is browse-by-kind from the group page.  
3. **Should reuse?** Message `view` filter, PhotoViewer, ConfirmActionSheet.  
4. **Naming?** **Businesses** (not Members). **Media**. **Settings**. Kind labels Photos / Documents / Designs / Collections.

**Philosophy conflict?** No — still no other-shop staff, no Voice, no Media/Settings as peer **bottom-nav** tabs.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Three segments; four media kinds; settings actions |
| Business rules | OK | Same mute / leave / remove / team rules |
| Workflows | OK | Kind → results → chat `?message=` |
| Edge cases | OK | Empty kind copy; 1:1 has no this page |
| Permissions | OK | Team / photo / remove = owners |
| User states | OK | Muted → Unmute |
| Notifications | N/A | |
| Error handling | OK | Toast / ErrorState |
| Scalability | OK | Cursor page + Show more |
| Mobile interactions | OK | BM-07 padding unchanged |
| Accessibility | OK | tablist + tabs |
| Platform consistency | OK | Segmented bar, not 3 fat icon pills |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Segment **Businesses · Media · Settings** on the group page.  
- **Media:** Photos · Documents · Designs · Collections (this thread). Photos = month grid; others = list → thread message.  
- **Settings:** Mute (flyout) · Pin · Team on chat (owners) · Leave · Remove group (when allowed).

## Explicitly deferred / rejected

- Voice · Links · Orders · Starred on this Media list  
- WhatsApp Admin / Members people list  
- Editing the group name

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
