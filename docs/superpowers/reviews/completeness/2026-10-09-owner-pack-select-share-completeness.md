# Feature Completeness Review — Owner pack Selecting · Share

**Date:** 2026-10-09  
**Module / ask:** When the owner Selects designs on their album, the manage dock only offers Delete / Remove. Add **Share** for the checked designs (same chat/link sheet as Explore).  
**Anchors:** `docs/features/collections.md`, Explore / Selection Share  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Selecting to send a subset is a real trader job; album ⋯ Share is whole-pack only. |
| UX Designer | Dock order: **Share** · **Remove from this collection** · **Delete** (everyday first, danger last). Reuse CatalogShareSheet. |
| Solution Architect | Wire selected product ids into existing share sheet; ⋯ Share stays album-scoped. |

## Platform consistency

1. Matches Explore / Selection **Share** sheet.  
2. No duplicate flow.  
3. Reuse `CatalogShareSheet`.  
4. Plain **Share**.

**Philosophy conflict?** No.

## Approved scope

- Owner Selecting dock: Share (when ≥1 selected) · Remove · Delete (Delete last when allowed).
- Share opens CatalogShareSheet with those designs (not the whole album).
- ⋯ Share unchanged (whole album).
- After successful share: clear selection / exit Selecting (same as Selection workspace).

## Explicitly deferred

- Visitor Selecting Share (visitor dock stays Order-only).
- Shortening “Remove from this collection” copy.

## Sign-off

Ready for implementation / units on OwnerPackManageDock + CollectionViewer share payload.
