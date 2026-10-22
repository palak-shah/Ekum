# Feature Completeness Review — Collection member Order and dispatch accordion

**Date:** 2026-10-20  
**Module / ask:** **Update this design** on a collection: **Order and dispatch** collapsed accordion, same as New collection. Open only if needed.  
**Anchors:** `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Member sheet is name / tags / rate. Sell-as is occasional — same as the pack. |
| UX Designer | Reuse `OrderDispatchAccordion`. Starts collapsed. No extra heading. |
| Solution Architect | Same component as pack + Add/Edit design. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Collection + Add/Edit design accordion.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes.  
4. **Naming matches the app?** Order and dispatch.

**Philosophy conflict?** No. Earlier deferral (“member sheet stays open”) fights “one job”; reopen as Proceed.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Collapsed until opened |
| Business rules | N/A | |
| Workflows | OK | Tap design on New collection / album |
| Edge cases | OK | Re-open sheet starts collapsed |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No extra sticky bar (BM-07) |
| First glance (BM-11) | OK | Tags/rate stay the job |
| Accessibility | OK | aria-expanded |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Collection member **Update this design**: collapsed Order and dispatch accordion (same component).  
- Catalog settings stay always-open (that screen’s job is defaults).  
- Docs + e2e + trader-eye.

## Explicitly deferred / rejected

- Accordion on Catalog defaults.

---

## Decision

**Proceed.**
