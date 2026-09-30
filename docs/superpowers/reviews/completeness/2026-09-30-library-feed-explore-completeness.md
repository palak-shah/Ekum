# Feature Completeness Review — You / shop Feed matches Explore

**Date:** 2026-09-30  
**Module / ask:** Feed on shop and You cuts prints/models too hard. Match Explore placement + info; only a light top/bottom crop.  
**Anchors:** `docs/features/explore.md`, `docs/features/catalog.md`, `docs/features/company.md`  
**Disposition:** Proceed (intentional: feed chrome matches Explore; single photo uses 4∶5 so a model/print loses only a little top and bottom)

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Feed is for *seeing the goods*. Status dumps (Published · Everyone · photos) belong on Find/edit, not on every card. |
| UX Designer | Same post: inset mosaic, rounded, name, one muted line. Shop/You skip shop header (already on that page). Single image **4∶5** `object-cover` center — not `h-64` banner crop. 2+ stay square mosaic. Grid unchanged. |
| Solution Architect | Shared `CatalogFeedPost` + `AlbumGrid` `frame="feed"`. Explore posts stay square (unchanged). |

---

## Platform consistency (required)

1. **Existing patterns?** Explore post article / inset / type.  
2. **Duplicates?** No — reuse, don’t invent a third card.  
3. **Reuse?** `EXPLORE_POST_*`, `AlbumGrid`.  
4. **Naming?** Collection/design names; muted count · time (or Draft / Archived).

**Philosophy conflict?** No. Old “mid-size h-64 not 3/4” fought seeing the print — this slice updates that.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Feed chrome + crop |
| Workflows | OK | Tap / long-press / name open unchanged |
| Mobile interactions | OK | Last card still clears nav (existing pb) |
| Platform consistency | OK | Matches Explore, not a new widget |

---

## Approved scope

- You + shop **Feed**: Explore post layout; 4∶5 single photo; mosaic square for 2+.
- Caption: name + `N designs` / photos · time (or Draft / Archived). No Everyone / Published stack.
- **Grid** unchanged.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
