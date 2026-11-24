# Feature Completeness Review — Home create under each catalogue tab

**Date:** 2026-11-24  
**Module / ask:** Own Home create is tab-scoped — New collection on Collections, New design on Designs (not both above tabs). Empty shop still shows both tabs.  
**Anchors:** `docs/features/home.md`, `docs/features/company.md`; prior `2026-11-24-home-create-path-completeness`  
**Disposition:** Redesign → Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Both create rows above tabs duplicates You’s tab-scoped create and crowds empty Home. |
| UX Designer | Match You: one `YouLibraryCreateRow` in the active tab body. Rejected ＋-on-tab-rail + sheet (extra hop, invents chrome). |
| Solution Architect | Same gate; always render tab chrome when `showOwnerCreate \|\| hasShop`. |

---

## Platform consistency

1. **Patterns?** You library create rows under each tab.  
2. **Duplicates?** No.  
3. **Reuse?** `YouLibraryCreateRow`.  
4. **Naming?** New collection · New design.  
5. **Units?** N/A.

**Philosophy conflict?** Soft Redesign of “both rows above tabs” from same-day home-create-path — keep own-Home create; change placement only.

---

## Approved scope

- Docs: create under Collections / Designs respectively; empty → tabs + per-tab create + quiet empty line.
- UI + units: per-tab visibility; visitor unchanged.

## Deferred

- ＋ beside tabs / chooser sheet  
- Catalog create on Home  

## Sign-off

Ready for implementation: Yes  
