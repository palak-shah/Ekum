# Feature Completeness Review — inbox select: archive / clear / delete

**Date:** 2026-09-22  
**Module / ask:** Chats header **⋯ → Select chats**, then **Archive · Clear · Delete** on the selected rows. Our shop only (WhatsApp-like); the other party is unchanged.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need to tidy the inbox without ending the trade relationship. **Leave** / **Remove group** stay person/group roster tools. Inbox tidy is hide / empty / drop-the-row **for our company**. Other shop still has the thread. Incoming message (or **＋** Open existing) brings an archived row back to **All Chats**, not Requests. |
| UX Designer | **⋯ → Select chats** (with Mark all read). Tap rows — accent border + wash, **not** checkboxes (ConnectionPicker / HowManyEach). **Select all / Clear** float. Sticky dock above bottom nav: **Archive · Clear · Delete**. Confirm Clear and Delete. Header **Cancel** while selecting. BM-07: list padding clears dock + nav. Select mode on **All Chats** only (Requests stay Open / Ignore). |
| Solution Architect | Do **not** set participant `archived` (that is Ignore / Leave / block; nudge restores **Pending**). Add `ThreadParticipant.inboxHiddenAt`. List + unread skip hidden. **Archive** = hide row, keep messages. **Clear** = `MessageHide` all messages for our company, row stays. **Delete** = hide messages + hide row. Bulk `POST /threads/inbox-actions`. Any new send clears `inboxHiddenAt` for Active participants. |

---

## Platform consistency (required)

1. **Existing patterns?** List select + SelectAllFloat + dock above nav (catalog / thread forward). Destructive confirm = kit Sheet.  
2. **Duplicates another feature?** No — Leave posts a leave line and can be blocked on last 1:1 owner; Remove group is groups-only. This slice is inbox hide.  
3. **Should reuse an existing workflow?** Reuse `MessageHide` for Clear/Delete; reuse list chrome; do not reuse `archiveGroup` / `leave`.  
4. **Naming matches the app?** **Select chats · Archive · Clear · Delete**. Not Favourites, not buyer groups.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Select → Archive / Clear / Delete, our side |
| Business rules | OK | Other party unchanged; 1:1 allowed (unlike Leave) |
| Workflows | OK | ⋯ Select chats; Cancel; confirm Clear/Delete |
| Edge cases | OK | Empty selection no-ops; skip unknown ids; trade thread restore unhides |
| Permissions | OK | `chats` cap; company-wide (all staff on the thread see the same inbox) |
| User states | OK | All Chats only; Requests unchanged |
| Notifications | OK | Hidden chats drop out of unread badge |
| Error handling | OK | Toast / sheet error; partial skip |
| Scalability | OK | Max 40 ids (one inbox page) |
| Mobile interactions | OK | Dock + nav clearance (BM-07) |
| Accessibility | OK | aria-pressed on rows; Cancel in header |
| Platform consistency | OK | Accent-select, no native checkbox |

---

## Gaps

### G-001 — Do not reuse `archived` participant state

| Field | Content |
|-------|---------|
| Gap | `archived` + `nudgeArchivedRecipients` restores **Pending** (Requests). WhatsApp archive must return to **All Chats**. |
| Why it matters | Archive would look like a new first-contact. |
| Impact if ignored | Traders think the shop ignored them. |
| Recommendation | `inboxHiddenAt` separate from `state`. |
| Priority | Required before implementation |

### G-002 — Archived folder

| Field | Content |
|-------|---------|
| Gap | No **Archived** inbox tab. |
| Why it matters | Recovery is only new message or **＋** Open existing. |
| Impact if ignored | Mild; WhatsApp folder can wait. |
| Recommendation | Later. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Header **⋯**: **Select chats** + **Mark all read**
- Select mode on **All Chats**: tap rows, Select all / Clear, Cancel
- Dock: **Archive** (no confirm), **Clear** (confirm), **Delete** (confirm)
- Copy: **Your shop only. They keep the chat.**
- API `POST /threads/inbox-actions` `{ action, threadIds }`
- Migration `inboxHiddenAt`
- Unhide on send / Open existing / ensureTradeThread
- Units + `@chat` functional: select → archive 1:1, other party still lists it

## Explicitly deferred / rejected

- Archived folder / Unarchive list
- Select on Requests
- Native checkboxes
- Buyer-group chips on this rail
- Delete for everyone / Leave from this dock

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
