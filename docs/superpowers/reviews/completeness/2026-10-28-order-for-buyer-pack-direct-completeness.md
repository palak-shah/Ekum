# Feature Completeness Review — Order for buyer from a pack uses Direct Link

**Date:** 2026-10-28  
**Module / ask:** AL opened JE’s pack, Order for buyer SS. Ticket shows AL as supplier, 1:1 chat, no trio — even though a Direct Link exists. Who-mode already sends **Place** to the pack shop; Order for buyer still logs mill SKUs as own-catalog.  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`, Completeness `2026-10-28-how-many-pack-who-mode-completeness.md`, `2026-09-29-order-for-buyer-mill-seller-completeness.md`, TradeLane Direct Place  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Do **not** overwrite pack who-mode or mill-seller completeness files. Own-album Order for buyer (auto-confirm) stays. Place from-pack mill hops stay.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Buying a pack is an order **to that shop**. Order for buyer from the same pack is the same shop, different buyer. AL must not become supplier of JE’s album because the members happen to be AL mill SKUs (auto-repost). Direct Link AL created (supplier JE × buyer SS) must open the mill ticket JE→SS and the trio. |
| UX Designer | How many already says the order goes to the pack shop. Parties after log must match that: supplier = pack shop, buyer = chosen buyer, chat group when Direct. No extra who-row. |
| Solution Architect | Pass `collectionId` on `POST /orders/for-buyer`. On a **visitor** pack, actor-owned SKUs bucket as mill = pack owner (not `own`). Existing `pathForPair(actor, mill, buyer)` + Direct `orders.create` already opens `ensureDirectPlaceThread`. Own pack / no pack stamp: unchanged mill-seller + own-confirm. |

---

## Platform consistency (required)

1. **Existing patterns?** Pack who-mode Place; for-buyer mill Direct vs I-handle; Direct Place trio.  
2. **Duplicates another feature?** No — closes the gap who-mode deferred (Order for buyer still own-confirm on a peer pack).  
3. **Should reuse an existing workflow?** Yes — mill hop `pathForPair`, not a third path.  
4. **Naming matches the app?** Order for buyer · Supplier · Direct links · group.  
5. **Units?** N/A (no ₹ / qty string change). Pack vs design: this is **whose shop** the ticket is with (pack owner), not Rate per.

**Philosophy conflict?** No. Mill-seller still holds when the actor **is** the selling shop (own album / You). A visitor pack is not that shop.

---

## Locked rule

| Surface | Seller / mill in the hop | Buyer |
|---------|-------------------------|-------|
| Own pack / no `collectionId` / You library | Own SKUs → confirmed bilateral. Foreign mill SKUs → mill hop (`product.companyId`). | Chosen buyer |
| Visitor pack (`collection.companyId` ≠ actor) | Actor-owned SKUs → mill = **pack owner** (the shop they ordered from). Other mill SKUs → `product.companyId`. | Chosen buyer |

Direct Link at hop: trader = actor, mill = that mill id, buyer = chosen buyer. Hit → mill ticket + trio at Place. Miss → I-handle parent as today.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Pack Order for buyer follows who-mode shop |
| Business rules | OK | Direct Link next-orders; mill-seller on own shop stays |
| Workflows | OK | How many → buyer picker → log → ticket + group |
| Edge cases | OK | Own pack; mixed mill members; off-app invite still own-catalog only |
| Permissions | OK | Same tradable checks as mill hop |
| User states | OK | Direct Shared vs I-handle until Send |
| Notifications | OK | Existing orderCreated |
| Error handling | OK | Unknown `collectionId` → not found |
| Scalability | OK | Same N hops |
| Mobile interactions | OK | No new chrome |
| First glance (BM-11) | OK | Parties: pack shop as supplier, not logger |
| Units | N/A | No rate/qty string change |
| Accessibility | N/A | |
| Platform consistency | OK | Same Direct trio as Place |

---

## Gaps

### G-001 — Visitor pack Order for buyer ignores Direct Link

| Field | Content |
|-------|---------|
| Gap | `/orders/for-buyer` has no pack id. Actor-owned members (JE auto-repost of AL mill) go `own` → bilateral AL→SS, Confirmed, 1:1. I-handle mill hop (JE’s own designs, no matching lane as product mill) stamps AL as seller. Screenshot: supplier AL, buyer SS, Placed/Requested, no group. |
| Why it matters | Direct Link promised mill ticket + group. Who-mode promised the pack shop. |
| Impact if ignored | Traders think Direct Links are broken. |
| Recommendation | `collectionId` on the DTO; visitor pack own SKUs hop to pack owner; Direct `pathForPair` opens the trio. |
| Priority | Required before implementation |

Closed in this slice.

---

## Approved scope for this slice

- Completeness + orders.md / gap-matrix lock.  
- Optional `collectionId` on create-for-buyer. How many from a pack forwards the same id Place already uses.  
- Visitor pack: actor-owned lines are mill hops to the pack shop. Direct Link → mill ticket + trio.  
- Units + API/web tests. Trader-eye parties when a seed path exists.

## Explicitly deferred / rejected

- Changing Place from-pack mill grouping (SKU mill hops stay for Place-for-me).  
- Inverse lane lookup (JE-created mill AL × buyer SS when AL is the actor) — only the visitor’s Direct Link (trader = actor, mill = pack shop) in this slice.  
- Off-app mill hops (already deferred).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
