# Design — Collection / design create polish

**Date:** 2026-09-17  
**Status:** Implemented  
**Anchors:** Completeness `2026-09-17-collection-create-polish-completeness.md`, collections/catalog/explore feature docs

## Job

Make pack and design create fast for textile traders: calm photo grids, publish-first, Followers/Selected only, searchable tags, and full design details from the collection page.

## Decisions

| Topic | Decision |
|-------|----------|
| Photo grids | Show **9** (3×3); if more, **9th blurred** + **Load more** / **+n**; expand by 9. Shared `CappedMediaGrid`. Surfaces: Collection editor, DesignBatch, Photo order. |
| CTAs | Primary **Create & Publish** / **Publish N**; Draft secondary. |
| Audience | Drop **Everyone** chip; default **Followers**; **Selected** → people + buyer groups. Legacy `everyone` → Followers when opening Visibility. |
| Collection fields | Name · Description · Tags (collapsed row → sheet). |
| Design on collection | Tap tile → same detail fields as Add designs; no feature gap for members. |
| Tags UI | Compact selected summary / ≤2-row scroll; pick in sheet with search. |
| Tags model | Official (Sub + Item Type from taxonomy seed) + company-private custom. Cascade collection → designs unless dirty. |
| Search | Explore `q` / facets match product + collection tag labels. |
| Deferred | Ops promote; Main→Sub drill-down; trade-name global library; bulk migrate everyone. |

## Success

Supplier creates a 12+ photo pack without scrolling an endless grid, tags once, edits one design in-sheet, publishes to followers; buyer finds it via tag search.
