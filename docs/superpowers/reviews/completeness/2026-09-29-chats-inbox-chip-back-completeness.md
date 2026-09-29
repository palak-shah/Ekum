# Feature Completeness Review — Chats inbox chip after Back

**Date:** 2026-09-29  
**Module / ask:** Groups (or Unread / Requests) → open a chat → Back stays on that chip, not All  
**Anchors:** `docs/features/chat.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Chip is the job. Leaving a group and landing on All is getting lost. Same for Unread / Requests. |
| UX Designer | Chip already writes `?inbox=`. Thread header Back hard-coded `/chats` (All). Remember last chip; Back and Chats tab return there. Same FilterRail. |
| Solution Architect | `chatsInboxHref` + remember last chip. Thread / group leave / decline use it. Routes unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Inbox chips + `?inbox=` deep links.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes.  
4. **Naming matches the app?** Groups / All / Unread / Requests.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Remember chip; Back to `chatsInboxHref` |
| Business rules | OK | All = `/chats`; others `?inbox=` |
| Workflows | OK | Home Requests still `/chats?inbox=requests` |
| Edge cases | OK | Cold open on a thread → All |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | Thread deep link still All unless they had a chip |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Header Back |
| Accessibility | OK | Same Back |
| Chrome / clip (BM-07) | N/A | |

---

## Approved scope

- Remember last inbox chip while on Chats.
- Thread Back, leave, decline, group leave/remove, and Chats tab go to that href.

## Explicitly deferred

- Starred / Archived / In chats Find still return to remembered chip (same helper if we touch them).

## Sign-off

Required gaps closed: Yes  
Ready: Yes
