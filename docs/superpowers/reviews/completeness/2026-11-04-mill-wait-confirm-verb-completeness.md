# Feature Completeness Review — Mill wait verb → confirm

**Date:** 2026-11-04  
**Module / ask:** Unify released-mill awaiting-confirmation copy to **confirm** (card + hop dock). Parent already used confirm.  
**Anchors:** `docs/features/orders.md`, `2026-11-04-orders-state-and-waiting-map.md`, mill Confirm CTA  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One ball → one verb; matches mill dock **Confirm**. |
| UX Designer | Card `waiting to confirm`; hop `Waiting for {mill} to confirm`; list stays `Waiting: supplier`. |
| Solution Architect | Copy-only in `iHandleDesk.ts`. |

## Platform consistency

1. **Existing patterns?** Parent `traderDeskNextAction` already “to confirm”.  
2. **Duplicates?** Removes accept/confirm split.  
3. **Reuse?** Same helpers.  
4. **Naming?** Confirm (not Accept).  
5. **Units?** N/A.

**Philosophy conflict?** No. Supersedes accept wording in `2026-11-04-ihandle-mill-hop-idle-no-rates-wait-completeness`.

## Sign-off

Ready for implementation: Yes  
