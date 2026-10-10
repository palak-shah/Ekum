# Feature Completeness Review — Rate per unit select

**Date:** 2026-10-10  
**Module / ask:** Collection create/edit — Rate label becomes “Rate per” + unit select (default pc).  
**Anchors:** `docs/features/collections.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Rates are usually per pc; sellers sometimes price per set/mtr. Selecting the unit next to Rate is clearer than hunting Order and dispatch. |
| UX Designer | Keep One rate / A range. Label row: Rate per + unit select. Same unit list as Order and dispatch. |
| Solution Architect | No new column — bind to `catalogRateDisplayUnit`; pack order → `dispatchUnit`, else `unit`. Collection create/edit only. |

## Platform consistency

1. Reuses `unitValues` / Order and dispatch units.  
2. No second rate store.  
3. Member sheet / Product editor unchanged.  
4. Plain “Rate per”.

**Philosophy conflict?** No.

## Approved scope

- `RateRangeFields` optional rate-unit select.  
- Wire on collection create/edit identity fields.  
- Docs + unit tests.

## Explicitly deferred

- Design member sheet / Product editor / Design batch rate-unit select.
