# Feature Completeness Review — Curate/Repost skip resolve

**Date:** 2026-11-23  
**Module / ask:** When cart / Selection / You Catalog **Repost** includes collections, skip **Use whole collection / Pick designs**; silently expand all members into `CurateFromSelectionSheet` (same decision model as Order skip-resolve).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/collections.md`, `docs/features/saved.md`  
**Disposition:** Redesign → Proceed

> Completeness keeps Ekum **coherent**. Order already dropped All/Choose; Curate kept the sheet (deferred 2026-11-22). This slice removes that hop for Repost.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Second decision after Select is clutter. Expand-all; subset by selecting designs before Repost. |
| UX Designer | No Use whole / Pick designs sheet. Curate destination (Add new / Add to existing) unchanged — not How many qty UI. |
| Solution Architect | Reuse `resolveCatalogOrderAlbums` + `partitionRelistableAlbums`; do not fork curate merge. |

---

## Platform consistency (required)

1. **Existing patterns?** Order prepare expand-all; CurateFromSelectionSheet.  
2. **Duplicates another feature?** No — removes Curate resolve only.  
3. **Should reuse?** Yes — Order’s `resolveCatalogOrderAlbums`.  
4. **Naming?** Repost / Curate; plain trader words.  
5. **Units?** N/A.

**Philosophy conflict?** Yes vs older Curate All/Choose lock → **Redesign** that hop only.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Silent expand → Curate sheet |
| Business rules | OK | Relistable only; locked toast-skip; null products → album |
| Workflows | OK | Cart, You Catalog, album resume curate |
| Edge cases | OK | Designs-only unchanged; Explore RepostSheet unchanged |
| Permissions | OK | Same pack-lock / Ask-to-see navigate |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Empty / locked toasts |
| Scalability | OK | Same preview fetch |
| Mobile interactions | OK | One fewer sheet |
| First glance (BM-11) | OK | Curate sheet is the one job |
| Units | N/A | |
| Accessibility | OK | |
| Platform consistency | OK | After Redesign |

---

## Gaps

None Required.

### Redesign vs older completeness

| Older lock | Now |
|---|---|
| 2026-11-22 Order: Curate resolve unchanged | Curate/Repost also silent expand-all |
| explore.md / saved: Curate keeps All/Choose | Curate skips resolve like Order |

---

## Approved scope for this slice

- Cart / Selection / You Catalog / album-resume **Repost** never opens `OrderCollectionResolveSheet` for curate.  
- Expand all relistable album members via `resolveCatalogOrderAlbums`; open `CurateFromSelectionSheet` with product ids + default pack name.  
- Pack-locked albums: toast skip; continue with designs + allowed albums.  
- `products == null`: navigate album (only remaining open-album hop).  
- Docs + units (+ e2e if journey asserts resolve).

## Explicitly deferred / rejected

- How many qty UI for Repost.  
- Whole-catalog one-qty on Curate (Order-only).  
- Explore single-card RepostSheet changes.  
- Catalog kind inheritance on child (#1 audit) — separate.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
