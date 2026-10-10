# Feature Completeness Review — company shop Selecting dock

**Date:** 2026-10-09  
**Module / ask:** Shop Selecting dock should be **Message · Share · Order** (same as Explore pile dock), not Curate · Ask for rates · Order.  
**Anchors:** `docs/features/company.md`, `docs/features/explore.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed (Redesign of prior shop-dock exception)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One pile language across Explore and other shops. Curate / Ask stay on **Your selection** (and pack/design visitor docks where they already live). Shop dock acts on **this shop’s** picks only. |
| UX Designer | Same three icon buttons as SelectionWorkspaceBar — Message · Share · Order (Order filled, right). No second “count · View” row (Select all pill already owns count). Clearance matches selection dock height (BM-07). |
| Solution Architect | Reuse `DockIconButton`, `SelectionMessageSheet`, `CatalogShareSheet`, existing Order resolve → How many. Drop shop Curate resolve path from this page. Share clears **this shop’s** lines only. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Explore / design-set Selecting dock.  
2. **Duplicates another feature?** No — shop-scoped act vs global floater (floater still hidden while shop dock is up).  
3. **Should reuse an existing workflow?** Yes — message / share sheets + Order resolve.  
4. **Naming matches the app?** Message · Share · Order (not Enquire / Forward).

**Philosophy check?** Aligns with fewer trade verbs on the shop and one dock language. No conflict.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Message / Share / Order on this shop’s pile |
| Business rules | OK | Other shops stay in pile; Share clears this shop only |
| Workflows | OK | Collections still resolve before How many |
| Edge cases | OK | Own shop: no dock; empty pile: no dock |
| Permissions | OK | Message sheet uses existing thread start + cards |
| User states | OK | Selecting + this-shop count > 0 |
| Notifications | N/A | |
| Error handling | OK | Sheets / How many already toast |
| Scalability | N/A | |
| Mobile interactions | OK | SELECTION_DOCK_CLEARANCE; nav hidden while dock up |
| First glance (BM-11) | OK | Three equal slots; Order primary right |
| Accessibility | OK | Icon + label buttons |
| Platform consistency | OK | Matches Explore dock verbs |

---

## Gaps

None Required for this slice.

---

## Approved scope for this slice

- Replace company shop Selecting dock with **Message · Share · Order** (icon chrome).
- Wire Message → `SelectionMessageSheet` (this shop’s albums + designs).
- Wire Share → `CatalogShareSheet`; on success clear this shop’s picks.
- Keep Order → resolve albums → How many (order only).
- Update `company.md`, `explore.md`, gap matrix; unit asserts dock verbs.

## Explicitly deferred / rejected

- Curate / Ask for rates on the shop dock (use **Your selection** / visitor docks).
- Adding “N in selection · View” on the shop dock (Select all pill owns count).
