# Feature Completeness Review — Restore You Designs trailing +

**Date:** 2026-10-24  
**Module / ask:** Restore the trailing **＋** on You → **Designs**. Opens existing Add designs (`/catalog/products/new`). Not Collections / Catalogs. Not bottom-nav **＋**.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, Completeness 2026-10-23-you-designs-add-plus, Completeness 2026-10-23-my-collections-general-catalog  
**Disposition:** Proceed (Redesign of my-collections “no standalone Designs ＋”)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders asked for the Designs **＋** back. Library add belongs on Designs. Unassigned new designs now sit in **General Collection**, so this is not an orphan path. Nav **＋** stays Collection / Orders. |
| UX Designer | Same 40×40 kit square as Orders **＋**. Right of Collections · Catalogs · Designs. Hide while Selecting or Bookmark. Empty published / draft: **Add designs**. |
| Solution Architect | Route and `DesignBatchPage` already exist. Gate tap with `can('uploads')` + `CREATE_FAB_EXPLAIN`. Computed GC membership picks up unassigned designs. |

---

## Platform consistency (required)

1. **Existing patterns?** Orders trailing `ListSquareButton` + `PlusIcon`.  
2. **Duplicates another feature?** Collection Photos still create designs. Designs **＋** is the library door; nav **＋** stays packs. 2026-09-25 kept You Add.  
3. **Should reuse an existing workflow?** Yes — `DesignBatchPage`.  
4. **Naming matches the app?** **Add designs**.  
5. **Units?** N/A.

**Philosophy conflict?** Yes vs my-collections “no standalone Designs ＋” and 2026-10-22-designs-via-collection-only — **Redesign** those lines. Restore 2026-10-23-you-designs-add-plus. General Collection is now the unassigned home, so the earlier “orphan design” objection no longer holds.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Tab **＋** → `/catalog/products/new` |
| Business rules | OK | Unassigned → General Collection; upload cap toast |
| Workflows | OK | Collections / Catalogs still **New collection** / **New catalog** |
| Edge cases | OK | Hide on Bookmark / selecting |
| Permissions | OK | `can('uploads')` |
| User states | OK | Empty published / draft **Add designs** |
| Notifications | N/A | |
| Error handling | OK | Why-line toast |
| Scalability | N/A | |
| Mobile interactions | OK | Tab row, not a sticky that clips (BM-07 N/A) |
| First glance (BM-11) | OK | **＋** at the right on Designs only |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | `aria-label="Add designs"` |
| Platform consistency | OK | Kit square, not a one-off filled FAB |

---

## Gaps

### G-001 — Docs still say Designs has no +

| Field | Content |
|-------|---------|
| Gap | catalog / collections / settings / gap matrix still lock “no trailing ＋” |
| Why it matters | Traders cannot add from the Designs tab |
| Impact if ignored | `/catalog/products/new` stays an unlinked deep link |
| Recommendation | Trailing **＋** + empty **Add designs**; lock feature docs |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Designs tab row: `ListSquareButton` **＋** → Add designs.  
- Empty published / draft: **Add designs**.  
- No nav **＋** Add designs. Collections / Catalogs rows unchanged.

## Explicitly deferred / rejected

- Add designs on bottom-nav **＋**.  
- Trailing **＋** on Collections or Catalogs (already **New collection** / **New catalog**).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
