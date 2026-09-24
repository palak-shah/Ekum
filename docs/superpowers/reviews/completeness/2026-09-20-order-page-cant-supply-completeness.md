# Feature Completeness Review — Order page shows Can’t supply without Send quote

**Date:** 2026-09-20  
**Module / ask:** Declined (Can’t supply) lines are grayed on the order page so seller/buyer can see them without opening Send quote.  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | After a partial quote, the ticket must show which designs were marked Can’t supply. |
| UX Designer | Mute thumb + name + qty/rate. Keep **Can’t supply** full contrast (read-only here). Same on mill-desk rows — those sellers never see the buyer item card. |
| Solution Architect | Reuse quote mute helpers. No API change. |

## Platform consistency

1. Existing patterns? Same mute as Send quote design block.  
2. Duplicates? No.  
3. Reuse workflow? Order detail lines.  
4. Naming? Can’t supply.

**Philosophy conflict?** No

## Approved scope

- Main item list, mill-desk rows, and buyer mill lots: declined lines wash + muted design + **Can’t supply**.
- No checkbox on the order page (toggle stays on Send quote).

## Sign-off

Yes · 2026-09-20
