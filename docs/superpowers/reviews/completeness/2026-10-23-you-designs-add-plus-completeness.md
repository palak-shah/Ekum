# Feature Completeness Review — You Designs trailing +

**Date:** 2026-10-23  
**Module / ask:** Restore a trailing kit **+** on You → **Designs** (right of the tab row). Opens existing Add designs (`/catalog/products/new`). Not Collections. Not bottom-nav **+**.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, Completeness 2026-09-25-nav-plus-no-add-designs  
**Disposition:** Proceed (Redesign vs catalog “no + on Designs”)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Library add belongs on Designs. Nav **+** stays pack / Orders. Empty Designs must not only say “create a collection.” |
| UX Designer | Same 40×40 square as Orders **+**. Right of Designs / Collections tabs. Hide while selecting. |
| Solution Architect | Route already exists. Gate with `can('uploads')` + `CREATE_FAB_EXPLAIN`. |

---

## Platform consistency (required)

1. **Existing patterns?** Orders trailing `ListSquareButton` + `PlusIcon`.  
2. **Duplicates another feature?** No — nav **+** is collection / Orders. 2026-09-25 kept You Add.  
3. **Should reuse an existing workflow?** Yes — `DesignBatchPage`.  
4. **Naming matches the app?** **Add designs**.  
5. **Units?** N/A.

**Philosophy conflict?** Yes vs later catalog “no + on Designs” — **Redesign** that line; restore the 2026-09-25 library door.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Tab **+** → `/catalog/products/new` |
| Business rules | OK | Upload cap toast |
| Workflows | OK | Collections still **New collection** row |
| Edge cases | OK | Hide on Saved / selecting |
| Permissions | OK | `can('uploads')` |
| User states | OK | Empty published / draft **Add designs** |
| Notifications | N/A | |
| Error handling | OK | Why-line toast |
| Scalability | N/A | |
| Mobile interactions | OK | Tab row, not a sticky that clips (BM-07 N/A) |
| First glance (BM-11) | OK | **+** at the right on Designs only |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | `aria-label="Add designs"` |
| Platform consistency | OK | Kit square, not a one-off |

---

## Gaps

### G-001 — Catalog said Designs has no +

| Field | Content |
|-------|---------|
| Gap | Docs and empty copy pointed only at New collection |
| Why it matters | Traders cannot add a solo design from the library tab |
| Impact if ignored | `/catalog/products/new` stays an unlinked deep link |
| Recommendation | Trailing **+** + empty **Add designs**; lock catalog.md |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Designs tab row: `ListSquareButton` **+** → Add designs.  
- Empty published / draft: **Add designs**.  
- No nav **+** Add designs. Collections row unchanged.

## Explicitly deferred / rejected

- Add designs on bottom-nav **+**.  
- Trailing **+** on Collections (already **New collection**).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
