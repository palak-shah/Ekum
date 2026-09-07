# Voice notes on every order update

**Date:** 2026-09-06  
**Status:** Approved for implementation  
**Anchors:** `docs/features/orders.md`, settle + order trail, voice Wave 1  
**Extends:** `docs/superpowers/specs/2026-09-05-voice-chat-and-order-notes-design.md` §2 Wave 2  
**Related:** `docs/superpowers/specs/2026-09-06-settle-order-and-order-trail-design.md`

## Problem

Traders often want a quick spoken instruction when updating an order (especially **Raise a return**). Today only some sheets have optional voice (create, quote, settle). Dispatch, cancel, line decisions, return reason, payment, and other updates are text-only or have no note at all.

## Decision

Optional **Note + mic** on **every** order update sheet. Text only, voice only, or both are valid.

- Primary place the clip shows later: that step on the order **Timeline** (order trail).
- Where a domain field already owns the text (e.g. return **reason**, order create **note**, payment **note**), store the same clip on that record too so the return / payment / order block can play it without opening Timeline.

Do **not** post these clips as chat voice messages. Living order cards stay as today (optional short text body); audio lives on trail ± entity note fields.

---

## §1 Surfaces (sheets)

| Sheet | Note field today | Change |
|-------|------------------|--------|
| Place / photo order / amend | Yes (+ voice on create) | Ensure amend has Note + mic |
| Send quote | Yes + voice | Keep |
| Settle order | Yes + voice | Keep |
| Raise a return | Text **reason** only | Replace with Note + mic (reason text + optional voice) |
| Ask for payment | Text note | Add mic |
| Dispatch | No | Add optional Note + mic |
| Confirm / decline lines | Optional note on some paths | Ensure Note + mic |
| Cancel order / decline order | No | Add optional Note + mic |
| Seller return approve / decline / resolve | Text reason / note if any | Add Note + mic where missing |

Same control as quote/settle: kit `NoteVoiceField` (textarea + mic → preview → ×). Caps unchanged (~2 min).

---

## §2 Storage

| Layer | Role |
|-------|------|
| **Order trail** (`OrderTrailEvent`) | Always write `note` / `noteVoice*` when the actor left text or voice on that action. Timeline reads this. |
| **Entity fields** | Keep existing text fields; add nullable `noteVoiceMediaId` / URL / duration (or `reasonVoice*` on Return if `reason` stays the text column) on Return, PaymentRequest, and any other model that already surfaces the note on its own card. |
| **Dispatch / cancel / lines** | Trail-only is enough unless we already persist a shipment/order note column — prefer trail-only for new optional notes to avoid extra migrations. |

Ownership / access: same as parent order party. Media is company-owned audio (existing upload path).

---

## §3 Display

| Where | Behaviour |
|-------|-----------|
| Order Timeline | Under the step: text note (if any) + mini player (if voice) |
| Return block on order detail | Reason text + player when voice present |
| Payment ask UI | Note text + player when voice present |
| Order create note on detail | Already supports voice player — keep |
| Chat living card | No new voice bubble; optional truncated text only |

---

## §4 Explicitly not in this slice

- Posting order-update voice into the trade thread as `MessageType.Voice`
- Editing / replacing a clip after submit
- Transcription
- Samples / complaints (unless they already share the same return/order sheet — defer)

---

## §5 Platform consistency

- One control language: **Note** + mic; no second “Voice note” pattern
- Destructive actions (cancel, settle, decline) still confirm on the sheet; note is optional above the primary CTA
- BM-07: sheet content cleared above sticky footer + bottom nav when mic/preview is open

---

## §6 Tests (when implementing)

- Unit: DTOs accept note ± voice; trail append includes voice fields
- API: raise return with voice; dispatch with note+voice → trail row playable; reject foreign media id
- Web: Raise return sheet shows NoteVoiceField; Timeline plays return / dispatch clip
- Functional (optional this wave): raise return with voice → order detail shows player

## Docs to update when shipping

- `docs/features/orders.md` — note + voice on listed updates; Timeline playback  
- Mark Wave 2 shipped on `2026-09-05-voice-chat-and-order-notes-design.md`  
- Gap matrix  

## Open points (resolve in plan if needed)

1. Exact Prisma columns on `Return` (`reasonVoice*` vs rename to `note` + `noteVoice*`) — prefer **keep `reason` text**, add `reasonVoiceMediaId` / Url / Duration for minimal rename churn.  
2. Whether cancel/decline living-card body includes the typed note (yes if short; voice never inlined in chat body).
