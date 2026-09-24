# Feature Completeness Review — How many each: thumb, qty right, info below

**Date:** 2026-09-23  
**Module / ask:** Order qty sheet: tap thumb → PhotoViewer; qty on the right; name/tags/rate under the name; Place order / Ask rates / Order for buyer stay in the sheet footer (sticky).  
**Anchors:** `docs/features/orders.md`, order-detail PhotoViewer  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Stay on the order job — viewer is snapshot info, not Explore. |
| UX Designer | Match order-line thumb + PhotoViewer. Qty on the right like the trade reference. Name / tags / rate stay under the name. |
| Solution Architect | Client gallery from `product.images`. No API. |

## Platform consistency

1. Existing patterns? `h-12` thumb, PhotoViewer captions, QtyStepper, × remove.  
2. Duplicates? No.  
3. Reuse? PhotoViewer + formatRate.  
4. Naming? Pieces / Same for all.

**Philosophy conflict?** No

## Approved scope

- Thumb opens PhotoViewer (name + tags/rate/SKU). Swipe other designs in the sheet.
- Row: thumb · name/tags/rate/note · qty on the right · ×.
- List scrolls in the sheet body (no nested max-height). Footer stays pinned: **Place order** primary, then **Ask rates** and **Order for buyer** on one row.
- Sets / pack size is a **separate** review.

## Sign-off

Yes · 2026-09-23
