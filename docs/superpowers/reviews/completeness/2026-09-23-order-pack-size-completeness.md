# Feature Completeness Review — Pack size (sets) per design / supplier

**Date:** 2026-09-23  
**Module / ask:** Some shops sell in sets of 6, others 10, or dozen/box. How to set that without one global rule.  
**Anchors:** `docs/features/orders.md`, `docs/features/catalog.md`  
**Disposition:** Proceed (model lock). **Build later** — not this sheet-layout slice.

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The supplier who owns the design sets how they sell. A trader ordering two mills must see each mill’s rule on that design. |
| UX Designer | Order sheet stepper is in **their unit** (sets). Quiet line: `6 pcs/set · 12 pcs`. Same for all applies **sets** only when every line shares the same pack. |
| Solution Architect | Live on **Product** (`unit` already has set/dozen/box + new `piecesPerPack`). Shop **usual** on new photos only. Snapshot both on the order line so later catalog edits do not rewrite tickets. |

## Platform consistency

1. Existing patterns? Design already has unit + MOQ + Same for new photos.  
2. Duplicates? Do not add a second “set settings” app.  
3. Reuse? Publish / edit design / Same for new photos.  
4. Naming? **Pieces in one set** (plain). Not “UOM matrix.”

**Philosophy conflict?** No

## Approved model (do not invent a company-only rule)

- **Per design** (that supplier’s listing): `unit` + optional `piecesPerPack` (e.g. set=6, dozen=12, box=10).
- **Shop usual:** default for *new* designs only (Same for new photos / Add designs). Never overwrite another mill’s design.
- **Order qty stored as pieces** (canonical) plus snapshotted `orderUnit` + `piecesPerPack` + `sets` for display.
- Mixed sheet: each row uses that design’s pack. Same for all qty only when packs match; else per line.

## Explicitly deferred

- Schema, edit-design field, order snapshot, sheet stepper-in-sets. After this layout ships.

## Sign-off

Yes · 2026-09-23 · model only
