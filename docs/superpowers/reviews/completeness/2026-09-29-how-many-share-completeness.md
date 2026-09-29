# Feature Completeness Review — How many each · Share

**Date:** 2026-09-29  
**Module / ask:** Share designs from the quantity sheet (Place / Ask / Order for buyer).  
**Anchors:** `docs/features/orders.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | After they pick pieces they may still send the cards to a chat instead of placing. Everyday, same as You select Share. |
| UX Designer | **Place Order · Share** equal teal. **Ask rates · Order for buyer** stay the row under. Reuse `CatalogShareSheet`. Qty unused for Share. |
| Solution Architect | No new API. Share the active design lines. After send, close the sheet; from Selection, empty the pile (same as Selection Share). |

---

## Platform consistency

1. **Existing patterns?** You published dock + album Share sheet.  
2. **Duplicates?** Open-item / Selection Share stay.  
3. **Reuse?** CatalogShareSheet.  
4. **Naming?** Share.

**Philosophy conflict?** No.

---

## Approved scope

- How many footer: Place | Share, then Ask | Order for buyer.  
- Buyer-only: Order for buyer | Share.

## Sign-off

Required gaps closed: Yes  
Ready: Yes
