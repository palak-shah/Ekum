# Feature Completeness Review — Voice chat + order notes

**Date:** 2026-09-05  
**Module / ask:** WhatsApp-style chat voice + voice alongside text on all order note fields  
**Anchors:** `docs/features/chat.md`, `docs/features/orders.md`, design `2026-09-05-voice-chat-and-order-notes-design.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary |
|------|---------|
| Product Manager | Speaks to busy traders; chat type already named; order notes stay text-capable with optional clip. |
| UX Designer | Chat = hold-to-send; forms = tap record. Shared player. Wave 1/2 for note surfaces without dual product shapes. |
| Solution Architect | Extend media for audio; voice messages; `noteVoiceMediaId` beside notes — not audio-in-string or fake chat posts. |

## Platform consistency

1. Existing patterns? Composer + media upload + Note fields.  
2. Duplicates? No second “voicenote” product.  
3. Reuse? Shared record/play kit.  
4. Naming? Voice / Note — plain words.

**Philosophy conflict?** No.

## Checklist

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Chat + order notes |
| Business rules | OK | Caps, access via parent |
| Workflows | OK | Wave 1 then wire remaining notes |
| Edge cases | OK | Mic deny, cancel hold, empty text+voice |
| Permissions | OK | uploads + thread/order party |
| Mobile / BM-07 | OK | Composer/note chrome clearance required |
| Notifications | Later | Unread preview “Voice” — fine to ship with generic |
| Accessibility | Gap | Player needs labelled play/pause (Required in impl) |
| Platform consistency | OK | |

## Gaps

### G-001 — Notification / inbox preview copy for voice

| Field | Content |
|-------|---------|
| Gap | Inbox last-message may need “Voice” label |
| Priority | Recommended with chat wave |

### G-002 — Remaining note surfaces after wave 1

| Field | Content |
|-------|---------|
| Gap | Payment / return / other notes wired in wave 2 |
| Priority | Required before claiming “all notes” done |

## Approved scope

- Shared kit; chat WhatsApp voice; order notes alongside text; media audio; wave 1 then wave 2 as in design.

## Explicitly deferred

- Transcription, broadcast voice, edit sent voice, scrubber polish

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation planning: Yes  
