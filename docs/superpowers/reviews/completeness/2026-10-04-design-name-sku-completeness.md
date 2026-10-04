# Feature Completeness Review — design name from SKU

**Date:** 2026-10-04  
**Module / ask:** When adding a design with no typed name, persist the SKU as the name (You → Add already does; collection photos and API create should match).  
**Anchors:** `docs/features/catalog.md`, `docs/features/collections.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders often skip naming; SKU is already on the thumb — use it so tiles are never blank / filename junk. |
| UX Designer | Typed name wins. Blank → `EK-…`. No second field. |
| Solution Architect | API create fills name from resolved SKU; clients send identity when blank. |

## Platform consistency (required)

1. **Existing patterns?** Yes — You → Add `createProductIdentity`.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — same helper as batch add.  
4. **Naming matches the app?** Yes — Reference / SKU language.

**Philosophy conflict?** No.

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Create blank name → SKU name |
| Business rules | OK | Typed wins; SKU immutable once set |
| Workflows | OK | Batch, pack new photos, upload/edit save |
| Edge cases | OK | Whitespace = blank |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | SKU_TAKEN unchanged |
| Scalability | N/A | |
| Mobile / chrome | N/A | |
| First glance (BM-11) | OK | Tile shows EK-… not IMG_1234 |
| Accessibility | OK | |
| Platform consistency | OK | |

## Approved scope for this slice

- Optional create `name` on API; fill from SKU.
- Collection pending photos: uniqueDraftSku; blank → identity on POST.
- ProductEditor: allow empty Name; payload uses SKU.

## Explicitly deferred / rejected

- Renaming existing filename-named designs.
- Pack title (**Name this pack**).

## Disposition rationale

Aligns all add paths with the already-shipped You → Add rule.
