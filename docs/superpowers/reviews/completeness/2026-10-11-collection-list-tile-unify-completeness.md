# Feature Completeness Review — Collection list tile unify

**Date:** 2026-10-11  
**Module / ask:** One `CollectionAlbumTile` for You Collections + shop Collections, with library-only owner extras (caption, mill source, mosaic +N, archived routing, packManage).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/settings.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Album detail already shares one page with owner extras. Lists still fork You vs shop tiles, so mosaic/caption chrome drifts. Unify the **tile** only; page shells and select docks stay separate. |
| UX Designer | Same mosaic · name · quiet meta rhythm. Library: `N designs` / Draft / Archived + mill From…. Shelf: no design count, no date, preview-only mosaic (privacy). Select check on media (You language), not whole-card accent. |
| Solution Architect | Extract `CollectionAlbumTile` with `surface: 'library' \| 'shelf'`. Thin adapters from `CollectionView` / `CollectionCard`. No API change. Explore cards out of scope. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Feed `CatalogFeedPost`, Grid `AlbumGrid` + `SelectableMediaFrame`, same as today’s You tile.  
2. **Duplicates another feature?** Removes duplicate `SellerCollectionTile` / `ShopCollectionCell` chrome.  
3. **Should reuse an existing workflow?** Reuse You tile chrome as the single source; shelf is the quieter branch.  
4. **Naming matches the app?** You / shop / designs counts — plain trader language.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Tap → album; library archived → editor; shelf packManage when own |
| Business rules | OK | No inventory leak on shelf mosaic/caption |
| Workflows | OK | Select long-press / toggle unchanged at page level |
| Edge cases | OK | Empty previews; archived library only |
| Permissions | OK | Shelf never shows design count even on own shop |
| User states | OK | Library draft/archived captions; shelf live only |
| Notifications | N/A | |
| Error handling | N/A | Parent list handles load errors |
| Scalability | OK | Presentational tile |
| Mobile interactions | OK | No new sticky chrome (BM-07 N/A for tile) |
| First glance (BM-11) | OK | Name loudest; shelf quieter without date |
| Accessibility | OK | aria-labels on select / open |
| Platform consistency | OK | Matches album-detail “one surface + extras” |

---

## Gaps

None Required. Deferred: Explore `OpportunityCollectionCard`, Saved list tiles, merging page shells.

---

## Approved scope for this slice

- Completeness + docs lock  
- `CollectionAlbumTile` (library / shelf)  
- Wire `MyCatalogPage` + `CompanyProfilePage`; remove shop date caption  
- Units + shop profile spec; gap matrix  

## Explicitly deferred / rejected

- Merging You and shop **pages**  
- Showing `N designs` on any shop shelf  
- Changing Explore feed collection cards  
- Changing select docks  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
