# Feature Completeness Review — Replace opens Designs / Photos in sheet

**Date:** 2026-10-10  
**Module / ask:** After **Replace**, do not leave the trader on the album to tap dock **Designs** / **Photos**. Ask source in the Replace sheet, then open that picker.  
**Anchors:** `docs/features/collections.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Replace is one job: pick the new set. Source choice belongs in that sheet, not a second dock hop. |
| UX Designer | Same doors as Add (**Add from existing designs** · **Add photos**). Why-line: updates only after save; cancel / empty keeps album. |
| Solution Architect | Extend `OwnerPackReplaceSheet`; viewer wires doors → library / camera with replace pending. Editor chooser sheet stays for Add; Replace sheet matches. |

---

## Platform consistency (required)

1. **Existing patterns?** Reuse `AddDesignsControl` doors (create / editor Add sheet).  
2. **Duplicates another feature?** No — removes toast + dock hop.  
3. **Should reuse an existing workflow?** Yes — library picker + ContinuousCamera / gallery.  
4. **Naming matches the app?** Replace whole collection · Add from existing designs · Add photos.

**Philosophy conflict?** No — fewer taps; one job in the sheet.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Sheet → Designs or Photos |
| Workflows | OK | replacePending set when a door is chosen |
| Edge cases | OK | Close sheet without pick = no pending |
| Mobile interactions | OK | Sheet; BM-07 unchanged |
| First glance (BM-11) | OK | Doors loud; no dock scavenger hunt |
| Platform consistency | OK | |

---

## Approved scope

- `OwnerPackReplaceSheet`: why-line + Designs/Photos doors (+ Cancel).  
- Viewer: door → open library or photos in replace mode.  
- Docs + unit on sheet copy/doors.  
- No rely on idle dock after Replace confirm.

## Explicitly deferred

- Changing idle dock Labels Designs · Photos · Replace.  
- Merging Add and Replace into one dock control.
