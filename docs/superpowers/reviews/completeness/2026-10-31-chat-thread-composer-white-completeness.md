# Feature Completeness Review — Thread Message pill white on wallpaper

**Date:** 2026-10-31  
**Module / ask:** Thread composer is a grey pill (`bg-input`) on a white footer. Make the Message box white; drop the white bar + colored box.  
**Anchors:** `docs/features/chat.md`, Completeness `2026-10-31-chat-composer-order-tag-completeness.md`  
**Disposition:** Proceed (chrome only)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Confirmed **thread-only** exception (ui-quality-bar §4c). Shared `--ekum-input` / `FIELD_IDLE_FILL_CLASS` unchanged. Ticket Notes and Share stay grey.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One white Message pill on the chat wallpaper. Everyday send is the job. |
| UX Designer | White pill (`bg-surface`) on `bg-chat`. No second white slab under a grey box. **+** left, h-9 voice/send, full pill — layout unchanged. |
| Solution Architect | `THREAD_COMPOSER_SHELL_CLASS` only. Form drops `bg-surface`. `COMPOSER_SHELL_CLASS` stays. |

---

## Platform consistency (required)

1. **Existing patterns?** Shared field fill stays for every other typed control. Thread well is already a named exception (`THREAD_COMPOSER_SHELL_CLASS`).  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same composer.  
4. **Naming matches the app?** Message.  
5. **Units?** N/A.

**Philosophy conflict?** No — explicit thread exception, not a silent per-page hex.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Send / voice / + unchanged |
| Business rules | N/A | |
| Workflows | N/A | |
| Edge cases | OK | Dark: `bg-surface` is the dark card |
| Permissions | N/A | |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Sticky composer; last bubble still clears chrome (BM-07) |
| First glance (BM-11) | OK | One white pill on wallpaper; grey box gone |
| Units | N/A | |
| Accessibility | OK | Same controls |
| Platform consistency | OK | Notes / Share / How many still `bg-input` |

---

## Gaps

None required. Thread-only fill was asked and confirmed.

---

## Approved scope for this slice

- `THREAD_COMPOSER_SHELL_CLASS` = `bg-surface` (not `bg-input`).
- Thread form sits on `bg-chat` (drop form `bg-surface`). Keep hairline + safe-area.
- Notes / Share / shared field fill unchanged.
- Unit + trader-eye.

## Explicitly deferred / rejected

- Changing `--ekum-input` / all fields white — **rejected**.
- Moving + or mic / emoji — **rejected**.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (chrome units + trader-eye; no new journey)
