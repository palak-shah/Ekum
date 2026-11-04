# Feature Completeness Review — Order notes Send icon + Enter grow

**Date:** 2026-11-04  
**Module / ask:** Ticket Notes composer — drop grayed **Add**; chat-like growing textarea; **Enter** sends; **Shift+Enter** newline; **Send** icon only when ready.  
**Anchors:** `docs/features/orders.md` (Ticket Notes), ui-quality-bar, chat ThreadPage composer  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same hop Notes job; quieter submit matches chat — no disabled Add when empty. |
| UX Designer | Composer well stays; Send accent square when `canSubmit`; field grows like chat (`min-h-9` · `max-h-[120px]`). |
| Solution Architect | UI-only in `NoteAttachField` composer + `OrderTicketNotes` endSlot; reuse `chatComposerHeightPx`. |

---

## Platform consistency (required)

1. **Existing patterns?** Chat composer grow + Enter/Shift+Enter; `COMPOSER_SHELL_CLASS`; `SendIcon` + `THREAD_COMPOSER_CONTROL_CLASS`.  
2. **Duplicates another feature?** No — ticket Notes already had Add; this matches chat submit language.  
3. **Should reuse an existing workflow?** Yes — grow helper + keydown in `NoteAttachField` `layout="composer"`.  
4. **Naming matches the app?** **Send** (aria-label), not Add.  
5. **Units?** N/A — no rate/qty string change.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Enter → onAdd when ready; Shift+Enter newline + grow |
| Business rules | OK | Unchanged note/voice/photo attach rules |
| Workflows | OK | Same `POST /orders/:id/notes` |
| Edge cases | OK | Empty = no Send; composing IME ignored; adding disables Send |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Existing InlineNotice |
| Scalability | N/A | |
| Mobile interactions | OK | Compact Send; grow capped at 120px |
| First glance (BM-11) | OK | Empty composer quiet; multi-line grows; Send tappable when ready |
| Units | N/A | |
| Accessibility | OK | `aria-label="Send"`; `enterKeyHint="send"` |
| Platform consistency | OK | Matches chat judgment |

---

## Gaps

None Required.

---

## Approved scope for this slice

- `NoteAttachField` composer: rows=1 textarea, auto-grow, Enter → `onComposerSubmit` when content ready, Shift+Enter newline.  
- `OrderTicketNotes`: Send icon only when `canSubmit`; no grayed Add.  
- Docs + unit tests (+ e2e test id / empty assert).

## Explicitly deferred / rejected

- Chat ThreadPage itself  
- Personal note sheet; How many Add note  
- + attach menu redesign

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
