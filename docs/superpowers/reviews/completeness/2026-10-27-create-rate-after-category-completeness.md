# Feature Completeness Review — Create collection/catalog Rate after Category

**Date:** 2026-10-27  
**Module / ask:** On create/edit collection, catalog, and design, put **Rate** immediately after **Category** (before Item / Quality / Size tags).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`, `ui-quality-bar`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Rate per options come from Category. Traders pick the category, then the rupee, then optional tags. Tags between those two jobs was extra scroll for the money field. |
| UX Designer | Same Product details group. No new chrome. Collection / catalog / design share Category → Rate → tags so the same job is not in three orders. |
| Solution Architect | JSX slot order only. Rate parse, Apply-all, Who, Order and dispatch unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Product details kicker, `MasterCategoryField`, `RateRangeFields`, `CascadeTagsFields`.  
2. **Duplicates another feature?** No — same identity fields.  
3. **Should reuse an existing workflow?** Same create/edit collection, catalog, design, member sheet, Add designs shared card.  
4. **Naming matches the app?** Category · Rate per · Item tags / Quality / Size tags.  
5. **Units?** Whose: pack Rate on collection/catalog; design Rate on the design editor. Which: Rate per unchanged. Surface: create/edit field order only. No ₹ string change.

**Philosophy conflict?** No — 2026-10-20 said Rate after Category (below tags was “fine”). This tightens that to **right after Category**.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Category → Rate → tags |
| Business rules | OK | Category still required; Rate still optional; Rate per still from selected category |
| Workflows | OK | Create + edit identity; member sheet; design editor; Add designs |
| Edge cases | OK | General Collection still hides Product details; catalog-exclusive design still photos/name/notes only |
| Permissions | N/A | Own catalog |
| User states | OK | Empty Rate still ₹ + Rate |
| Notifications | N/A | |
| Error handling | N/A | No new submit rules |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky chrome (BM-07 N/A) |
| First glance (BM-11) | OK | Category then Rate is the money job; tags stay quieter below |
| Units (order / dispatch / Rate per) | N/A | Order unchanged |
| Accessibility | OK | Existing labels; tab order follows visual order |
| Platform consistency | OK | One order on collection / catalog / design |

---

## Gaps

None Required. 2026-10-20 identity **contents** stay; only slot order changes.

---

## Approved scope for this slice

- Product details order: **Category** → **Rate** (Rate per + ₹) → Item / Quality / Size tags.  
- Same order on New/Edit collection, New/Edit catalog, Update this design (non-catalog), Edit design, Add designs shared card + design sheet.  
- Docs + unit (slot order) + functional create chrome.

## Explicitly deferred / rejected

- Changing Who / Apply-all / Order and dispatch position.  
- Putting Description after Rate.  
- Design-sheet (buyer view) tag/rate row — that is browse, not create.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
