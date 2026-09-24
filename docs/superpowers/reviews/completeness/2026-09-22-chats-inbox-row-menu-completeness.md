# Feature Completeness Review — inbox row long-press menu

**Date:** 2026-09-22  
**Module / ask:** WhatsApp-style **long-press (or right-click)** on an All Chats row → sheet: Pin · Mute · Archive · Clear chat · Delete chat. Our shop only. Screenshot of WA menu (Mark unread / Lock / Favourites / list / Block **not** copied).  
**Anchors:** `docs/features/chat.md`, Completeness `2026-09-22-chats-inbox-select-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One-chat tidy must not require **Select chats**. Long-press is the WhatsApp muscle for Archive / Clear / Delete. Pin and Mute already exist on the open thread — same verbs on the list. |
| UX Designer | Kit **Sheet** only for confirm. Long-press uses the **thread ⋯ floating menu** (not a bottom sheet). Reuse `useLongPress` so iOS callout / ghost click do not open the thread. Select chats stays for bulk. Requests stay Open / Ignore. |
| Solution Architect | Reuse `POST /threads/inbox-actions` and existing pin/alert patches. No new participant `archived`. No mark-unread API this slice. |

---

## Platform consistency (required)

1. **Existing patterns?** Sheet rows like ChatsHeaderMore; long-press from photos / `useLongPress`. Pin/Mute copy from thread ⋯.  
2. **Duplicates another feature?** Complements Select chats; does not replace it.  
3. **Should reuse an existing workflow?** Yes — inbox-actions + pin + mute.  
4. **Naming matches the app?** **Pin chat** not Favourites; no lists; Block stays Network.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Pin, Mute, Archive, Clear, Delete |
| Business rules | OK | Our shop only for tidy |
| Workflows | OK | Long-press / context menu; confirm Clear/Delete |
| Edge cases | OK | Select mode: no menu. Requests: no menu |
| Permissions | OK | Same membership as thread |
| User states | OK | Unmute / Unpin labels |
| Notifications | N/A | Mute already silences |
| Error handling | OK | Toast |
| Scalability | OK | One thread |
| Mobile interactions | OK | Long-press; BM-07 unchanged |
| Accessibility | OK | Context menu desktop; sheet dialog |
| Platform consistency | OK | Sheet, not native checkboxes |

---

## Gaps

None Required.

### Deferred

| Field | Content |
|-------|---------|
| Gap | Mark as unread, Lock chat, Add to list, Favourites, Block from this menu |
| Why | No unread API; lists/Favourites rejected for Chats; Block is Network |
| Priority | Reject / Redesign (lists/Favourites/Lock) · Future (mark unread) |

---

## Approved scope for this slice

- Long-press / right-click All Chats row → **floating** menu (thread ⋯ chrome): Pin chat · Mute · Archive · Clear chat · **Delete chat** (1:1) or **Exit group** (group → `POST leave`)  
- Same our-shop inbox-actions as bulk select  
- Confirm Clear and Delete  

## Explicitly deferred / rejected

- Mark as unread, Lock, Favourites, Add to list, Block on this menu  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
