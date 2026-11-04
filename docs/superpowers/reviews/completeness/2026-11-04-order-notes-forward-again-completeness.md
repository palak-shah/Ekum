# Feature Completeness Review — Order notes Forward again

**Date:** 2026-11-04  
**Module / ask:** After a ticket note is Forwarded once — how does the trader edit and Forward again?  
**Anchors:** `docs/features/orders.md` (Ticket Notes), ui-quality-bar  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Notes stay append-only. Do not invent in-place edit or gray-until-changed Forward.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Re-forward = write a **new** note → Send → Forward. Forwarded cue = already copied. |
| UX Designer | Quiet second line under Forwarded when trader can forward: “Write a new note to forward again.” No edit chrome. |
| Solution Architect | UI-only cue; no API / trail mutation change. |

---

## Platform consistency

1. **Existing patterns?** Muted cue under note bubble (same as **Forwarded** / On confirm).  
2. **Duplicates?** No.  
3. **Reuse?** Same Notes composer.  
4. **Naming?** Forward / Forwarded; plain “Write a new note…”.  
5. **Units?** N/A.

**Philosophy conflict?** No. Rejected: editable notes; gray Forward that re-enables on edit; re-Forward same body without a new note.

---

## Approved scope

- Docs lock re-forward path.  
- Cue on `row.forwarded` when `canForward`.  
- **Stamp source** trail payload `forwarded: true` after Forward (place → requested trail); reject re-Forward (`NOTE_ALREADY_FORWARDED`) so the same note cannot create multiple copies.  
- Unit tests.

## Explicitly deferred / rejected

- Edit trail note in place  
- Gray Forward until changed  
- Re-Forward identical body without a new note (API + UI)

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
