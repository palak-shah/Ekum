# Feature Completeness Review — Catalog Order as whole (no choose designs)

**Date:** 2026-10-27  
**Module / ask:** When a catalog’s **Order as whole** switch is on, ordering that catalog must not offer Choose designs. Every Order path places all published members. Exclusive catalog designs cannot be ordered as a solo line. Pick catalogs and regular collections stay All / Choose.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `docs/features/explore.md`, `docs/features/orders.md`  
**Disposition:** Proceed (implements already-approved “orders follow whole / pick”)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Seller already decided bunch vs cherry-pick on New catalog. Order as whole means the buyer orders the catalog, not a subset. Own members are exclusive to that catalog — no side door via design sheet, album select, cart, or You Designs. Qty stays per design on How many (Same for all stays). Pick catalogs still Choose designs. |
| UX Designer | Skip the resolve sheet when every album is whole (one job: How many). Mixed piles still show the sheet but whole rows have no Choose designs. Quiet why-line only if needed — not a second title. Hide How many × on whole-catalog lines so the last sheet cannot drop a member. Repost / Share / Message / Bookmark / Curate unchanged. |
| Solution Architect | `orderMode` already on Collection. Expose on CollectionCard. Re-read from collection preview so stale sessionStorage cannot lie. Expand published members into design lines (a collection is never an order line). API rejects cherry-pick of exclusive whole-catalog members (`catalogCollectionId`) and from-pack whole catalogs. Do not auto-invent qty. Mill Explore of a mill design a trader also curated stays allowed. |

---

## Platform consistency (required)

1. **Existing patterns?** Order resolve sheet, How many each, SelectionWorkspaceBar, DesignSheet Order, kit Sheet.  
2. **Duplicates another feature?** No — this is the missing Order half of catalog `orderMode`.  
3. **Should reuse an existing workflow?** Yes — expand into How many like **All designs**. Do not invent a catalog order line.  
4. **Naming matches the app?** Order as whole · Pick and choose · catalog (not collection) on catalog surfaces.  
5. **Units?** Whose = **design** (order snapshots `Product.rate`). Which = order qty on How many, Rate per on the line. Surface = How many / ticket. Pack Explore card still collection ₹. No new ₹ string.

**Philosophy conflict?** No. Fewer taps when there is only one legal choice. Collection remains never an order line.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Whole → all published members; pick / regular unchanged |
| Business rules | OK | Exclusive member Order goes through the catalog; API gate |
| Workflows | OK | Explore / shop / You / album / DesignSheet / cart Order |
| Edge cases | OK | Locked pack opens album; empty `{name} has no designs`; missing orderMode = pick |
| Permissions | OK | Existing trade access; published members only |
| User states | OK | Whole vs pick vs regular; owner log-for-buyer still expands |
| Notifications | N/A | |
| Error handling | OK | `CATALOG_WHOLE_REQUIRED` plain trader copy |
| Scalability | OK | Preview fetch already on Continue |
| Mobile interactions | OK | Skip extra sheet; How many BM-07 clearance unchanged |
| First glance (BM-11) | OK | How many names are the job; no Choose chrome on whole |
| Units (order / dispatch / Rate per) | OK | Design lines; Same for all; no catalog qty unit |
| Accessibility | OK | Hide Choose; sheet still has Continue when mixed |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Order UI ignores catalog orderMode

| Field | Content |
|-------|---------|
| Gap | Resolve sheet always offers Choose designs. Album / DesignSheet / cart can order a subset of a whole catalog. |
| Why it matters | Order as whole is a lie if buyers can cherry-pick. Exclusive catalog designs must not leave the catalog as a solo order line. |
| Impact if ignored | Mills that send as a bunch get partial orders; switch does nothing. |
| Recommendation | Skip / hide Choose on whole; expand all published members on every Order path; hide How many × on those lines; API reject cherry-pick. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Catalog `orderMode=whole`: Order never offers Choose designs; expands all published members into How many.  
- Exclusive own members (`catalogCollectionId`) of a whole catalog cannot be ordered as a solo line.  
- Skip resolve sheet when every selected album is whole (and not locked). Mixed piles: sheet stays; whole rows have no Choose.  
- How many: per-design qty; Same for all; no × on whole-catalog member lines.  
- Pick catalogs and regular collections: All designs / Choose designs unchanged.  
- Curate / Repost / Share / Message / Bookmark unchanged.  
- API: reject incomplete exclusive whole-catalog sets and from-pack whole catalogs.  
- `orderMode` on CollectionCard; re-read from preview.

## Explicitly deferred / rejected

- One catalog order line (conflicts with “a collection is never an order line”).  
- Changing Curate resolve (Use whole collection / Pick designs).  
- Auto-filling qty on the server when lines are missing.  
- Blocking mill Explore orders of a mill design that a downstream trader also curated.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
