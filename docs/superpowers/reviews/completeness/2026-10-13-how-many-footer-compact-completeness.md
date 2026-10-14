# Feature Completeness Review — How many footer compact (designs first)

**Date:** 2026-10-13  
**Module / ask:** How many sticky footer too tall — only ~2 designs visible; main job is ordering designs (~3.5–4 in view).  
**Anchors:** `docs/features/orders.md`, UI quality bar BM-11 (quiet optional chrome)  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Place path already approved; chrome drift made optional note/transporter steal the sheet. Compacting restores the job. |
| UX Designer | Idle sheet Note = **Add note** + **+**; qty + ₹ one row; Transporter one input; keep Place / Order for buyer. |
| Solution Architect | `NoteAttachField.collapseEmpty`; `TransporterField.compact`; no API change. |

---

## Platform consistency

1. Matches BM-11 / “Add note not a boxed input” for optional sheet note.  
2. Does not duplicate another feature.  
3. Reuses NoteAttachField / TransporterField.  
4. Naming unchanged.

**Philosophy conflict?** No — aligns with clutter-free How many.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Note / voice / photo / transporter / Place unchanged when used |
| Workflows | OK | Expand Add note before typing |
| Mobile / chrome | OK | Shorter sticky footer; list gets viewport |
| Platform consistency | OK | |

---

## Disposition

**Proceed** — implement compact footer only; update orders.md + unit tests.
