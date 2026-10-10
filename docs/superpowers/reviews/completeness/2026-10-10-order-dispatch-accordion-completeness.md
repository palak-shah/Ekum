# Feature Completeness Review — Order and dispatch accordion

**Date:** 2026-10-10  
**Module / ask:** Collapse Order and dispatch on collection create/edit so the form is not overwhelming.  
**Anchors:** `docs/features/collections.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Unit / contains / dispatch / MOQ are secondary for most sellers. Defaults still apply when collapsed. Power users expand. |
| UX Designer | Same expandable chrome as **Who can see this?** Default closed. Quiet summary when collapsed. |
| Solution Architect | Reuse `CollectionExpandableSection`. Only wrap pack `identityFields` on `CollectionEditorPage`. No change to design sheet or Catalog defaults. |

## Platform consistency

1. Matches Who expandable.  
2. No second accordion pattern.  
3. Reuse `OrderDispatchFields` with `hideHeading`.  
4. Naming unchanged.

**Philosophy conflict?** No — fewer defaults loud on create.

## Approved scope

- Collection create/edit pack Order and dispatch collapsed by default.  
- Summary helper + unit tests.  
- Docs / gap matrix.

## Explicitly deferred

- Accordion on design member sheet or Catalog defaults.
