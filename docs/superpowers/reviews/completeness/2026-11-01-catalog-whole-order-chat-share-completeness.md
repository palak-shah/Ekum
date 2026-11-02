# Feature Completeness Review — Catalog Order as whole (chat / deep-link Order)

**Date:** 2026-11-01  
**Module / ask:** Sharing one exclusive design from an **Order as whole** catalog still posts a design card. Buyer **View design →** (`/explore/products/:id`) and **View designs →** (`/designs/set`) must Order the **catalog**, not that one design. Share payload stays a design card.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `docs/features/explore.md`, `docs/features/orders.md`, `docs/features/chat.md`  
**Disposition:** Proceed (closes a missed Order path from `2026-10-27` / `2026-10-28`; Share unchanged)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Seller already chose bunch vs cherry-pick. Sharing one print to highlight it is fine. Ordering that print alone is not. Chat View design is an Order path, same as album DesignSheet. |
| UX Designer | Keep the design card in chat (Share = checked designs). How many is still catalog name + one qty. Do not swap the card for a catalog card — that would surprise the seller who selected one design. Pick catalogs stay solo. |
| Solution Architect | `GET /explore/products/:id` already returns `catalogCollectionId`. Pass it into DesignSheet / design-set shortlist so existing `expandWholeCatalogsInShortlist` remaps. API `CATALOG_WHOLE_REQUIRED` stays the backstop. Do not rewrite `product_card` / `design_album` posting. |

---

## Platform consistency (required)

1. **Existing patterns?** Album DesignSheet Order already remaps exclusive whole-catalog members. Chat opens the same DesignSheet via `/explore/products/:id`.  
2. **Duplicates another feature?** No — same whole-order remap, missed surface.  
3. **Should reuse an existing workflow?** Yes — `prepareCatalogOrder` / `expandWholeCatalogsInShortlist`. Do not invent a catalog chat card for this.  
4. **Naming matches the app?** Order as whole · catalog · View design.  
5. **Units?** No new ₹ or qty string. Whose = catalog bunch on How many (same as album). Which = order qty. Surface = How many.

**Philosophy conflict?** No. Fewer taps; one legal Order. Share still shares the checked design.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Stamp through; expand all published members |
| Business rules | OK | Exclusive whole member cannot be a solo Order line |
| Workflows | Gap → OK | Chat View design / `/explore/products/:id` / design set were omitted |
| Edge cases | OK | Pick catalog / no stamp stays solo; empty catalog existing error |
| Permissions | OK | Existing explore product access (chat share / connection / album) |
| User states | OK | Whole vs pick vs leftover |
| Notifications | N/A | |
| Error handling | OK | Existing `CATALOG_WHOLE_REQUIRED` |
| Scalability | OK | Same collection preview fetch as album Order |
| Mobile interactions | OK | How many BM-07 unchanged |
| First glance (BM-11) | OK | Design card in chat; How many is the catalog |
| Units (order / dispatch / Rate per) | N/A | No ₹/qty string change |
| Accessibility | OK | Same DesignSheet Order + catalog How many |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Chat / deep-link Order drops catalog stamp

| Field | Content |
|-------|---------|
| Gap | `ExploreProductPage` and `designSetToShortlist` omit `catalogCollectionId`. How many is one design. |
| Why it matters | Order as whole is a lie if sharing a member is a solo Order door. |
| Impact if ignored | Buyer places (or tries to place) one of nine; mill bunch is broken. |
| Recommendation | Pass `catalogCollectionId` (and `catalogOrderMode` when present). Share stays a design card. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Chat **View design →** / `/explore/products/:id` / design-set Order of an exclusive whole-catalog member opens catalog How many (all published members).  
- Share / Message still post `product_card` / `design_album` (checked designs).  
- Pick catalogs and leftover designs stay solo-orderable.  
- API `CATALOG_WHOLE_REQUIRED` unchanged.

## Explicitly deferred / rejected

- Rewriting Share from a whole catalog into a `collection_card`.  
- Blocking mill Explore orders of a mill design a downstream trader also curated (already deferred).  
- Changing Curate resolve.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
