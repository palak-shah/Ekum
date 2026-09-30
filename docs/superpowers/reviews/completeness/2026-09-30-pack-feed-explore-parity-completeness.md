# Feature Completeness Review — Pack Feed = Explore post

**Date:** 2026-09-30  
**Module / ask:** Shop Collections Feed and My Collections Feed must look like an Explore pack post.  
**Anchors:** `docs/features/explore.md`, `docs/features/company.md`, `docs/features/settings.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same pack card everywhere in Feed so traders are not re-learning. Library extras (Draft / From mill) stay off the live caption. |
| UX Designer | Shop row (36px) → mosaic → name → `N designs · date`. No Follow on shop/You. Grid unchanged. Draft/archived: status · date under the name. |
| Solution Architect | Extend `CatalogFeedPost` with optional company header. Shop uses `CollectionCard.company` + `updatedAt`. You uses `useMyCompany` (pack owner, not mill). |

---

## Platform consistency (required)

1. **Existing patterns?** Explore `OpportunityCollectionCard` / `CollectionPost`.  
2. **Duplicates another feature?** No — one post component.  
3. **Should reuse an existing workflow?** Same long-press / name-opens.  
4. **Naming matches the app?** **1 design** / **N designs**. Business name on the row.

**Philosophy conflict?** No — company.md already says shop Feed matches Explore.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Header + caption. |
| Business rules | OK | Live caption has no From / photo count / audience. |
| Workflows | OK | Tap mosaic or name → album. |
| Edge cases | OK | No company yet → post without row. Draft status line. |
| Permissions | N/A | |
| User states | OK | Own shop, other shop, You. |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No extra sticky bar. |
| Accessibility | OK | Existing aria-labels. |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Shop + You **Collections** Feed: Explore pack chrome.  
- Shop row links to `/company/:id`. No Follow.  
- Live meta: `N designs · {relative/short date}`.  
- Not live (You): `{status line} · {date}`. Grid copy unchanged.

## Explicitly deferred / rejected

- Designs tab Feed shop row.  
- Saved Feed.  
- Changing Grid.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
