# Feature Completeness Review — Remove Profile order path

**Date:** 2026-09-08  
**Module / ask:** Remove Profile **When buyers order from what I share**; Your paths + new pair Me only.  
**Anchors:** `docs/features/settings.md`, `orders.md`, `00-concepts.md`, TradeLane + Your paths specs  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Everyday Place stays quiet; path lives on Your paths.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Honest IA: one path home. New pair stays quiet Me. Stops false master switch. |
| UX Designer | Drop one Profile block; buy/sell/trade stay. Your paths unchanged. No new chrome. |
| Solution Architect | Stop Profile writes to `orderPathPreference`. Prefer handle when unset for residual readers. Keep API field for now. |

---

## Platform consistency (required)

1. **Existing patterns?** Matches TradeLane / Your paths (pair-level path).  
2. **Duplicates another feature?** Removes the duplicate-looking Profile control.  
3. **Should reuse an existing workflow?** Your paths.  
4. **Naming matches the app?** No new names.

**Philosophy conflict?** No — strengthens quiet first pair + pair-level path.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Remove UI; residual prefer handle |
| Business rules | OK | New pair Me + Off unchanged |
| Workflows | OK | You → Your paths for path |
| Edge cases | OK | Stale tradeDefaults.direct ignored for new lanes already |
| Permissions | N/A | |
| User states | OK | Trading off: Your paths still gated |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile / BM-07 | N/A | Less Profile content |
| Accessibility | OK | Fewer controls |
| Platform consistency | OK | |

---

## Gaps

None Required. Deferred: purge collection `orderPathPreference` publish stamps.

---

## Approved scope for this slice

- Remove Profile When buyers order UI + copy.  
- Prefer **handle** when `orderPathPreference` unset (web + API resolvers).  
- Docs: settings, TradeLane Profile section, journey matrix friction #10, features.  
- Smoke: Profile page no longer shows the block; existing Your paths e2e still pass.

## Explicitly deferred / rejected

- Option C (Your paths company default line).  
- Dropping settings DTO `orderPathPreference` entirely.  
- Collection column purge.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
