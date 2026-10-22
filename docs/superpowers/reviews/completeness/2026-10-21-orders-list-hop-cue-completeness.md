# Feature Completeness Review — List order-for / order-to hop cue

**Date:** 2026-10-21  
**Module / ask:** Approved compact-list suggestion: mill-buy facts `Order # · 12 sets · for {buyer} {parent #}`; I-handle parent never names mills; everyday buy/sell skip for/to.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md` (I-handle: one Trading parent row, never a mill subset row; mill hop has no Related portal to the buyer ticket), `2026-10-21-orders-list-compact-completeness`  
**Disposition:** Redesign

> Completeness keeps Ekum **coherent**. Listing mill hops — or printing the end buyer on the mill’s sale — fights the I-handle model. Do not document-and-build the prototype mill-buy row.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | For/to only helps when it names a shop that is **not** the avatar. On today’s list, that shop is either the avatar already or a hidden mill/buyer. Qty on facts (`12 sets`) is the useful extra and is already shipped. |
| UX Designer | Prototype mill hop (`for Kiran #1010`) assumes mill subset **rows**. Ekum’s scan is one Trading parent (buyer as title). A second mill row on Buying is a second path to the same desk. |
| Solution Architect | Trader mill hops are hidden (`traderListHidesSubset`). Open redirects to the parent (`deskOrderId`). List serializer blanks `relatedOrders`. Mill must not receive parent buyer / parent # (`buildRelatedOrders` skips the mill). |

---

## Platform consistency (required)

1. **Existing patterns?** One Trading list row; mill lots are subsets on that ticket. Soft-hide: parent never names mills to the buyer; mill never sees the buyer ticket.  
2. **Duplicates another feature?** Yes — mill identity already lives on mill cards / trader mill desks. Trading idle may already say `Trading · {mills}` for the **trader**.  
3. **Should reuse an existing workflow?** Stay on the parent row. Find by mill name / mill # already maps to that row.  
4. **Naming matches the app?** `for` / `to` is plain. The leak is who it names, not the words.

**Philosophy conflict?** Yes → Redesign. Do not list mill subset rows. Do not print mill names on the Manage parent for the buyer. Do not print the end buyer or parent # on the mill’s mill-hop row.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | Suggested mill-buy row does not exist on the trader list. |
| Business rules | OK | Soft-hide + one parent row stay. |
| Workflows | OK | Trader desk unchanged. |
| Edge cases | OK | Reveal On still must not dump mill names onto the buyer’s parent list. |
| Permissions | OK | Mill vs trader vs buyer already gated. |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | N/A | No new chrome. |
| First glance (BM-11) | OK | Compact facts stay `Order # · 12 sets`. |
| Accessibility | N/A | |
| Platform consistency | Gap | Prototype mill-buy row vs “never a mill subset row”. |

---

## Gaps

### G-001 — Mill-buy list row does not exist

| Field | Content |
|-------|---------|
| Gap | `for {buyer} {parent #}` needs a mill hop on Buying. Traders never get that row (`traderListHidesSubset`). Opening a mill hop redirects to the parent. |
| Why it matters | Shipping the cue requires listing mill subsets — a second Orders path. |
| Impact if ignored | Duplicate rows, mill # vs parent # confusion, Find already maps mill → parent. |
| Recommendation | Keep mill hops off the trader list. |
| Priority | Reject / Redesign |

### G-002 — Mill must not see the buyer ticket

| Field | Content |
|-------|---------|
| Gap | Mill’s Selling mill-hop avatar is already the trader. Adding `for {end buyer}` or parent # leaks the other hop. |
| Why it matters | Soft-hide: mill sees their lot only; no Related portal to the buyer ticket. |
| Impact if ignored | End-buyer name / parent # on the mill list. |
| Recommendation | No hop cue on mill mill-hop rows. |
| Priority | Reject / Redesign |

---

## Approved scope for this slice

None. No list hop cue. No mill subset rows. Qty on facts stays as shipped.

## Explicitly deferred / rejected

- Listing mill hops on Buying / Selling for the trader.  
- `for {buyer}` / parent # on mill mill-hop rows.  
- `to {mill}` / mill names on the I-handle parent for anyone who must not see mills (buyer). Trader parent may still show idle `Trading · {mills}` (existing).  
- Everyday `for` / `to` of the avatar shop.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: No — Redesign resolved by keeping current IA
