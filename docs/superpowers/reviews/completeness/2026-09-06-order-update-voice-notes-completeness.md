# Feature Completeness Review — order update voice notes

**Date:** 2026-09-06  
**Module / ask:** Optional Note + voice on every order update sheet (Wave 2)  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, voice Wave 1, settle trail  
**Spec:** `docs/superpowers/specs/2026-09-06-order-update-voice-notes-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Conflicts with product philosophy → Reject/Redesign.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Spoken instructions on updates match textile workflow; optional only; return reason is the highest-pain gap. Scope “every update sheet” is coherent if one control and Timeline is the history home. |
| UX Designer | Reuse `NoteVoiceField` — no new pattern. Add optional Note to sheets that lack it (dispatch/cancel) without crowding primary CTAs. BM-07 on sheets with preview. |
| Solution Architect | Trail already stores note+voice; extend DTOs + trail append; entity voice columns only where UI already shows the note (Return, PaymentRequest). Avoid per-action chat voice messages. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — NoteVoiceField, trail Timeline player, media upload.  
2. **Duplicates another feature?** No — completes Wave 2 of approved voice-on-notes.  
3. **Should reuse an existing workflow?** Yes — same note+mic as quote/settle.  
4. **Naming matches the app?** **Note** + mic; plain trader language.

**Philosophy check?** No conflict.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | All listed sheets |
| Business rules | OK | Optional; party-owned media |
| Workflows | OK | Submit → trail ± entity |
| Edge cases | OK | Voice only / text only / neither |
| Permissions | OK | Order/return party; owned media |
| User states | OK | Same sheets |
| Notifications | N/A | No new notify type for clip alone |
| Error handling | OK | Existing voice upload toasts |
| Scalability | OK | Same media store |
| Mobile interactions | OK | BM-07 on sheets |
| Accessibility | Later | Mic label already on NoteVoiceField |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Trail types for return / payment steps

| Field | Content |
|-------|---------|
| Gap | Trail may lack `return_raised` / payment types so Timeline rows stay clear |
| Recommendation | Add trail type strings + labels for return raise/decide and payment ask when writing those events |
| Priority | Required before implementation |

### G-002 — Cancel/decline currently body-less

| Field | Content |
|-------|---------|
| Gap | POST cancel/decline take `{}` today |
| Recommendation | Optional note+voice body; keep empty body valid |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Note + mic on: amend, dispatch, decide lines, cancel, decline, raise return, payment ask, return approve/decline/resolve (where sheet exists)  
- Persist on trail always when present; Return + PaymentRequest entity voice columns  
- Timeline + return/payment blocks play clips  
- Docs + unit/API tests  

## Explicitly deferred / rejected

- Chat voice bubbles for order updates  
- Edit clip after submit; transcription  
- Samples / complaints  

## Sign-off

Disposition **Proceed**. Implement only approved scope after plan.
