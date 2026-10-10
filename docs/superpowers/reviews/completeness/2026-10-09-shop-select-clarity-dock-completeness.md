# Feature Completeness Review — Shop select clarity + dock only when picked

**Date:** 2026-10-09  
**Module / ask:** On another shop’s Collections, traders can’t tell what’s selected; Message · Share · Order must not appear unless **this shop** has picks (Chat already on the profile).  
**Anchors:** `docs/features/company.md`, `docs/features/explore.md`, ui-quality-bar §4  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Shop profile already has **Chat**. Pile dock on an empty-this-shop visit duplicates Message and confuses. Dock only when this seller’s lines are selected. |
| UX Designer | Selected mosaics: shrink gap blends into card surface — pick is invisible. Louder selected card border + stronger check (still no teal frame on the photo itself). |
| Solution Architect | Hide SelectionWorkspaceBar on all `/company/:id` paths. Shop dock already gates on `shopSelectedCount > 0`. |

---

## Platform consistency

1. **Existing?** SelectableMediaFrame + shop dock.  
2. **Duplicates?** No — Explore floater stays on Explore.  
3. **Reuse?** Same Message · Share · Order when this shop has picks.  
4. **Naming?** Unchanged.

**Philosophy?** Aligns: one Chat on profile; trade dock only when acting on picks.

---

## Approved scope

- Hide Explore selection floater on company shop (own + other).
- Louder selected state on selectable media (and shop cards): clearer check; card `border-accent` when selected.
- Shop select pill **N / Select all / Clear** scoped to the **active tab** — designs never inflate collection selection.
- Docs + unit specs.

## Explicitly deferred

- Greying unselected tiles (product forbids).
- Teal frame around the photo mosaic itself.
