# Feature Completeness Review — Explore cart dock

**Date:** 2026-10-09  
**Module / ask:** Explore Selecting dock: drop “N in selection · View”; **Cart · Message · Share** icons + **Order** (right). Header **Cart** opens cart. Dock **Cart** adds picks then clears selection.  
**Anchors:** `docs/features/explore.md`, `docs/features/saved.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Staging (checks on Explore) ≠ cart. Add parks for later; Order is still the primary trade verb. |
| UX Designer | Dock matches mock (icons left, Order filled right). Header bag + badge opens cart. After add: checks off, Selecting ends, dock hides. |
| Solution Architect | New cart stores (designs + collections). Staging stays shortlist + album pick. Cart page = today’s `/selection` UI, cart-backed. Dock Order merges staging → cart then opens order. |

---

## Platform consistency

1. **Existing?** Traveling pile + Selection page actions.  
2. **Duplicates?** No — cart is the parked pile; staging is ephemeral.  
3. **Reuse?** SelectionPage as Cart; Message/Share sheets unchanged on staging.  
4. **Naming?** Cart (not Selection) on Explore + cart page title.

**Philosophy?** Aligns with fewer chrome lines; Chat/shop docks unchanged this slice.

---

## Checklist

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Add / open / Order / Message / Share |
| Business rules | OK | After add, staging cleared |
| Workflows | OK | Header opens cart; dock Cart adds |
| Edge cases | OK | Empty cart; multi-shop Message disabled |
| Mobile / BM-07 | OK | Dock clearance unchanged |
| First glance BM-11 | OK | Order loudest right |
| Platform consistency | OK | |

---

## Approved scope

- Explore header Cart (badge) → `/selection` (title **Cart**), cart store.
- Explore dock: no View row; **Cart · Message · Share** + **Order**.
- Dock Cart: merge staging → cart, clear staging, exit Selecting, toast.
- Dock Order: merge staging → cart, clear staging, open cart with order flow.
- Message / Share: staging (before clear).
- Docs + units; shop dock unchanged this slice.

## Deferred

- Shop / album “Add to cart” chrome.
- Renaming all “Selection” code identifiers.
- Migrating old sessionStorage shortlist into cart automatically.
