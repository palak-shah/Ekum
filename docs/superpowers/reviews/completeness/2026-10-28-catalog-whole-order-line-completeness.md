# Feature Completeness Review — Catalog Order as whole (one qty, one ticket line)

**Date:** 2026-10-28  
**Module / ask:** When a catalog’s **Order as whole** is on, How many is one catalog qty (not N design steppers). Ticket / Confirm / Dispatch / Amend treat the bunch as one row. Exclusive members cannot be ticked solo for Order.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `docs/features/explore.md`, `docs/features/orders.md`  
**Disposition:** Redesign → Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Order as whole means they order **the catalog**. Qty 1 = that unit of every published member. Seller Confirm or Decline the bunch. Pick catalogs stay cherry-pick. Rate stays the stamped design Rate per (₹450/pc × designs), not a hidden album SKU unless Rate per is set/box/bundle. |
| UX Designer | How many title is the catalog name. One − n +. Members are a quiet read-only list (thumbs + names). No Same for all, no per-design Note, no ×. Ticket is one catalog row. Mill hop desks stay per SKU. BM-07: last member clears sticky Place. |
| Solution Architect | Keep one `OrderItem` per design (mill hops, packing-slip SKUs, leftover). Stamp `catalogCollectionId` / `catalogName` / `catalogWhole` at Place. Equal qty on the group (`CATALOG_WHOLE_QTY`). Collapse is a display helper; mill lines with `sourceItemId` do not collapse. |

---

## Platform consistency (required)

1. **Existing patterns?** How many sheet, kit QtyStepper / Sheet / 48px thumbs, OrderUnitGroupedList, Confirm / Dispatch docks.  
2. **Duplicates another feature?** No — this is the Order half of catalog `orderMode=whole`, replacing per-design How many.  
3. **Should reuse an existing workflow?** Yes — Place still sends member productId+qty; Confirm / Dispatch / Amend fan out. Do **not** invent a collection OrderItem.  
4. **Naming matches the app?** Order as whole · catalog (not collection) · Place Order / Choose buyer. Chat count **1 catalog**, not 9 designs.  
5. **Units?** Whose = **catalog qty**, **design Rate per**. Which = Order taken in on How many; Rate per on the quiet ₹ line; pack conversion on Total when order is set/box/bundle and Rate per differs. Surface = How many footer + ticket Total. 9 designs × ₹450/pc × 1 = ₹4,050 — never `1 × ₹450`. Blank 1 set contains → no ₹.

**Philosophy conflict?** Yes vs 2026-10-27 “a catalog is never an order line.” **Redesign:** whole catalogs **are** the How many / ticket line; members stay stored OrderItems. Regular collections and pick catalogs stay never-an-order-line.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | One qty; equal stamp; collapse on buyer/seller ticket |
| Business rules | OK | All published members; equal qty; confirm all-or-nothing |
| Workflows | OK | Explore / shop / You / album / DesignSheet / cart Order |
| Edge cases | OK | Empty catalog; mixed pile (catalog block + loose designs); mill hops uncollapsed |
| Permissions | OK | Existing trade access |
| User states | OK | Whole vs pick vs regular; owner log-for-buyer |
| Notifications | N/A | Chat card count uses display groups |
| Error handling | OK | `CATALOG_WHOLE_REQUIRED` · `CATALOG_WHOLE_QTY` · `CATALOG_WHOLE_SPLIT` |
| Scalability | OK | Stamp at Place; no extra fetch on ticket |
| Mobile interactions | OK | Sticky Place; BM-07 clearance on member list |
| First glance (BM-11) | OK | One job: how many of this catalog; members quiet |
| Units (order / dispatch / Rate per) | OK | catalogBunchBill = member sum when Rate per is pc/mtr |
| Accessibility | OK | One stepper labelled with catalog name |
| Platform consistency | OK | Kit chrome; mill desks unchanged |

---

## Gaps

### G-001 — How many still looks like N orders

| Field | Content |
|-------|---------|
| Gap | Whole catalogs expand into per-design qty. 9 designs × 1 reads as 9 sets. Individual steppers stay. Solo tick of one exclusive member is allowed. |
| Why it matters | Mills that send as a bunch get the wrong trader feel; Order as whole is a lie at the qty sheet. |
| Impact if ignored | Screenshot bug ships: 9 pcs / 9 steppers / ₹4,050 looking like nine orders. |
| Recommendation | One catalog qty; read-only members; block solo Order-select; stamp+collapse ticket; mill desks stay SKUs. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- How many: catalog name + one qty (catalog Order taken in) + read-only member thumbs/names.  
- Qty 1 = that unit of every published member. Place payload = equal qty per member.  
- Selection: cannot tick one exclusive whole-catalog design for Order (remap / toast). DesignSheet Order still opens the catalog qty sheet. Share / Bookmark / Message / Curate unchanged.  
- Ticket / Confirm / Dispatch / Amend (buyer and catalog owner): one catalog row; Confirm or Decline the bunch; Dispatch This LR qty fans out.  
- Billing: Rate per pc/mtr → `qty × rate × designs` (× 1 set contains when order is pack and Rate per differs). Rate per set/box/bundle → `qty × rate`.  
- API: stamp `catalogCollectionId` / `catalogName` / `catalogWhole`; `CATALOG_WHOLE_REQUIRED` stays; equal qty; reject split confirm.  
- Mill hop desks stay per design (`sourceItemId`). Packing slip still lists member SKUs.  
- Pick catalogs and regular collections unchanged.

## Explicitly deferred / rejected

- A single collection-typed OrderItem (breaks mill hops and packing SKUs).  
- Changing Curate resolve (Use whole collection / Pick designs).  
- Blocking mill Explore orders of a mill design a downstream trader also curated.  
- Auto-filling missing member qty on the server.  
- Bundle SKU price except when Rate per is already set/box/bundle.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
