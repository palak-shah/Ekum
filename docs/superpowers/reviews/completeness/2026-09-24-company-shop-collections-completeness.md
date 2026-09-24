# Feature Completeness Review — Company shop collections

**Date:** 2026-09-24  
**Module / ask:** Collections tab shows name + Explore-style mosaic; Select / Order · Curate · Ask for rates like Designs.  
**Anchors:** `docs/features/company.md`, `docs/features/explore.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same traveling pile. Shop dock still this seller only. Albums resolve (All / Choose) before qty. |
| UX Designer | 2-col cells: AlbumGrid + name + design count. Select / long-press match Designs. Dock already exists. |
| Solution Architect | Reuse AlbumGrid, album pick store, OrderCollectionResolveSheet. Merge leftover other-shop rows after resolve. |

## Platform consistency

1. AlbumGrid + name like Explore CollectionTile / OpportunityCollectionCard.  
2. Does not replace Your selection mixed-seller Order.  
3. Reuse resolve + HowManyEach + Curate sheets.  
4. Naming: Order · Curate · Ask for rates.

**Philosophy conflict?** No.

## Approved scope

- Collection cell: mosaic (preview designs, not cover when designs exist) + name + N designs.  
- Select / Select all / Clear on Collections; dock when this shop has albums and/or designs.  
- Order / Curate with shop albums goes through resolve; leftover other shops stay.

## Explicitly deferred

- Bookmark on shop. Load-more. Hide nav on create collection.

## Sign-off

Required gaps closed: Yes. Ready: Yes.
