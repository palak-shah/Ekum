# Feature Completeness Review — Collection publish ≠ design Explore tiles

**Date:** 2026-09-11  
**Module / ask:** Pack on Explore only; members become Published for trade without `postedToMarketAt` (no design-tile flood)  
**Anchors:** design `2026-09-11-collection-publish-no-design-explore-design.md`, `docs/features/collections.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One pack post; buyers Order/Share/Curate designs inside; seller opts into solo Explore later. |
| UX Designer | Why-line: pack on Explore; designs not listed separately until published alone. |
| Solution Architect | `updateMany` drafts → Published + audience snapshot; omit `postedToMarketAt`. Explore design feeds already filter `postedToMarketAt: { not: null }`. |

## Platform consistency

1. Existing patterns? Yes — Publish = Explore is `postedToMarketAt` for designs; collections use `exploreActivityAt`.  
2. Duplicates? No.  
3. Reuse? N/A.  
4. Naming? Pack vs design Publish stay distinct.

**Philosophy conflict?** No.

## Approved scope

- Restore member status bump without Explore post  
- Docs + editor copy + unit test  

## Sign-off

Proceed.
