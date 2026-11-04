# Feature Completeness Review — Order sheet field chrome

**Date:** 2026-11-05  
**Module / ask:** Shared bordered surface editors on Confirm / Dispatch / Settle (prototype field chrome)  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, ui-quality-bar §4c  
**Disposition:** Proceed

> Theme exception §4c is explicit: these sheets use `bg-surface` + `border-line`, not `FIELD_IDLE_FILL_CLASS` / `bg-input`. How many / Amend keep foam pills.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One job stays Confirm / Dispatch / Settle; field chrome only — no CTA / Declined / why-line changes. Shared tokens avoid Confirm-only drift. |
| UX Designer | Equal h-10 Sets|₹, sentence-case labels, no foam wash on editors; hop notes match sheet surface. How many unchanged so Place stays familiar. |
| Solution Architect | `sheet*` tokens in `designLineChrome` + `QtyStepper chrome="sheet"`; re-export via `mobileOverflow`. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — kit TextInput / QtyStepper / NoteAttachField; sheet chrome is a named variant, not a one-off page paint.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — Confirm / Dispatch / Settle already share hop note + decide/ship/settle editors.  
4. **Naming matches the app?** Sheet chrome (not “confirm chrome”); labels stay Sets / ₹ per … / This LR / Final.  
5. **Units?** No rate/qty string change — chrome only.

**Philosophy conflict?** No — §4c exception documented; How many keeps shared field fill.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Visual chrome only |
| Business rules | N/A | |
| Workflows | OK | Same sheets |
| Edge cases | OK | Unticked Declined unchanged |
| Permissions | N/A | |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No sticky height change |
| First glance (BM-11) | OK | Confirm qty|₹ aligned; Dispatch This LR bordered |
| Units | N/A | |
| Accessibility | OK | Labels unchanged |
| Platform consistency | OK | Shared tokens |

---

## Approved scope for this slice

- `sheetStepperTrackClass` / `sheetNumInputClass` / `sheetRateInputClass` / `sheetTextInputClass` / `sheetFieldLabelClass` / `SHEET_COMPOSER_SHELL_CLASS`
- Confirm: indent past tick (existing stack), `items-end` qty|rate, Same for all + Manual/Personal/composer sheet chrome
- Dispatch: This LR `chrome="sheet"`; transporter/parcels/LR/Bill + hop note
- Settle: Final `SHEET_NUM_INPUT_CLASS` + hop note
- Docs + unit asserts no `bg-input` on sheet classes

## Explicitly deferred / rejected

- Global `FIELD_IDLE_FILL_CLASS` / How many foam change
- Confirm visible why-line / single full-width CTA / Can’t supply wording
