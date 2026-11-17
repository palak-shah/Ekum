# Feature Completeness Review — Direct Place mill stamp + trio

**Date:** 2026-11-17  
**Module / ask:** Sheet #20 — eligible Direct Place routes to mill seller + trio; album stamps must not over-mark Direct when mill Repost is off.  
**Anchors:** `docs/features/orders.md`, `docs/features/settings.md`, existing DL Completeness (`2026-10-31-direct-link-share-gate`)  
**Disposition:** Proceed

## Lenses

| Lens | Summary |
|------|---------|
| Product Manager | Gray DL (Repost off) must Place I-handle; live Direct → mill ticket + trio on first order only. |
| UX Designer | “Order goes to …” follows `directMillCompanyIds` / `viewerTicket` — no fake mill when Pack is off. |
| Solution Architect | `laneRoutesDirect` already gates on `millShareActive`; explore stamps must pass Pack set. Create path already calls `ensureDirectPlaceThread`. |

## Platform consistency

1. Existing patterns? Yes — `pathForPair` + `millShareActive`.  
2. Duplicates? No.  
3. Reuse? Same gate as Place.  
4. Naming? Direct / I-handle / Repost.  
5. Units? N/A.

**Philosophy conflict?** No.

## Approved scope

- Explore/album `directMillCompanyIds` require mill Pack.  
- Order-for-buyer client subset respects `shareActive`.  
- No new chrome.

## Explicitly deferred

- Observer Soft-hide / via-trader copy (#23).

## Sign-off

Required gaps closed: Yes · Ready: Yes  
