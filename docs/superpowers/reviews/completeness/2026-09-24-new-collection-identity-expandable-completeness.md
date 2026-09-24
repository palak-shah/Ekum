# Feature Completeness Review — New collection identity + Same for all expandable

**Date:** 2026-09-24  
**Module / ask:** Name-only create looks empty; Description and tags belong with the name. Same for all must stay an on-page expandable (not a sheet) and include tags.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`  
**Disposition:** Redesign → Proceed

> Add-and-go hid Description · Tags · Same for all. Empty chrome under Designs is worse than a short identity block. Same-for-all-as-sheet fights “expandable only.”

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack identity (name, what it’s for, tags) is part of create. Shared design tags belong in Same for all so new photos pick them up. Who stays on Publish. |
| UX Designer | Always visible: Designs · **Name this pack** · Description · Tags. **Same for all designs** is a chevron expandable on the page (rate, unit, set size, MOQ, notes, **tags**). No Same-for-all sheet. Tag picker may still use the existing Tags field sheet. |
| Solution Architect | Keep pack `categories` on the collection. Same-for-all `categories` apply to new photos (union). Library designs keep their tags unless **Use same as all**. Summary/empty must count tags. |

---

## Platform consistency (required)

1. **Existing patterns?** `CollectionExpandableSection` + kit `Field` / `TagsField`.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — same Same-for-all apply path.  
4. **Naming matches the app?** **Name this pack**. **Same for all designs**. Tags.

**Philosophy conflict?** Yes vs add-and-go “no Description/Tags/Same for all on create” and 2026-09-18 Same-for-all **sheet** → this review **Redesigns** those.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Pack identity + shared design tags |
| Business rules | OK | Library not overwritten |
| Workflows | OK | Expand → Done applies to new photos |
| Edge cases | OK | Tags-only Same for all is not empty |
| Permissions | OK | |
| User states | OK | Create + edit same expandable |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | Collapsed row; BM-07 dock |
| Accessibility | OK | Labels; expandable `aria-expanded` |
| Platform consistency | OK | After Redesign |

---

## Gaps

None required.

---

## Approved scope for this slice

- Create: Name + Description + pack Tags under Designs.  
- **Same for all designs** expandable on create **and** edit (not a sheet). Includes Tags.  
- Create & Publish still opens the Who sheet.  
- Docs + journeys: Description/Tags/Same-for-all visible; no Same-for-all dialog.

## Explicitly deferred / rejected

- Who / Set units as extra create expandables.  
- Changing the Tags picker sheet.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
