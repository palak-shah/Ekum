# Feature Completeness Review — Order for buyer still missing the Direct Link group

**Date:** 2026-10-28  
**Module / ask:** After visitor-pack hops and group reuse, the mill ticket still lands in a 1:1 chat. Album How many often omits `collectionId`; mill own-catalog Order for buyer never looks up a mill Direct Link.  
**Anchors:** Completeness `2026-10-28-order-for-buyer-pack-direct-completeness.md`, `2026-10-28-direct-link-reuse-group-completeness.md`  
**Disposition:** Proceed

Do **not** overwrite prior Direct Link completeness files.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | If a Direct Link already names this mill and this buyer, logging for that buyer belongs in **that** group — not a new 1:1. Album Order for buyer must send the album id so JE’s pack is the shop, not “my catalog.” |
| UX Designer | Open chat on the ticket is the existing trio. No second mill–buyer thread. |
| Solution Architect | Album How many: `collectionId` = pack stamp or the album in the URL. For-buyer own lines: if a mill ticket lane exists (`seller` = actor, `buyer` = chosen), `orders.create` Direct with facilitator = trader (same as mill hop), not bilateral `ensureTradeThread`. |

---

## Platform consistency (required)

1. **Existing patterns?** Direct Place trio; mill hop `pathForPair`.  
2. **Duplicates?** No.  
3. **Reuse?** `orders.create` Direct + `ensureDirectPlaceThread`.  
4. **Naming?** Order for buyer · group.  
5. **Units?** N/A.

**Philosophy conflict?** Own-catalog auto-confirm 1:1 loses when a Direct Link already lists this mill × buyer. Direct Link is the stronger promise. Own-catalog 1:1 stays when there is **no** mill lane for that buyer.

---

## Approved scope

- Album How many / Order for buyer always send this album’s id when the pack stamp is missing.  
- Own mill SKUs + mill Direct Link for that buyer → Direct mill ticket in that group.  
- Units.

## Explicitly deferred

- Rewriting open tickets already on 1:1.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
