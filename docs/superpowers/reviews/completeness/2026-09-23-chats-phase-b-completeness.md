# Feature Completeness Review — Chat Phase B

**Date:** 2026-09-23  
**Module / ask:** Seen · Typing · Pin message · Links in In chats · Reactions · Group photo + one-line.  
**Anchors:** `docs/features/chat.md`, `docs/features/00-concepts.md`, `2026-09-23-chats-whatsapp-nice-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need “did they see my rate” and a pinned line more than emoji chrome. Presence is shop-to-shop. No staff ticks, no Favourites. |
| UX Designer | Reuse thread ⋯, message chevron menu, In chats rows, kit Sheet for group photo + one-line. Header subtitle for typing. **Seen** under last outgoing only (1:1). Three reacts: 👍 ❤️ 🙏. |
| Solution Architect | No websocket today. Seen = other shop `lastReadAt`. Typing = `ThreadParticipant.typingAt` heartbeat + 4s poll on open thread. Pin = `Thread.pinnedMessageId`. Links = text body contains http/www. Reactions = one emoji per shop per message. Group `imageUrl` + `blurb`. |

---

## Platform consistency (required)

1. **Existing patterns?** Message menu, In chats find, mute sheet, group ⋯, company avatar.  
2. **Duplicates?** Star stays personal; pin is the thread’s one sticky line. Chat pin ≠ pin message.  
3. **Should reuse?** `lastReadAt`, find list, `uploadImage`, kit Sheet.  
4. **Naming?** **Seen** · **typing…** · **Pin message** · **Links** · **Group photo**. Other **shop**, never staff names.

**Philosophy conflict?** No if we skip per-staff ticks, Favourites, Lock, calls.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Six items; no WS |
| Business rules | OK | Seen/typing 1:1 only |
| Workflows | OK | Menu + In chats + group ⋯ |
| Edge cases | OK | Stale typing 6s; unpin; empty links |
| Permissions | OK | Same chats cap; group photo = `canManagePeople` |
| User states | OK | Poll while thread open |
| Notifications | N/A | Typing not a ping |
| Error handling | OK | Toast |
| Scalability | OK | Heartbeat on open thread only |
| Mobile interactions | OK | No new dock; BM-07 unchanged |
| Accessibility | OK | Menu items + aria on typing |
| Platform consistency | OK | |

---

## Gaps

None Required. Typing without live sockets is coarse (poll) — accepted.

---

## Approved scope for this slice

- **Seen** — 1:1; **Seen** under last outgoing when the other shop’s `lastReadAt` ≥ that message.  
- **Typing…** — 1:1 header `{shop} typing…`; POST heartbeat; expires ~6s. Groups: no.  
- **Pin message** — one per thread; banner; jump; Unpin.  
- **Links** — In chats + in-thread filter. Text with `http` / `www`.  
- **Reactions** — 👍 ❤️ 🙏; one per shop; tap again to clear; counts on bubble.  
- **Group photo + one-line** — ⋯ sheet; 80-char blurb; photo via existing upload.

## Explicitly deferred / rejected

- Per-staff ticks · Favourites · lists · Lock · calls · video · group typing · websocket bus  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
