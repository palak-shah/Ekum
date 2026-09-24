# Feature Completeness Review — Qty stepper edit snap-back

**Date:** 2026-09-25  
**Module / ask:** Prefill 20 pc; leading 2 cannot be deleted while editing  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Piece counts must be easy to replace. Snap-back to 20 while typing is a blocking edit bug, not a new qty model. |
| UX Designer | Same − [box] + . Tap the box selects the number so the next digit replaces it. Empty / 0 stays while typing; blur / Enter / Done keeps a real count (≥ 1) or restores the last good one. |
| Solution Architect | Show the local draft as the input value (do not bind the committed number while focus is racing). Keep live parent updates only for valid counts so Same for all Apply still sees the typed number. |

---

## Platform consistency (required)

1. **Existing patterns?** QtyStepper on How many each + order builder.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same stepper.  
4. **Naming matches the app?** Pieces.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Delete / replace 20 |
| Business rules | OK | Commit ≥ 1 |
| Workflows | OK | Same for all Apply still reads the box |
| Edge cases | OK | Empty / 0 while typing; restore last good on blur |
| Permissions | N/A | |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new chrome (BM-07 N/A); Done / Enter still commit |
| Accessibility | OK | Same aria-label textbox |
| Platform consistency | OK | |

---

## Approved scope for this slice

- QtyStepper: always show draft; select-all on focus; valid counts still update the parent; blur / Enter commit or restore.
- Tests for replace / delete leading digit of 20.

## Explicitly deferred / rejected

- Home / Saved.
- Changing the default 20.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
