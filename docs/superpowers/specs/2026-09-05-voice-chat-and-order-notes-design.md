# Voice messages (chat) + voice on order notes

**Date:** 2026-09-05  
**Status:** Approved for implementation (product chat)  
**Anchors:** `docs/features/chat.md`, `docs/features/orders.md`, media upload pipeline  
**Related:** MessageType.Voice already in domain; web has no record/play UI yet

## Problem

Traders often speak faster than they type. Chat docs already list **voice**, but the app only sends text/photo/cards. Order sheets (Send quote, builder, payment, returns, …) only accept text notes.

## Decision (Approach A)

Shared **record + play** kit used in two places:

1. **Chat** — WhatsApp-style voice messages (`MessageType.Voice`).
2. **Order notes** — text **and/or** a voice clip on the same note field (alongside, not either-or).

Do **not** post order-note audio as chat messages. Store an optional media attachment beside each text `note`.

## §1 Chat (WhatsApp-style)

| Rule | Detail |
|------|--------|
| Entry | Mic on composer when text input is **empty** |
| Record | **Hold** to record; **release** → preview (not auto-send) |
| Too short | Tap / empty clip → toast, no upload |
| Preview | Play · **× delete** · **Send** |
| Cancel | Slide left while holding → discard (no preview) |
| Bubble | Play/pause + duration + simple waveform (scrub optional later) |
| Cap | ~**2 minutes** / a few MB |
| Type | Existing `voice`; `body` = public media URL; `metadata.durationMs` (+ optional `mediaId`) |
| Actions | Reply / forward / star / delete like photo; **no edit** |
| Permission | Mic denied → toast: allow microphone to send voice |
| Search | Voice filter can follow later; not required for v1 |

## §2 Order notes (alongside text)

| Rule | Detail |
|------|--------|
| Surfaces | All order note fields: builder / photo order, Send quote, payment ask, returns, and other note-bearing sheets |
| Control | Shared Note row: existing textarea + **mic**; tap to record (forms are poor for hold-to-send); Stop → preview under field; × removes clip |
| Content | Text only, voice only, or both — all valid |
| Storage | Keep string `note`; add nullable **`noteVoiceMediaId`** (expose URL + duration on views). Do not stuff audio into the string |
| Display | Wherever text note shows (order detail, trade cards): mini player when voice present |
| Build waves | **Wave 1:** kit + chat + create-order note + quote note. **Wave 2:** same control on payment / return / remaining notes (same UX) — **shipped** 2026-09-06 (`2026-09-06-order-update-voice-notes-design.md`) |

## §3 Storage & limits

| Area | Detail |
|------|--------|
| Media | Add `MediaKind.Audio`; allow e.g. `audio/webm`, `audio/mp4`. Same upload-ticket → PUT → complete. **No** image thumbnail job for audio — mark ready on complete |
| Chat send | Validate voice like photo (body URL required); duration in metadata |
| Order DTOs / Prisma | Nullable `noteVoiceMediaId` (FK → Media) on each note-bearing model that ships in wave 1–2 |
| Caps | ~2 min / size limit; oversized → plain toast |
| Access | Same as parent (thread party / order party). No anonymous public playback |
| Out of scope v1 | Transcription, broadcast voice, scrubber polish, metered-network toggles |

## Platform consistency

- Reuse kit `Sheet` / toast / composer band patterns; mic must not fight BM-07 clearance on thread or sticky order CTAs.
- Plain trader copy; no “voicenote” jargon — **Voice** / **Hold to record** / **Note**.
- Forward of chat voice = forward media message (same rules as photo forward).

## Explicitly deferred

- Auto-migrate or backfill  
- Voice in Buyer groups / broadcast send  
- Editing a sent voice message  
- Server-side speech-to-text  

## Docs to update when shipping

- `chat.md` — composer mic, bubble, caps, actions  
- `orders.md` — note + optional voice on listed surfaces  
- Media feature note if present  

## Tests (when implementing)

- Unit: duration/cap helpers; send DTO refine for voice; note DTO accepts text and/or media id  
- API: upload audio content-type; send voice message; order create/quote with `noteVoiceMediaId`  
- Functional: record-send in chat; quote sheet note with voice preview; play on order detail  
