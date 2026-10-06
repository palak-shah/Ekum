# Feature Completeness Review — Owner pack select dock copy

**Date:** 2026-10-06  
**Module / ask:** Update existing collection (own viewer + Edit): idle dock stays **Add designs** · **Replace whole collection**. When selection starts, dock is **Delete** · **Remove from this collection**.  
**Anchors:** `docs/features/collections.md`, `2026-10-04-own-pack-manage-dock-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same two jobs as shipped dock; rename Remove so traders hear “this pack only.” |
| UX Designer | Selecting swaps the same sticky band (no extra chrome). Delete first (asked); Remove second. Disabled until a design is picked. |
| Solution Architect | `OwnerPackManageDock` labels + order; no API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Same `BottomTradeDock` swap as idle/select today.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — existing Delete confirm / Remove membership.  
4. **Naming matches the app?** **Remove from this collection** (this pack, not the library). **Delete** stays the severe library action.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Swap on Select / long-press |
| Business rules | OK | Unchanged |
| Workflows | OK | |
| Edge cases | OK | Buttons disabled with zero selected |
| Mobile interactions | OK | Same dock height |
| First glance (BM-11) | OK | Two verbs, no extra row |
| Platform consistency | OK | |

---

## Approved scope

- Selecting dock copy: **Delete** · **Remove from this collection**
- Idle unchanged
- Docs + dock unit

## Explicitly deferred / rejected

- Changing Delete vs Remove API rules
