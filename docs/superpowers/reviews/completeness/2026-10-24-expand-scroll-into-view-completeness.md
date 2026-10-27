# Feature Completeness Review — Expand scroll into view

**Date:** 2026-10-24  
**Module / ask:** Opening an in-place accordion (Who, Order and dispatch, album change, Show details) must bring the opened block into view so the trader does not scroll to operate it.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | They opened it to use it. Hunting under Create & Publish is a failed job. |
| UX Designer | Instant `nearest` scroll — no extra motion. Stop above the dock (BM-07). Overlay ⋯ already visible. |
| Solution Architect | One hook on CollectionExpandableSection; same helper on album-change + Show details. Scroll lives in phone `main`. |

---

## Platform consistency (required)

1. **Existing patterns?** Sheet keyboard `scrollIntoView`; phone-column scroll.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Shared expander, not per-page.  
4. **Naming matches the app?** N/A (no new copy).  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Open → reveal |
| Business rules | N/A | |
| Workflows | OK | Create/edit collection, catalog, design |
| Edge cases | OK | Already visible = no-op; close does not scroll |
| Mobile interactions | OK | scroll-margin for header + dock |
| First glance (BM-11) | OK | Instant, not a page-rise |
| Units | N/A | |
| Accessibility | OK | Same toggle; content on screen |

---

## Gaps

### G-001 — Accordion grows under the dock

| Field | Content |
|-------|---------|
| Gap | CollectionExpandableSection does not scroll on open. |
| Why it matters | Order and dispatch fields sit under Create / Update. |
| Recommendation | `useScrollWhenOpened` + scroll-margin matching the dock. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- CollectionExpandableSection (Who, Order and dispatch) auto-reveals on open.  
- Album-change grid and Show details use the same helper.

## Explicitly deferred / rejected

- Overlay ⋯ / filter / Sheet / native select.  
- Order timeline, chat mention, Find field.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
