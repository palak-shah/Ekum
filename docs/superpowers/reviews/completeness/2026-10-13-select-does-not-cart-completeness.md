# Feature Completeness Review — Select does not write cart

**Date:** 2026-10-13  
**Module / ask:** Checking a design or collection must stay staging until dock / sheet **Add to cart**. Order must not copy staging into the cart.  
**Anchors:** `docs/features/explore.md`, `docs/features/saved.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Staging ≠ cart is already the product rule. Auto-merge on Order broke the promise of Select without Add to cart. |
| UX Designer | Dock **Add to cart** stays the only park verb. Order opens How many on the page (shop pattern) so cancel leaves checks and cart alone. |
| Solution Architect | Remove `addStagingToCart` / `addCartDesignsMany` from Order paths. Cart clear only after cart-page success; staging success clears checks only. |

---

## Platform consistency (required)

1. **Existing patterns?** Shop Order already orders shortlist without writing cart. Reuse that on Explore dock, DesignSheet, You.  
2. **Duplicates another feature?** No — tightens the existing cart dock slice.  
3. **Should reuse an existing workflow?** Yes — CompanyProfilePage Order resolve + How many.  
4. **Naming matches the app?** Cart / Add to cart / Order unchanged.

**Philosophy conflict?** No — fewer surprise pile moves; Select remains a shortlist.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Select stages; Add parks; Order places |
| Business rules | OK | Cart writes only on Add to cart (or explicit cart-page edits) |
| Workflows | OK | Cancel Order leaves staging + cart |
| Edge cases | OK | Choose designs Continue stays on staging |
| Permissions | N/A | |
| User states | OK | Mixed staging + existing cart: Order does not wipe cart |
| Notifications | N/A | |
| Error handling | OK | Existing How many errors |
| Scalability | N/A | |
| Mobile interactions | OK | Same dock clearance (BM-07) |
| First glance (BM-11) | OK | Add to cart remains the cart verb |
| Accessibility | OK | Same controls |
| Platform consistency | OK | Matches shop Order |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Selection dock / DesignSheet / You: Order in place; no cart write.
- SelectionPage: drop staging→cart handoff on `openOrder` / `openCurate`.
- Staging order success clears staging only; cart-page order still clears cart.
- Docs + units.

## Explicitly deferred / rejected

- Shop dock still has no Add to cart (unchanged).
- Migrating old sessionStorage shortlist into cart.
