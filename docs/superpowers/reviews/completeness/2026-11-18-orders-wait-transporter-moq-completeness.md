# Feature Completeness Review — Orders wait / transporter / one unit / MOQ flag (#26–#29)

**Date:** 2026-11-18  
**Module / ask:** Sheet #26 wait after confirm; #27 buyer preferred transporter (WAD); #28 progress in order unit; #29 quiet Below minimum  
**Anchors:** `docs/features/orders.md`; buyer transporter Completeness `2026-10-08`; waiting map `2026-11-04`; sell-as-units  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | After confirm, buyer wait must say dispatch — not supplier. Preferred transporter before first ship is wholesale WAD. Progress must not invent pcs-as-sets. MOQ is a quiet flag only. |
| UX Designer | Ticket + list cue **Waiting: dispatch**. Preferred transporter quiet line. Below minimum muted under How many (and Confirm if same helper). No Accept/Reject. |
| Solution Architect | Branch wait helpers; polish transporter copy; collapse catalog-whole + never multiply by `piecesPerPack` in ship totals; `howManyBelowMinimum` helper. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — waiting cues, preferred transporter, How many meta, ship progress.  
2. **Duplicates?** No.  
3. **Reuse?** Wait helpers + How many heading.  
4. **Naming?** Waiting: dispatch; Preferred transporter; Below minimum.  
5. **Units?** Progress = **order** unit on ticket/list. Pack size never becomes the denominator. Whose = line design (or collapsed catalog-whole lead).

**Philosophy conflict?** No. #27 audit “hide transporter” rejected — product lock is WAD keep + Preferred copy.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | #26–#29 as locked |
| Business rules | OK | WAD transporter; MOQ non-blocking |
| Workflows | OK | Place → confirm → wait dispatch |
| Edge cases | OK | qty 0 no flag; set+pack; zero shipments preferred line |
| First glance (BM-11) | OK | Quiet flag, not banner |
| Units | OK | order unit on progress |
| Platform consistency | OK | |

---

## Approved scope

- Buying idle: `requested` → Waiting: supplier; `confirmed` / `part_shipped` + remaining → **Waiting: dispatch**
- Preferred transporter copy; keep pre-ship line (WAD)
- Ship progress: order unit only; catalog-whole collapsed; regression pack=3 qty=1
- Quiet **Below minimum** when 0 &lt; qty &lt; moq on How many (+ Confirm if shared)

## Explicitly deferred

- #31–#33 edit/forward MOQ warnings  
- #40 buyer LR after dispatch  
- #35 can’t-supply progress denominator  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
