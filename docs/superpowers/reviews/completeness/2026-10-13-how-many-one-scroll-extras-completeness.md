# Feature Completeness Review — How many: one scroll, extras after lines

**Date:** 2026-10-13  
**Module / ask:** Transporter + Order for buyer steal sticky footer; prefer one scroll with sheet Note after all design lines.  
**Anchors:** `docs/features/orders.md`, UI quality bar (designs first; optional chrome quiet)  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Place path unchanged. Optional ticket chrome after qty lines; Place stays pinned. |
| UX Designer | Body: lines → **Add note** → Transporter → Order for buyer. Sticky: qty/₹ + Place / Ask / Choose buyer. |
| Solution Architect | Move nodes in `HowManyEachSheet` only; no API change. |

---

## Platform consistency

1. Matches BM-11 / one job per sheet (order designs).  
2. No duplicate feature.  
3. Same NoteAttachField / TransporterField / switch.  
4. Naming unchanged.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same fields, different home |
| Workflows | OK | Toggle buyer → Choose buyer still sticky CTA |
| Mobile / chrome | OK | Shorter sticky; BM-07 list clears footer |
| Platform consistency | OK | |

---

## Disposition

**Proceed** — one scroll extras after lines; sticky total + primary CTA only.
