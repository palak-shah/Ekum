# Feature Completeness Review — Order for buyer · seller = supplier, path Me/Direct

**Date:** 2026-09-29  
**Module / ask:** Trader logs for a buyer but the mill should be the seller; mill Confirm; supplier who logs own goods should not Confirm. Path = Your paths (I-handle / Direct), default I-handle.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, TradeLane spec, buy-for-buyer design  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Conflicts with philosophy → Reject or Redesign.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Logging a phone-agreed ticket must not make the trader pretend to be the mill. The shop that owns the designs is the seller. The mill Confirms. A mill logging its own designs already agreed — buyer **Accept** only. |
| UX Designer | Trader Direct ticket already has **Shared · {mill}**. I-handle stays mill cards + Send, no Confirm on the trader parent. Supplier-logged bilateral: hide Confirm; buyer Accept stays. |
| Solution Architect | Reuse `OrderService.create` + TradeLane `pathForPair` (missing lane = handle). Own-catalog stays BuyForBuyer bilateral + invite. Do not invent a third path. |

---

## Platform consistency (required)

1. **Existing patterns?** Place Order lane rewrite; I-handle mill Send; Direct Shared; buyer Accept on seller-logged tickets.  
2. **Duplicates?** No — this is the deferred G-004 via-trader hop, using the same lane as Place.  
3. **Reuse?** `effectivePathFromLane`, `spawnHandleUpstreams`, mill Confirm.  
4. **Naming?** Order for buyer · Accept · Confirm · mill shop name. No Seller/Buyer on chat body.

**Philosophy conflict?** No. Counterparties are businesses; trader is not the mill.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Own log vs mill hop vs mixed owners (one ticket per mill). |
| Business rules | OK | Path from TradeLane; default I-handle. |
| Workflows | OK | Log → mill Confirm (trader) or buyer Accept (own catalog). |
| Edge cases | OK | Off-app invite only on bilateral own-catalog tickets. Mixed mills batch. |
| Permissions | OK | Trader↔buyer connected; mill hop trader↔mill. |
| User states | OK | Shared Direct; I-handle mill desks. |
| Notifications | OK | Existing orderCreated on create. |
| Error handling | OK | Confirm API rejects seller-logged bilateral. |
| Scalability | OK | Same N hops as Place. |
| Mobile interactions | OK | Existing docks. |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Off-app mill hop

| Field | Content |
|-------|---------|
| Gap | `/o/:token` Accept is for seller-logged bilateral. Direct mill tickets are mill Confirm. |
| Recommendation | Invite only when there is an own-catalog bilateral ticket. Mill hops: on-app mill Confirm. |
| Priority | Required — this slice |

### G-002 — Pack-size

| Field | Content |
|-------|---------|
| Gap | Qty still pieces. |
| Recommendation | Stay deferred. |
| Priority | Future |

---

## Approved scope for this slice

- Own designs: seller = logger; hide Confirm; buyer **Accept**; invite unchanged.  
- Mill designs: seller = mill. Your paths **Me** (or no row) → I-handle parent + held mill lots; mill Confirm after Send. **Direct** → mill ticket, trader facilitator (**Shared · mill**); mill Confirm; trader no Confirm.  
- `canAcceptLogged` only bilateral seller-logged.  
- Mixed mills: one hop per mill.

## Explicitly deferred / rejected

- Auto Send-up on log.  
- Photo-only for-buyer.  
- Changing Your paths UI.

## Sign-off

Required gaps closed: Yes  
Ready: Yes
