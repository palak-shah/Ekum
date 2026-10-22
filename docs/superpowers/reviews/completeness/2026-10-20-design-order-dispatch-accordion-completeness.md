# Feature Completeness Review — Design Order and dispatch accordion

**Date:** 2026-10-20  
**Module / ask:** Add/Edit design: **Order and dispatch** collapsed accordion like New collection. **1 set contains** keeps **n** and **pc** together (not at opposite ends of the row).  
**Anchors:** `docs/features/catalog.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Sell-as is occasional. Same collapsed job as the pack. Show details stays SKU + notes. |
| UX Designer | Reuse `CollectionExpandableSection`. Contains field: number + unit as one caption on the left (Rate’s ₹ hug), not `flex-1` shoving **pc** to the right. |
| Solution Architect | Shared `OrderDispatchAccordion` + existing `OrderDispatchFields`. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Collection Order and dispatch accordion + kit field.  
2. **Duplicates another feature?** No — same control, now on add design.  
3. **Should reuse an existing workflow?** Yes.  
4. **Naming matches the app?** Order and dispatch · 1 set contains.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Collapsed until opened; summary when set |
| Business rules | N/A | Values unchanged |
| Workflows | OK | You → Add, Edit design |
| Edge cases | OK | Empty summary is just `set` |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Accordion not a second sticky bar (BM-07) |
| First glance (BM-11) | OK | Tags/Rate stay the job; Order and dispatch quiet |
| Accessibility | OK | aria-expanded toggle |
| Platform consistency | OK | Same accordion as collection |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Add/Edit design and Add designs batch: collapsed **Order and dispatch** accordion (same as collection).  
- Show details = SKU + notes only.  
- Contains control: number + unit clustered (`4 pcs`), not full-row split.  
- Units + trader-eye.

## Explicitly deferred / rejected

- Accordion on Catalog settings / collection member sheet.  
- Changing pack size rules.

---

## Decision

**Proceed.**
