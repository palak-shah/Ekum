# Feature Completeness Review — Tag exit + design Category when pack has none

**Date:** 2026-10-20  
**Module / ask:** While adding tags: **easy way to exit**, and **autosuggest must not die** after the first pick. If the **collection has no Category**, show the Category dropdown **on the design** too.  
**Anchors:** `docs/features/catalog.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Official Item/Quality/Size lists need a Category. Pack Category is the source when set. Empty pack must not leave the design mute. Adding several tags is one job — suggestions stay until they leave. |
| UX Designer | No extra Done button on the field (chrome). Stay in the list after a pick (remaining tags). Exit = Escape / empty Enter / tap outside / keyboard Done — then blur so the overlay and keyboard go. Member sheet / Edit design: dropdown only while the pack has no Category; lock **From collection** once it does. |
| Solution Architect | Reuse `TagSuggestInput` + `MasterCategoryField`. Member sheet writes the **pack** `masterCategoryId` (same `onMasterCategoryChange`). ProductEditor already unlocks when no pack Category. |

---

## Platform consistency (required)

1. **Existing patterns?** Collection Category + typeaheads. ProductEditor locked vs dropdown.  
2. **Duplicates another feature?** No — same Category, now reachable from the design when the pack skipped it.  
3. **Should reuse an existing workflow?** Yes.  
4. **Naming matches the app?** Category · Item tags.

**Philosophy conflict?** No. Previous completeness deferred Category on the member sheet; empty pack is a real gap, not a second Category.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Keep list after pick; exit blurs; design Category when pack empty |
| Business rules | OK | Pack Category still wins once set |
| Workflows | OK | New collection member sheet, Edit design, Add designs |
| Edge cases | OK | No used tags + no Category → dropdown first |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | pointerdown outside + enterKeyHint Done (no new sticky bar) |
| First glance (BM-11) | OK | List is the job while adding; gone when they leave |
| Accessibility | OK | Escape, aria-expanded |
| Platform consistency | OK | Same Category field |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Multiple tags: list stays open after a pick (selected chips drop out of the list).  
- Exit closes the list and blurs: Escape, Enter on empty, tap outside, iOS Done.  
- Collection member sheet: Category dropdown when the pack has none; locked **From collection** when it has one (writes pack Category).  
- Edit design already unlocks when no pack Category — keep that; docs say so.  
- Units + trader-eye.

## Explicitly deferred / rejected

- A visible **Done** chip under Item tags.  
- Per-design Category that disagrees with a pack that already has one.  
- Changing official taxonomy rules.

---

## Decision

**Proceed.**
