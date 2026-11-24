# Feature Completeness Review — Home create path

**Date:** 2026-11-24  
**Module / ask:** Own Home always shows New collection / New design when the owner can sell + upload — empty shop and when catalogue exists.  
**Anchors:** `docs/features/home.md`, `docs/features/company.md`, `docs/features/collections.md`  
**Disposition:** Redesign → Proceed

> Completeness keeps Ekum **coherent**. Conflicts with product philosophy → Reject or Redesign.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | New suppliers land on empty Home with no catalogue create — they miss ＋ / You. Create must be on Home when empty and when packs exist. |
| UX Designer | Reuse You quiet create rows (dashed + / accent). Own Home only; visitors unchanged. Empty = create rows + quiet “Nothing published yet,” not fake tiles. |
| Solution Architect | Gate like nav ＋ (`selling && uploads`). Show catalogue foam card when `showOwnerCreate \|\| hasShop`. |

---

## Platform consistency (required)

1. **Existing patterns?** `YouLibraryCreateRow`; nav ＋ create destinations.  
2. **Duplicates?** No — surface create where traders already are.  
3. **Reuse?** Yes.  
4. **Naming?** New collection · New design.  
5. **Units?** N/A.

**Philosophy conflict?** Yes vs older “omit empty catalogue / no force-create” on Home → **Redesign** that lock only for **own** Home create entry.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Empty + non-empty create |
| Business rules | OK | Own Home; selling+uploads |
| Workflows | OK | → `/catalog/collections/new`, `/catalog/products/new` |
| Edge cases | OK | Buy-only / no uploads → hide |
| First glance BM-11 | OK | Quiet rows under catalogue chrome |
| Platform consistency | OK | |

---

## Approved scope

- Docs lock Redesign of empty Home omit for owner create.
- Own Home catalogue card when create-gated or hasShop; New collection + New design rows.
- Units + trader-eye note.

## Explicitly deferred

- Visitor create
- Nav ＋ changes
- New catalog row on Home (You Catalogs tab stays the catalog create home)

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
