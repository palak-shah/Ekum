# Feature Completeness Review — WhatsApp-nice chat tidy / presence

**Date:** 2026-09-23  
**Module / ask:** Mark unread · Archived folder · Draft on list · Timed mute · Seen · Pin message · Links in In chats · Typing · (optional) Reactions · Group photo + one-line.  
**Anchors:** `docs/features/chat.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed (phased)

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders already archive and mute. They still lose chats, lose drafts, and cannot put a row back to “needs you”. Presence (Seen / Typing) and pin-in-thread help trade but are a second slice. |
| UX Designer | **⋯ → Archived** (occasional list, not a peer tab). Mark unread + Unarchive on the row floating menu. Mute → short sheet: **8 hours · 1 week · Always**. Draft line on the row (`Draft: …`, accent). Confirm stays a sheet. |
| Solution Architect | Unread = `lastReadAt` just before last message. Archived list = `inboxHiddenAt` not null (not participant `archived`). Drafts = device-local. Timed mute = `ThreadMember.mutedUntil`. Seen / Typing / pin / links / reactions / group photo need extra models or realtime — **Phase B**. |

---

## Platform consistency (required)

1. **Existing patterns?** Header ⋯ + row menu; kit Sheet for mute duration; PageHeader list like Starred / Find.  
2. **Duplicates?** No. Archive hide already exists; folder is the missing home.  
3. **Reuse?** `inbox-actions`, `inboxHiddenAt`, `lastReadAt`, mute patch.  
4. **Naming?** **Mark as unread · Archived · Unarchive · 8 hours / 1 week / Always**. Seen = other **shop**, not staff.

**Philosophy conflict?** No if we skip Favourites / lists / Lock / per-staff ticks.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Phase A: unread, archived folder, draft, timed mute |
| Business rules | OK | Our shop only for unread/archive; mute is per person |
| Workflows | OK | ⋯ Archived; row menu; mute sheet |
| Edge cases | OK | Empty archive; already unread hides Mark unread; expired mute = unmuted |
| Permissions | OK | Same membership |
| User states | OK | Opening a thread still marks read |
| Notifications | OK | Honor `mutedUntil` |
| Error handling | OK | Toast |
| Scalability | OK | Same list query |
| Mobile interactions | OK | No extra sticky dock |
| Accessibility | OK | Menu items + page title |
| Platform consistency | OK | Archived not a third All/Requests tab |

---

## Gaps

### G-001 — Presence, pin, links, reactions, group chrome

| Field | Content |
|-------|---------|
| Gap | Seen, Typing, pin message, Links find, Reactions, group photo + blurb |
| Why it matters | Realtime / new tables |
| Recommendation | Phase B after Phase A ships |
| Priority | Recommended enhancement |

---

## Approved scope for this slice (Phase A)

- **Mark as unread** — row menu when `unreadCount === 0`; `lastReadAt` just before last message  
- **Archived** — `⋯ → Archived` page; list `inboxHiddenAt` set; **Unarchive**; open thread does not auto-unarchive (new message still restores to All Chats)  
- **Draft on list** — local draft; row shows `Draft: …`  
- **Timed mute** — 8 hours / 1 week / Always; Unmute one tap  

## Explicitly deferred / rejected (Phase B / no)

- Seen (shop) · Pin message · Links in In chats · Typing…  
- Reactions · Group photo + one-line  
- Per-staff ticks, Favourites, lists, Lock, calls, video  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (Phase A)  
