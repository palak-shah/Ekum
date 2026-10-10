# Feature Completeness Review — collection design tiles without SKU / From

**Date:** 2026-10-09  
**Module / ask:** Collection album viewer design tiles: do not show SKU/code or **From {mill}** under the name — keep name + rate chip.  
**Anchors:** `docs/features/collections.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Album scan is photo · name · rate. Code and mill “From” add clutter; mill credit stays on collection-level source line when needed. |
| UX Designer | Tile caption = name only under thumb; rate stays on photo. Find still matches SKU/shop. |
| Solution Architect | `designTileMetaLine` empty; `albumTileShopLine` never credits on album tiles. No API change. |

## Platform consistency

1. Matches clutter-free album scan.  
2. Not a duplicate.  
3. Reuse existing rate overlay.  
4. Naming unchanged elsewhere.

**Philosophy conflict?** No.

## Approved scope

- Hide SKU and From on collection viewer design tiles (feed + grid) and design photo sheet SKU/From.  
- Docs + unit updates.

## Explicitly deferred

- Collection listing collage “From {shop}” mill caption on My Collections grid (album card, not design tile).  
