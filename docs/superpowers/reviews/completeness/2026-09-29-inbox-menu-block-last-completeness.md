# Feature Completeness Review — Inbox menu: Block last

**Date:** 2026-09-29  
**Module / ask:** Block must not be first on the chat row menu; follow WhatsApp-style order  
**Anchors:** `docs/features/chat.md`, `2026-09-22-chats-inbox-row-menu-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Everyday tidy (pin, mute, unread, archive) first. Clear / delete next. Block is rare and silent Network — last, like WhatsApp puts it under More. |
| UX Designer | Same menu, same labels. Do not invent a new Block style. First item is Pin chat. |
| Solution Architect | Reorder `ChatsInboxRowMenu` only. |

---

## Platform consistency (required)

1. **Existing patterns?** WhatsApp chat-list: Pin · Mute · unread · Archive · delete. Block at the bottom.  
2. **Duplicates?** No.  
3. **Reuse?** Same menu.  
4. **Naming?** Unchanged.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same actions |
| Business rules | OK | Block still 1:1 with a counterpart |
| Workflows | OK | |
| Edge cases | OK | Groups: Exit group then no Block if no counterpart |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | |
| Accessibility | OK | Same menuitems |
| Chrome / clip (BM-07) | N/A | |
| Platform consistency | OK | |

---

## Approved scope

Order: **Pin chat · Mute · Mark as unread** (if read) **· Archive · Clear chat · Delete chat / Exit group · Block**.

## Sign-off

Required gaps closed: Yes  
Ready: Yes
