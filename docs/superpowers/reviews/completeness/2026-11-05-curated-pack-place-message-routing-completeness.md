# Feature Completeness Review — Curated pack design Order / Message → trader

**Date:** 2026-11-05  
**Module / ask:** Buyer orders or messages from a design inside a trader’s curated pack (no Direct Link). Ticket and chat must be the trader. **Show supplier name** only prints **From {shop}** on the pack and Explore. Repair the open Buyer 1 / Trader 1 / Supplier 1 ticket that already landed on the mill.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/explore.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Bugfix. Pack Place already uses `from-pack`. The design sheet still posts `/orders/batch` and messages `product.companyId` (the mill). Not a new order model.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | No Direct Link → I-handle. Buyer talks to the trader who published the pack. Show supplier is credit, not a route. Direct Link still talks to that mill. The older test trio used pack Place and already landed on the trader. |
| UX Designer | No new chrome. How many and Message name the same shop Place will use. Pack card Message stays the pack owner. |
| Solution Architect | Reuse `placeFromPackOrBatch` and `createFromPack`. Message counterpart = Direct mill, else `sourceHandlerCompanyId`, else design owner. One-shot repair only for shops named Buyer 1, Trader 1, Supplier 1 while the ticket is still requested. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — from-pack Manage parent + held mill hop; selection dock already pack-aware.  
2. **Duplicates another feature?** No — closes the design-sheet hole.  
3. **Should reuse an existing workflow?** Yes — same Place helper as the selection dock.  
4. **Naming matches the app?** Order goes to {trader}. Chat counterpart is that shop name. No Seller/Buyer on the card body.  
5. **Units?** N/A — no ₹ or qty string change. Pack Explore card stays the collection.

**Philosophy conflict?** No. Routing the buyer to the mill without a Direct Link fights I-handle.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | Design sheet Order is batch; Message uses mill `companyId` |
| Business rules | Gap | Show supplier must not choose the seller |
| Workflows | Gap | Design inside pack ≠ pack Place |
| Edge cases | OK | Direct stamp still mill; no pack stamp stays batch; NOT_CURATED falls back to batch |
| Permissions | OK | from-pack `assertCanTrade` with `sourceCollectionId` |
| User states | OK | Open requested ticket only for the named repair |
| Notifications | N/A | Repair moves the order card; no new notify type |
| Error handling | OK | Existing Place toast / ApiError |
| Scalability | OK | One sheet, one pack id |
| Mobile interactions | OK | Same How many / Message sheet; no new sticky bar |
| First glance (BM-11) | OK | Message To-line and Order goes to name the trader |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Existing Message / Order buttons |
| Platform consistency | OK | Reuse dock Place + pack stamps |

---

## Gaps

### G-001 — Design sheet Place ignores the pack

| Field | Content |
|-------|---------|
| Gap | `DesignSheet` always `POST /orders/batch`. Curated lines keep the mill product id, so the seller is Supplier 1. |
| Why it matters | Buyer and mill have no follow. Trader is cut out of the sale. |
| Impact if ignored | Every design-level Order inside a curated pack repeats the glitch. Pack Place stays correct. |
| Recommendation | Call shared `placeFromPackOrBatch` with the pack `collectionId`. |
| Priority | Required before implementation |

### G-002 — Message uses the mill shop id

| Field | Content |
|-------|---------|
| Gap | Selection dock and design sheet Message use `companyId` (mill), not `sourceHandlerCompanyId`. |
| Why it matters | Chat opens with the supplier the buyer does not follow. |
| Impact if ignored | Order can be fixed while Message still leaks to the mill. |
| Recommendation | Same counterpart as Place: trader on I-handle, mill on Direct. |
| Priority | Required before implementation |

### G-003 — Open Buyer 1 ticket already on Supplier 1

| Field | Content |
|-------|---------|
| Gap | One requested bilateral order from the design-sheet bug. |
| Why it matters | Buyer 1 is already in Supplier 1’s chat. |
| Impact if ignored | Code fix only helps the next Place. |
| Recommendation | Re-home that order to Trader 1 (Manage + order card + held hop). Skip every other trio and any confirmed ticket. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Design sheet Place uses from-pack when a pack id is present.
- Message counterpart follows I-handle vs Direct stamps.
- Docs: Show supplier name is display only.
- One-shot repair for Buyer 1 / Trader 1 / Supplier 1, status requested, no Direct Link.
- Units for Place URL, Message shop, and the repair match rule.

## Explicitly deferred / rejected

- Rewriting confirmed, dispatched, or settled orders.
- Any order whose shops are not Buyer 1, Trader 1, and Supplier 1.
- Changing `createFromPack` or TradeLane Direct rules.
- Company-profile shop Order (own-shop batch).
- Explore solo design posts (no pack stamp) — those stay the design owner.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
