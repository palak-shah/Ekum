# Feature Completeness Review — Sticky Ask / Order on pick surfaces (mixed shops)

**Date:** 2026-10-01  
**Module / ask:** While Selecting designs (shop or shared set), show the same sticky **Ask for rates · Order** (and **Curate** when Trading) as a shop — even when rows are from different suppliers. Routing follows existing TradeLane / batch rules, not a fake single shop.  
**Anchors:** `docs/features/company.md`, `docs/features/explore.md`, `docs/features/orders.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | After picking from a folder share or a shop, the next job is Ask / Order. Sending people to Your selection for mixed **From** lines is extra hunting. Split tickets already exist. |
| UX Designer | Same dock as shop: Ask · Order, Curate when Trading. Hide the small floater while this dock owns the band. Hide bottom nav (shop already does). How many each already explains mixed shops. |
| Solution Architect | Reuse `useShortlistOrderFlow` / `/orders/batch` (and from-pack when a curated pack source is on every line). Do **not** pin `sellerCompanyId` to the page shop when companyIds differ. Shop shortlist entries keep each design’s own `companyId`. Dock on `/designs/set` when this set has a pick. Shop dock stays this page’s picks (not silent other-shop leftovers). |

---

## Platform consistency (required)

1. **Existing patterns?** Shop dock chrome; Selection How many + split banner.  
2. **Duplicates?** No — same verbs, on the pick surface.  
3. **Reuse?** Batch + TradeLane; no new order API.  
4. **Naming?** **Ask for rates** · **Order** · **Curate**.

**Philosophy conflict?** No — fewer taps; settings already decide mill vs handler.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Dock → How many → batch / from-pack |
| Business rules | OK | Per-design company; I handle vs Direct unchanged |
| Workflows | OK | Collections on shop still resolve first |
| Edge cases | OK | All own designs: no visitor dock (same as own shop) |
| Permissions | OK | Locked tiles stay out |
| User states | OK | Trading → Curate |
| Notifications | N/A | Existing toasts |
| Error handling | OK | In-sheet error |
| Scalability | N/A | |
| Mobile interactions | OK | Dock + nav hide; content padding (BM-07) |
| Accessibility | OK | Named buttons |
| Platform consistency | OK | Match shop dock |

---

## Approved scope

- `/designs/set`: shop-style dock when selected **open** designs include at least one other shop; How many uses batch (multi sellerId when mixed).  
- Shop: stamp shortlist `companyId` from the design’s shop; How many / place use batch so mixed mills split per settings. Dock still only this page’s picks.  
- Hide floater + tab bar while the dock is up.  
- Docs + unit + functional.

## Explicitly deferred

- Explore feed getting a full shop dock (floater Order stays).  
- Order on PhotoViewer.

## Sign-off

**Proceed.**
