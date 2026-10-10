# Feature Completeness Review — collection create rate persist

**Date:** 2026-10-09  
**Module / ask:** Create collection Rate / range still not landing on designs after save.  
**Anchors:** `docs/features/collections.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack **Rate** on New collection is the price for that pack’s designs. It must persist without requiring **Apply this info**. Apply still forces units/MOQ/notes and overwrites conflicting library rates. |
| UX Designer | Rate sits below the photo grid — save must read From/To at submit, not a stale photo snapshot. Edit must show the saved pack rate again. |
| Solution Architect | Source of truth at save = `combineRateInput(rateFrom, rateTo)`. Stamp onto new photos always; library members get rate when pack rate set (conflict sheet when they already differ). Hydrate edit Rate from unanimous member rates. |

## Platform consistency

1. Same stamp helpers as same-for-all.  
2. No duplicate rate store on Collection row.  
3. Reuse conflict sheet.  
4. Naming unchanged.

**Philosophy conflict?** No.

## Approved scope

- Save pack rate/range onto create photos + library picks (conflict when library already priced differently).  
- Hydrate Edit Rate From/To from members.  
- Edit Update stamps pack rate the same way when Apply or when filling empties / pack rate set.  
- Units: regression units on helpers.

## Explicitly deferred

- Persisting pack rate on Collection model (still derived from members).  
