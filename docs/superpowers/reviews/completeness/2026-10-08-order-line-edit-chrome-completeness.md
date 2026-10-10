# Feature Completeness Review — Order line edit chrome

**Date:** 2026-10-08  
**Module / ask:** Edit order / How many: always-visible one-line note; quiet × to remove (not teal Remove). Same row language across place/edit sheets.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Redesign → Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Place and Edit are everyday. Quiet **Add note** + teal **Remove** on Edit taught two languages for the same job. One chrome: one-line note + ×. |
| UX Designer | Thumb · name · note · qty · ×. Soft-remove on amend keeps quiet **Undo**. Sheet-level NoteAttachField stays for the whole-ticket note. |
| Solution Architect | Rewrite shared `HowManyLineNote`; amend sheet matches How many remove control. |

---

## Platform consistency (required)

1. **Existing patterns?** How many each already uses ×; reuse that. Kit `TextInput` for the note.  
2. **Duplicates?** No — unifies divergent Edit vs How many chrome.  
3. **Reuse?** Shared `HowManyLineNote` call sites (How many, builder, amend).  
4. **Naming?** One-line note field (placeholder Note); × / Undo.

**Philosophy conflict?** Yes — older BM-11 “empty note box too loud → Add note” for line notes. **Redesign:** everyday consistency wins; update `orders.md` then ship.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Note + remove unchanged in API |
| Business rules | OK | |
| Workflows | OK | Place + Edit + builder |
| Edge cases | OK | Soft-remove Undo on amend |
| Permissions | OK | |
| Mobile / BM-11 | OK | One-line field, not boxed CMS |
| Accessibility | OK | aria-labels on × / note |
| Platform consistency | OK | After Redesign |

---

## Approved scope

- Completeness + docs + gap matrix.  
- `HowManyLineNote` always one-line `TextInput`.  
- Edit order: × + shared note; Undo when soft-removed.

## Explicitly deferred

- Confirm / Dispatch / Quote field sets.  
- Dispatch LR · Bill footer alignment.  
- Order-detail expand chrome.

## Sign-off

Required gaps closed or deferred: Yes  
Ready for implementation: Yes  
