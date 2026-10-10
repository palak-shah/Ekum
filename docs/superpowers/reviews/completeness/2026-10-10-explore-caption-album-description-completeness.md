# Feature Completeness Review — Explore caption album-style description + header time

**Date:** 2026-10-10  
**Module / ask:** Explore collection caption: match album **read more** / **Show less** (newlines kept); no muted meta under title (no new-designs / no N designs); relative time top-right beside shop name.  
**Anchors:** `docs/features/explore.md`, `docs/features/collections.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Feed caption should not shout activity counts. Time belongs with the publisher; description matches album so traders are not re-taught. |
| UX Designer | Clamp description like album (inline **read more**); no About chevron; no meta row under title; time muted in shop header trailing. |
| Solution Architect | Reuse `noteBlockOverflows` + `PACK_DETAILS_COLLAPSED_MAX_H_CLASS`; drop `exploreFeedNewDesignsLine` from UI; wire `postedWhen` into `ShopPostHeader` trailing (with Follow when present). |

---

## Platform consistency (required)

1. **Existing patterns?** Album `CollectionPackDetails` clamp; Explore `ShopPostHeader` trailing.  
2. **Duplicates another feature?** No — retires About chevron.  
3. **Should reuse an existing workflow?** Yes — same overflow helpers as album.  
4. **Naming matches the app?** **read more** · **Show less**.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Clamp + header time + no meta |
| Workflows | OK | Link stopPropagation on toggle |
| Edge cases | OK | Short description → no toggle; empty about → omit |
| First glance (BM-11) | OK | No extra meta row |
| Platform consistency | OK | |

---

## Approved scope

- ExploreFeedCaption album-style description.  
- No meta under title on collection (and design) feed cards.  
- Time in shop header for own + peer posts.  
- Docs + units.

## Explicitly deferred

- Removing API `exploreNewDesignCount`.  
- Full pack-details sections on Explore (Size / Item tags labels).
