# Feature Completeness Review — Pack tags apply to member designs

**Date:** 2026-10-20  
**Module / ask:** **Tags of a collection apply to its designs.**  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Approved 2026-09-24 (Who / pack tags / set size): pack tags land on every member (`unionTags`, append, no duplicate). Create already did that. This slice un-defers **edit save**, **album add**, and **design editor display** so the rule is one path.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack Item / Quality / Size tags are the pack’s labels. They belong on the designs in that pack so Find, Explore, and the design page see them. A design can already have tags — pack tags add on. Never drop a design’s own tags. Mill designs stay the mill’s. |
| UX Designer | No extra “copy tags” control. Member sheet and Edit design show the union. They can still × a pack tag on one design (Done saves the sheet list as-is). Apply this info to all designs stays units / MOQ — tags union either way. |
| Solution Architect | Shared `packTagsPatch` / `packTagsForMember` (cap 20). Stamp own-company members on create (photos + library), edit save / membership persist, and album add. `designEditorCategories` unions pack tags onto own. Do not re-union on member-sheet save. |

---

## Platform consistency (required)

1. **Existing patterns?** `unionTags` from 2026-09-24; Item / Quality / Size typeaheads.  
2. **Duplicates another feature?** No — same pack tags, now persisted on every membership path.  
3. **Should reuse an existing workflow?** Yes — append/union, not overwrite, not a second Tags field.  
4. **Naming matches the app?** Item tags / Quality / work tags / Size tags. Not Categories.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Union onto own members; display union |
| Business rules | OK | Append only; cap 20; mill skipped; remove pack tag later does not strip designs |
| Workflows | OK | New collection, Edit collection details, album Add photos / library |
| Edge cases | OK | Already has tags; empty pack tags; 20 cap; tagsDirty photo sheet |
| Permissions | OK | Own-company designs only |
| User states | OK | Create, edit, album manage, Edit design |
| Notifications | N/A | |
| Error handling | OK | Membership PUT errors already toast; stamp shares that try |
| Scalability | OK | PATCH only when the union adds a tag |
| Mobile interactions | OK | No new chrome (BM-07) |
| First glance (BM-11) | OK | Pack tags stay on the pack form; designs pick them up quietly |
| Accessibility | OK | Same chips / Remove {tag} |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Pack tags append onto own-company member designs on create, edit save, membership change, and album add.  
- Design editor and member sheet hydrate as own ∪ pack (cap 20).  
- Member-sheet Done writes the sheet list as-is (can drop a pack tag on one design).  
- Docs + units + functional journey (member sheet shows the pack tag).

## Explicitly deferred / rejected

- Stripping a tag from designs when it is removed from the pack.  
- Patching mill / curated source designs.  
- A second “copy tags to designs” control.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
