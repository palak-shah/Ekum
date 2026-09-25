# Feature Completeness Review — Nav ＋ must not be a dead tap

**Date:** 2026-09-25  
**Module / ask:** Client taps **＋**; no sheet, no navigation, no error.  
**Anchors:** `docs/features/catalog.md`, `docs/features/settings.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Last update gated the ＋ click (`selling && uploads` else Orders). That is the regression — it used to always open **New**. |
| UX Designer | Always open **New**. Caps choose the rows, not whether the sheet appears. You library **＋** stays on Saved. |
| Solution Architect | Click = `setSheetOpen(true)` only. Intent is sheet body: add / Orders / why-line. |

---

## Platform consistency (required)

1. **Existing patterns?** Nav ＋ / You trailing square / kit Sheet.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same New sheet.  
4. **Naming matches the app?** New · Add designs · New collection.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Every tap opens sheet or Orders |
| Business rules | OK | Team uploads / orders caps unchanged |
| Workflows | OK | Saved chip does not hide You ＋ |
| Edge cases | OK | Both buy/sell off → why-line |
| Permissions | OK | Caps still gate the actions |
| User states | OK | Owner / staff |
| Notifications | N/A | |
| Error handling | OK | Why-line instead of silence |
| Scalability | N/A | |
| Mobile interactions | OK | Same ＋ chrome as before the gate. Sheet above nav. |
| Accessibility | OK | aria-label Create / Add |
| Platform consistency | OK | |

---

## Gaps

None required.

## Approved scope for this slice

- Nav ＋ always opens **New** (revert the last-update click gate).
- Sheet rows from `createFabIntent`.
- You **＋** visible while Saved is the status chip.

## Explicitly deferred / rejected

- Photo order on nav ＋ (stays Orders / chat ＋).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes (units)
