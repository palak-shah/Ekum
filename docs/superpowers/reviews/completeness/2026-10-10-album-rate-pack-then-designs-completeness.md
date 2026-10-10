# Feature Completeness Review — album rate pack then designs

**Date:** 2026-10-10  
**Module / ask:** Collection album facts rate when pack rate is empty — show min–max from designs; pack rate wins when set; on request for audience only.  
**Anchors:** `docs/features/collections.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Sellers need an honest band on their own album. Pack rate from add/edit is the identity price; if they left it blank, the band from priced designs (e.g. 200 / 500 / 700 → 200–700) is useful. On request stays an audience gate, not a hide-from-self. |
| UX Designer | One facts rate line. No inventing from blanks. Owner always sees; buyers respect Publish rates visibility. |
| Solution Architect | Reuse `collectionCardRateFields` (pack first, then member min–max). Album detail must pass products even when pack rate is null. Owner forces visible for the band; others use `rateVisibility`. |

## Platform consistency

1. Same Explore card rate helper — album detail was wrongly omitting products when pack rate empty.  
2. No second rate UI.  
3. Reuse pack details `rateMin` / `albumFactsRateBand`.  
4. Plain “rate” language; on request = audience.

**Philosophy conflict?** No.

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Pack → design min–max |
| Business rules | OK | Owner vs on_request gate |
| Workflows | OK | No new screens |
| Edge cases | OK | No priced members → omit; mixed units omit (existing) |
| Permissions | OK | Audience gate unchanged |
| User states | OK | Owner / visitor |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Same include |
| Mobile interactions | OK | Facts line only |
| First glance (BM-11) | OK | One band, pack priority |
| Accessibility | OK | Text unchanged |
| Platform consistency | OK | |

## Approved scope for this slice

- `collectionDetail` album band: always pass members; pack rate wins; else design min–max.  
- Owner always sees band; on_request hides from non-owners.  
- Docs + API unit coverage.

## Explicitly deferred / rejected

- Changing Explore feed card rules beyond existing helper.  
- Syncing design stamps when pack rate changes (separate).
