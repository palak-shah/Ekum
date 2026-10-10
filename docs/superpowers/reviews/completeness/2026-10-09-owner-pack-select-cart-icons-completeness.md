# Feature Completeness Review — owner pack Selecting dock icons

**Date:** 2026-10-09  
**Module / ask:** My Collection (own pack) Selecting dock: **Add to cart** · **Share** · **Delete** as icons; **Remove from this collection** stays the text button.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, Explore `SelectionWorkspaceBar` cart verb  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Owner Selecting already Share · Remove · Delete. Traders also need cart from own pack (same verb as Explore) without leaving Select. Delete stays severe but quieter as icon; Remove stays the loud pack-local action. |
| UX Designer | One dock row: three square icons (cart · share · delete) + flex Remove button. Match existing Share square chrome; Delete uses danger ink. No DockIconButton labels — cramped with long Remove copy. |
| Solution Architect | `OwnerPackManageDock` + `onAddToCart` on viewer; cart via `addCartDesignsMany` from selected pack products; exit Selecting after add (Explore pattern). Editor may omit cart/share when unwired. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Explore cart verb; owner Share square; Remove copy unchanged; Delete last among icons before Remove.  
2. **Duplicates another feature?** No — same cart, from pack manage selection.  
3. **Should reuse an existing workflow?** Yes — `addCartDesignsMany` + toast; CatalogShareSheet for Share.  
4. **Naming matches the app?** Add to cart / Share / Delete / Remove from this collection.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Cart merges selected designs; Share/Remove/Delete unchanged behaviour |
| Business rules | OK | Cart only when selection non-empty; published filter for cart eligibility |
| Workflows | OK | Select → cart → toast → exit Selecting |
| Edge cases | OK | Empty selection disables icons; no cart handler → hide cart |
| Permissions | OK | Owner dock only |
| User states | OK | Selecting vs idle unchanged |
| Notifications | OK | Toast on cart add |
| Error handling | N/A | Local cart |
| Scalability | N/A | |
| Mobile interactions | OK | Sticky dock; clearance already BM-07 |
| First glance (BM-11) | OK | Remove remains the readable verb; icons quiet |
| Accessibility | OK | aria-labels on icon buttons |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Selecting dock: Cart · Share · Delete icons + **Remove from this collection** button  
- Wire Add to cart on own collection viewer from `manageSelected`  
- Units + `collections.md` + gap matrix  

## Explicitly deferred / rejected

- DockIconButton caption labels under icons (Explore-style) — too tall with Remove  
- Editor cart/share wiring if product shortlist payload is awkward — hide when no handler  
