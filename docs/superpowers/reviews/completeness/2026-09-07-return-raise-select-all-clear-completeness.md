# Feature Completeness Review — Raise return Select all / Clear

**Date:** 2026-09-07  
**Module / ask:** Select all + Clear on Raise a return sheet  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/superpowers/specs/2026-09-07-return-raise-select-all-clear-design.md`  
**Disposition:** Proceed

> Small affordance on an existing sheet; matches existing multi-select copy. No philosophy conflict.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Full-return default stays; Clear unlocks “return one”; Select all restores full return. |
| UX Designer | Inline count + Select all / Clear in sheet — same language as attach pickers; no sticky float in Sheet. |
| Solution Architect | Client-only state on existing `returnSelected` / `returnQty`; no API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Select all / Clear text actions; accent-border Return/Skip rows.  
2. **Duplicates another feature?** No — sheet-scoped, not traveling Selection.  
3. **Should reuse an existing workflow?** Reuse copy/pattern; do not mount page `SelectAllFloat` in Sheet.  
4. **Naming matches the app?** **Select all** / **Clear**.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Select all / Clear / row toggle |
| Business rules | OK | Default all on; submit still needs ≥1 |
| Workflows | OK | Same raise-return path |
| Edge cases | OK | 0 returnable lines; already-all-on disables Select all |
| Permissions | N/A | Buyer sheet only (unchanged) |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Submit validation unchanged |
| Scalability | OK | Client-only |
| Mobile interactions | OK | In-sheet; no new sticky above nav |
| Accessibility | OK | Buttons with clear labels; Select all disabled when all on |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Raise return sheet: count row with **Select all** / **Clear** per approved spec  
- Update `docs/features/orders.md`  
- Regression unit covering Clear → empty and Select all → restore  

## Explicitly deferred / rejected

- Return raised → living chat card (separate product ask)  
- Seller decide-return bulk select  
- Changing open-with-all-selected default  

## Sign-off

| Role | Result |
|------|--------|
| Completeness | **Proceed** |
| Spec | `2026-09-07-return-raise-select-all-clear-design.md` |
