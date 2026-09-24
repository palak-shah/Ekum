# Feature Completeness Review — Shop designs from packs (unique)

**Date:** 2026-09-24  
**Module / ask:** Collections have designs but shop / My designs looks empty; same design in many packs must appear once.  
**Anchors:** `docs/features/company.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack publish keeps designs off Explore tiles. Shop **Designs** still needs those designs. One product row even if it sits in 20 albums. |
| UX Designer | Designs tab = unique thumbs. Collections stay albums. No extra chrome. |
| Solution Architect | Shop list: published own products that are on Explore **or** in a live visible pack. Prisma `findMany` is already unique by product. |

## Platform consistency

1. Same shop grid.  
2. Does not invent copies.  
3. Reuse audience + live window from collections.  
4. Naming: Designs / Collections.

**Philosophy conflict?** No.

## Approved scope

- Shop Designs includes pack members the viewer can already see in a live album.  
- Same design in several collections → one cell.  
- My designs list stays one row per product.  
- Docs + units.

## Sign-off

Required gaps closed: Yes. Ready: Yes.
