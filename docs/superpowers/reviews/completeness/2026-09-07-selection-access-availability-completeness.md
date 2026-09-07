# Feature Completeness Review — Selection access availability

**Date:** 2026-09-07  
**Module / ask:** Selection / Explore product access: accessible ⇒ orderable; no false “No longer available” when access unchanged  
**Anchors:** `docs/features/explore.md`, `docs/features/orders.md`, `docs/superpowers/specs/2026-09-07-selection-access-availability-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders pick designs in albums and order later; logout must not invent unavailability. Only access loss fades rows. |
| UX Designer | Same faded reasons (Archived / Not published / No longer available); no new chrome. |
| Solution Architect | Fix Explore productDetail + TradeAccess discoverability via open collection membership; Selection keeps existing GET. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — access/audience/live window already on collections.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Reuse collection discover + view-products gates.  
4. **Naming matches the app?** Keep existing reason copy.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Accessible designs stay selectable/orderable |
| Business rules | OK | Access only; no inventory |
| Workflows | OK | Feed or album pick same rule |
| Edge cases | OK | Locked Followers shell (no products) does not unlock design |
| Permissions | OK | Audience / grant / live / block |
| User states | OK | Logout survival |
| Notifications | N/A | |
| Error handling | OK | Same 404 → No longer available |
| Scalability | OK | Cap membership scan |
| Mobile interactions | N/A | |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

None Required for this slice.

---

## Approved scope for this slice

- Shared “product in accessible collection” check
- Wire into `ExploreService.productDetail` and `TradeAccess` open-catalog trade
- Docs: explore.md + gap matrix
- API unit tests

## Explicitly deferred / rejected

- Inventory
- Per-pick `sourceCollectionId`
- Changing own-business order rule

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
Disposition: **Proceed**
