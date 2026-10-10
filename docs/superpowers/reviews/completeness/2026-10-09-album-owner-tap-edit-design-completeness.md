# Feature Completeness Review — Album design sheet Edit

**Date:** 2026-10-09  
**Module / ask:** Album design tap opens the **view** photos sheet by default. On your own designs, sheet footer offers **Edit design** → Edit design page.  
**Anchors:** `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | View first (same for owner and visitor). Edit is an explicit second step for own designs. |
| UX Designer | Primary **Edit design** on sheet when allowed; Select stays secondary then. |
| Solution Architect | `collectionOwnerCanEditDesign`; navigate `/catalog/products/:id` from sheet. |

---

## Platform consistency

1. **Existing patterns?** ProductPhotosSheet + ProductEditorPage.  
2. **Duplicates?** No.  
3. **Reuse?** Existing editor.  
4. **Naming?** Edit design.

**Philosophy conflict?** No

---

## Approved scope

- Tap → view sheet always (when not selecting)
- Own design on own pack → **Edit design** in sheet footer
- Mill curated / visitor → no Edit
- Docs + unit helper test

## Explicitly deferred

- Editing mill designs from curated pack

## Sign-off

Required gaps closed: Yes  
Ready: Yes  
