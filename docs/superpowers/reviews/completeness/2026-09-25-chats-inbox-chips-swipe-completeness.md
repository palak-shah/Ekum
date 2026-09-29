# Feature Completeness Review — Chats chips, Requests, swipe, group thumb

**Date:** 2026-09-25  
**Module / ask:** All / Unread / Groups / Requests chips; swipe More+Archive; incoming group sender thumb.  
**Anchors:** `docs/features/chat.md`, ui-quality-bar  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Requests = pending first Message + See-new-packs asks. Network lists stay in Settings. |
| UX Designer | Kit FilterRail + Chip. Swipe calls the same menu/archive as long-press. |
| Solution Architect | Client filter Unread/Groups on active list. Follow asks from `GET /follows/asks`. |

---

## Platform consistency (required)

1. **Existing patterns?** FilterRail, InboxThreadRow long-press, kit Avatar.  
2. **Duplicates another feature?** Network Asked stays; Chats Requests is the *new* inbox.  
3. **Should reuse an existing workflow?** accept / decline / follows/decide / connection block.  
4. **Naming matches the app?** Approve / Ignore (not Accept). Block in More.

**Philosophy conflict?** No (Message→Connection is the paired Redesign doc.)

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Chips + swipe + thumbs |
| Business rules | OK | Select mode stays All |
| Workflows | OK | Warm both inboxes |
| Edge cases | OK | Empty per chip |
| Permissions | OK | chats cap |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Existing toasts |
| Scalability | OK | Client filter on page of 40 |
| Mobile interactions | OK | Swipe disabled while selecting; BM-07 |
| Accessibility | OK | Chip buttons + swipe + long-press |
| Platform consistency | OK | |

## Approved scope for this slice

- FilterRail chips; Requests mix; swipe; group incoming Avatar; Approve/Ignore dock; Block in More.

## Explicitly deferred / rejected

- WhatsApp Lock / Favourites. Redesigning Network.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
