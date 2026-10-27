# Feature Completeness Review — Tag suggestions: scroll is not a pick

**Date:** 2026-10-27  
**Module / ask:** On New collection / New catalog, scrolling Item / Quality / Size suggestions picks a random tag. Finger-down must not commit.  
**Anchors:** `docs/features/collections.md`, `docs/features/catalog.md`, `2026-10-20-tag-exit-design-category-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders skim official tags (cap 8 on screen, long official lists). A scroll that stamps a tag they did not choose is worse than a slow list. |
| UX Designer | Same typeahead. Scroll the list; tap to add. Exit still Escape / empty Enter / tap outside / keyboard Done. List still stays after a pick. |
| Solution Architect | `onPointerDown` + `preventDefault` + `commit` fires before the browser knows it is a scroll. Match `SuggestInput`: pick on click; do not prevent the scroll gesture. Keep list open across a list `pointerdown` so iOS blur does not unmount before click. |

---

## Platform consistency (required)

1. **Existing patterns?** `SuggestInput` already picks on click and uses mousedown only to keep focus.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same `TagSuggestInput` on collection, catalog, Add designs, Edit design.  
4. **Naming matches the app?** Item tags · Quality / work tags · Size tags.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Scroll list; tap to add |
| Business rules | OK | Unchanged |
| Workflows | OK | Create collection/catalog + design tags |
| Edge cases | OK | iOS Done still blurs/closes; tap still picks |
| Permissions | N/A | |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky bar; list `overflow-auto` + `touch-pan-y` |
| First glance (BM-11) | OK | List is still the job while adding |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Click / keyboard Enter unchanged |
| Platform consistency | OK | Same as city/category suggest |

---

## Gaps

### G-001 — Pointer-down committed a tag

| Field | Content |
|-------|---------|
| Gap | Option `onPointerDown` preventDefault + commit. Finger-down to scroll selected the row under the thumb. List scroll also re-anchored the portal. |
| Why it matters | Cannot reach tags below the fold; wrong tags land on the pack. |
| Impact if ignored | Create collection/catalog feels broken. |
| Recommendation | Pick on click. Do not preventDefault on pointerdown. Ignore list scroll when repositioning. Keep open across list pointerdown so iOS click survives blur. |
| Priority | Required before implementation |

Closed by this slice.

---

## Approved scope for this slice

- Tag suggestion list: scroll does not add a tag; a tap/click does.  
- Exit rules unchanged (Escape, empty Enter, outside, Done).  
- List still stays after a pick.  
- Same control on collection, catalog, and design tag fields.

## Explicitly deferred / rejected

- A Done chip under the field.  
- Replacing typeahead with a sheet.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
