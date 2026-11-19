# Feature Completeness Review — Chat delivery ticks (sent / delivered / seen)

**Date:** 2026-11-19  
**Module / ask:** Client bug #72 — WhatsApp-like sent → delivered → read ticks on 1:1 chat  
**Anchors:** `docs/features/chat.md`, Completeness `2026-09-23-chats-phase-b`, `2026-10-30-chat-order-note-under-thumbs`  
**Disposition:** Proceed (Redesign of prior “no grey ticks” Reject)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Prior locks this slice **replaces** (historical, not deleted): grey sent/delivered ticks Rejected; blue Seen only on **last** outgoing beside the clock.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need “did my rate land / did they open it.” 1:1 only. No staff ticks. No websocket — poll already drives Seen. |
| UX Designer | Same time cluster as today’s Seen. Grey single = sent; grey double = delivered; blue double = Seen. Every outgoing bubble, not only the last. Groups stay tick-free. |
| Solution Architect | Add `ThreadParticipant.lastDeliveredAt`. Stamp when the other shop loads thread messages. Keep `lastReadAt` for Seen. Domain helper returns `sent \| delivered \| seen`. |

---

## Platform consistency (required)

1. **Existing patterns?** Reuse `MessageTimeMeta` + `text-tick` chrome; extend, don’t invent a second time row.  
2. **Duplicates another feature?** No — replaces Seen-only with a three-state ladder.  
3. **Should reuse an existing workflow?** Same mark-read + message list poll.  
4. **Naming matches the app?** Accessible names: **Sent** · **Delivered** · **Seen**. Shop-to-shop, not staff.  
5. **Units?** N/A.

**Philosophy conflict?** Yes vs prior Reject → **Redesign** then Proceed with explicit product lock below.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Three tick states on Direct outgoing |
| Business rules | OK | Direct only; stamp deliver on recipient message fetch |
| Workflows | OK | Send → open by other → read |
| Edge cases | OK | Groups/trio: no ticks; pending/archived unchanged |
| Permissions | OK | Participant must load messages to deliver |
| User states | OK | Offline counterpart stays Sent until they poll |
| Notifications | N/A | No new notify |
| Error handling | OK | Missing timestamps → Sent |
| Scalability | OK | One column write on list fetch |
| Mobile interactions | OK | BM-07 unchanged; ticks stay in time cluster |
| First glance (BM-11) | OK | Quiet beside clock; blue only for Seen |
| Units | N/A | |
| Accessibility | OK | aria-label per state |
| Platform consistency | OK | MessageTimeMeta only |

---

## Gaps

### G-001 — Prior Reject of grey ticks

| Field | Content |
|-------|---------|
| Gap | Under-thumbs Completeness Rejected grey sent/delivered |
| Why it matters | Sheet #72 + owner lock now wants full ladder |
| Impact if ignored | Silent drift from docs |
| Recommendation | Redesign: document three states; remove “no grey ticks” from chat.md |
| Priority | Required before implementation |

### G-002 — Delivery without websocket

| Field | Content |
|-------|---------|
| Gap | No push ACK today |
| Why it matters | “Delivered” must mean something real |
| Impact if ignored | Fake double-grey on send |
| Recommendation | Stamp `lastDeliveredAt` when counterpart **GET**s messages for that thread |
| Priority | Required before implementation |

---

## Approved scope for this slice

- `ThreadParticipant.lastDeliveredAt` + migration; expose on thread detail participants.
- Stamp deliver on recipient message list / thread open that returns messages.
- Domain `outgoingDeliveryTicks` → `sent | delivered | seen` (Direct only).
- `MessageTimeMeta` tick states on **each** outgoing Direct bubble (incl. trade cards).
- Units + light e2e: send → Sent; other opens → Delivered; read → Seen.
- Update `docs/features/chat.md` + gap matrix.

## Explicitly deferred / rejected

- Group / trio delivery ticks  
- Websocket / push delivery  
- Per-staff ticks  
- #71 selection reset  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
