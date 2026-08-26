# Feature Completeness Review — Explore filter panels

**Date:** 2026-08-23  
**Module / ask:** Filter square popup (B): Change View, multi-select Category/City, per-row Clear, dual-presence Explore Buyers / Explore Suppliers; remove All/Buying/Selling chips  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/superpowers/reviews/completeness/2026-08-22-explore-trade-side-completeness.md`  
**Disposition:** Proceed

> Dual-role switch moves into the filter menu so everyday Explore chrome stays one search row. Mixed **All** is no longer a user control. Category/City stay progressive Narrow filters (OR within facet).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need type + category + city without a second chip rail. Dual companies default to buying (suppliers) and opt into buyers via **Explore Buyers**. Single-presence companies stay in their one job. |
| UX Designer | Popup B matches today’s drill-down. Long lists stay in the menu (user-chosen after lab). Selected-first only on reopen. Clear sits on the Category/City rows — no extra Clear filters item. Row selection matches ConnectionPicker (accent border, not checkboxes). Sticky Confirm must clear last row (BM-07). |
| Solution Architect | Reuse `?show=` and `?side=buying\|selling`. Add `categories` / `cities` query lists; keep single `category` / `city` aliases. Web `api.get` sends comma-separated strings. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — portaled filter menu, kit `TextInput` / `Button`, accent-border multi-select, `tradePresence` for buy/sell.  
2. **Duplicates another feature?** No. Profile buy/sell toggles stay on You → Profile.  
3. **Should reuse an existing workflow?** Yes — existing Buying / Selling home shelves; no new Explore mode.  
4. **Naming matches the app?** **Change View**, **View Items By**, **All Feeds** / **Collections Only** / **Designs Only** / **Businesses Only**, **Select Category**, **Select City**, **Explore Buyers**, **Explore Suppliers**. No Seller/Buyer badges on cards.

**Philosophy conflict?** No. Rejected: Sheet A (user chose popup); keeping All chip; dedicated Clear filters row.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Multi category/city; Confirm closes; Change View instant close |
| Business rules | OK | OR within facet, AND across; dual default buying |
| Workflows | OK | Root → submenu → Confirm / Back |
| Edge cases | OK | Empty Confirm = no facet; single-role hides switch; starts-with no matches |
| Permissions | OK | Presence from profile; visibility unchanged |
| User states | OK | Dual / buy-only / sell-only |
| Notifications | N/A | |
| Error handling | OK | Existing Explore load error |
| Scalability | OK | Curated suggest lists + viewer tags; API `in` / `hasSome` |
| Mobile interactions | OK | Popup list scrolls above sticky Select all + Confirm (BM-07) |
| Accessibility | OK | menuitem / menuitemradio; Clear does not open submenu |
| Platform consistency | OK | User asked popup vs sheet; shipped B |

---

## Gaps

### G-001 — Mixed All Explore removed

| Field | Content |
|-------|---------|
| Gap | Slice C default was All (mixed). Dual users now default to Buying. |
| Why it matters | Seed walkthroughs that assumed mixed All change |
| Impact if ignored | Tests still look for All chip |
| Recommendation | Update explore.md + functional e2e; treat `?side=all` as buying for dual |
| Priority | Required before implementation |

### G-002 — Popup vs sheet for long lists

| Field | Content |
|-------|---------|
| Gap | Quality bar prefers sheets for long pickers |
| Why it matters | Category/city lists are long |
| Impact if ignored | Cramped phone popup |
| Recommendation | Accepted exception: user chose B after lab. Cap height; sticky footer; pad list. |
| Priority | Recommended enhancement (accepted) |

---

## Approved scope for this slice

- Rename filter root + Change View copy; close popup on view pick
- Category/City multi-select popup panels (search, select all visible, Confirm, pin selected on reopen only)
- Per-row Clear on Category and City; no Clear filters menu item
- Remove All/Buying/Selling chips; dual-only Explore Buyers / Explore Suppliers last
- API `categories` / `cities` (OR within, AND across)
- Remove `/explore/filter-lab`

## Explicitly deferred / rejected

- Sheet surface (A)
- Changing Profile buy/sell toggles
- Keeping mixed All as a user mode
- Rank algorithm beyond applying the new filters

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
