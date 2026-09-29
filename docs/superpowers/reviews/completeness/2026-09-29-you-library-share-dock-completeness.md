# Feature Completeness Review — You library Share on select dock

**Date:** 2026-09-29  
**Module / ask:** Share a pack/design from You without opening the item. Curate is less used than Order / Share.  
**Anchors:** `docs/features/catalog.md`, album Share sheet  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | From You, send a live pack/design to a chat is everyday. Order for buyer stays. Curate is occasional. Header Share stays the shop. |
| UX Designer | Published select dock: **Order for buyer · Share** equal teal. Then **Hide · Archive**. **Curate** last (if trading). Reuse `CatalogShareSheet`. |
| Solution Architect | Selected published rows → same sheet as album Share. No new API. |

---

## Platform consistency

1. **Existing patterns?** Album Share sheet; two-teal send row.  
2. **Duplicates?** Open-item Share stays. You header Share = shop only.  
3. **Reuse?** CatalogShareSheet.  
4. **Naming?** Share.

**Philosophy conflict?** No.

---

## Approved scope

- Published selection: Order | Share, then Hide · Archive, Curate last.  
- Draft / Archived docks unchanged.

## Sign-off

Required gaps closed: Yes  
Ready: Yes
