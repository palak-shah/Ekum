# Feature Completeness Review — How many who-mode (pack seller)

**Date:** 2026-10-28  
**Module / ask:** Dual-role How many hides Place Order when a trader’s mill SKUs sit on someone else’s curated pack. Who-mode must follow **who the order goes to**, not mill `product.companyId`.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md` (Buy for buyer; How many Place), `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Buying a pack is an order to that shop. Ravi placing Meena’s A+B pack is Place for himself even if every member is a Surat mill SKU. **buyer-only** (no Place; Order for buyer on) is only when the actor **is** the selling shop — own album / own DesignSheet. Dual-role does not turn a visitor pack into a log-for-buyer sheet. |
| UX Designer | Same How many chrome. Foreign pack: **Place Order** + optional Order for buyer switch. Own shop: switch on, Choose buyer, no Place. No second who-row. Mixed mill cart without one pack stamp still splits (“This becomes N orders”). One pack stamp: “Order goes to &lt;pack shop&gt;”, not a split banner. |
| Solution Architect | `orderWhoMode` keys off `sellerCompanyId` (How many `sellerId`). From-pack: stamp `sourceHandlerCompanyId` = pack owner; `orderGoesToSellerId` returns that id. Mill-only / mixed basket without a pack stamp still uses `sellerIdForEntries`. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** How many Place + Order for buyer switch; pack “Order goes to”. Kit switch / footer unchanged.  
2. **Duplicates another feature?** No — same sheet, correct who.  
3. **Should reuse an existing workflow?** Yes — from-pack Place; own-catalog log-for-buyer.  
4. **Naming matches the app?** Place Order · Order for buyer · Choose buyer.  
5. **Units?** N/A — no ₹ or qty string change.

**Philosophy conflict?** No. Dual-role is first-class; visiting a peer pack is buying, not logging.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Place on peer pack; buyer-only on own shop |
| Business rules | OK | Who = pack owner / single mill / `multi` basket |
| Workflows | OK | Album Order, DesignSheet Order, cart, shop |
| Edge cases | OK | Pack of only my mill SKUs; mixed mills no pack; own curated pack stays buyer-only |
| Permissions | N/A | Place still `assertCanTrade` |
| User states | OK | Selling/trading off → hidden (buy-only Place, no switch) |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Sticky How many footer unchanged; BM-07 already on sheet |
| First glance (BM-11) | OK | Peer pack: Place is the loud CTA; Order for buyer stays a quiet switch |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Same test ids `how-many-place-order` / `how-many-order-for-buyer` |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Who-mode used mill `product.companyId`

| Field | Content |
|-------|---------|
| Gap | `orderWhoMode` treated “all member companyIds = me” as own catalog. Meena pack of Ravi SKUs → Ravi got buyer-only (Choose buyer, no Place). |
| Why it matters | Dual-role traders cannot Place the everyday from-pack path. Journeys had to POST `/orders/from-pack`. |
| Impact if ignored | Seed Ravi never completes mixed Place in the UI. |
| Recommendation | Who = `sellerCompanyId`. Pack stamp carries owner company id. buyer-only iff seller === actor. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- `orderWhoMode({ sellerCompanyId })`; How many passes `sellerId`.  
- Stamp `sourceHandlerCompanyId` on pack shortlist; `orderGoesToSellerId` for How many.  
- DesignSheet Order uses pack handler company when stamped.  
- Units: peer pack of my mill SKUs → `for-me-default`; own shop → `buyer-only`.  
- Playwright D1 / D3 / Direct Place: UI Place (`how-many-place-order`), not API-only.  
- Lock the rule in `orders.md`.

## Explicitly deferred / rejected

- FG-007 Direct + hop on one mill ticket.  
- FG-009 `canViewCatalog` = Follow.  
- Changing Order for buyer picker or own-catalog auto-confirm.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
