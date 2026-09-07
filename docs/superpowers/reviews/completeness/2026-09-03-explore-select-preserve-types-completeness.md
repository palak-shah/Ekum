# Feature Completeness Review — Explore select preserve types

**Date:** 2026-09-03  
**Module / ask:** Mixed Design + Collection selection keeps types; stable Order · Curate · Bookmark · Share; Order-only collection resolve  
**Anchors:** `docs/features/explore.md`, `docs/features/saved.md`, trader capability plan §5 (browse basket)  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Selection ≠ resolve. Share/Bookmark keep albums as albums. Order alone expands via All / Choose. No collection-as-pack. |
| UX Designer | Dock always shows the same four verbs; label `N designs · M collections`. Resolve sheet only after Order. |
| Solution Architect | Keep dual session stores (`browseShortlist` + `browseAlbumPick`); stop gating Order/Curate on `designCount`. Add Order resolve sheet + expand helpers. |

---

## Platform consistency

1. **Existing patterns?** Yes — AlbumSelectBar, HowManyEachSheet, CatalogShareSheet, Saved bookmark APIs.  
2. **Duplicates?** No second shortlist.  
3. **Reuse?** Expand via `GET /explore/collections/:id` members; Choose → collection viewer select mode.  
4. **Naming?** Collection (not album) in dock label.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Four actions; Order resolve |
| Business rules | OK | No pack order; dedupe designs |
| Workflows | OK | Select → action → resolve if needed |
| Edge cases | OK | Gated preview (`products: null`) → Choose / toast |
| Curate + albums | Gap | See G-001 |
| Mobile / BM-07 | OK | Existing dock clearance |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Curate with selected collections

| Field | Content |
|-------|---------|
| Gap | Existing Curate is **design-id only**. Spec forbids inventing album→member expand for Curate. |
| Recommendation | Keep Curate on the bar. On tap: curate **selected designs** only (existing sheet). Albums-only → toast that Curate needs designs; leave album pick. **Do not** expand collections for Curate. |
| Priority | Product decision deferred (document only) |

---

## Approved scope

- Always Order · Curate · Bookmark · Share when selecting (Curate still needs Trading on).
- Selection preserves designs + collections in existing two stores.
- Order → resolve sheet All designs / Choose designs per collection; then HowManyEach; dedupe.
- Share / Bookmark unchanged type-preserving behavior.
- Curate: designs only; flag G-001 for album-as-source.

## Explicitly deferred

- Collection-as-pack order
- Auto-expand collections for Curate
- Merging the two session stores into one typed list (optional later)

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
