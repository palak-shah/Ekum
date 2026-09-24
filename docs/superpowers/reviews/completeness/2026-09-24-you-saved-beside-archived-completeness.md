# Feature Completeness Review — You: Saved beside Archived

**Date:** 2026-09-24  
**Module / ask:** Move Saved from a peer of Designs / Collections to the status chip rail next to Archived  
**Anchors:** `docs/features/saved.md`, `docs/features/catalog.md`, `docs/features/settings.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Designs / Collections is “your library vs their bookmarks by kind.” Saved is another list under that kind, not a third mode. |
| UX Designer | One chip rail: Published · Draft · Archived · Saved. Same `FilterRail` / `Chip` as catalog. Parent Designs / Collections still picks kind. |
| Solution Architect | Keep `SavedPage` embed. URL `?saved=1` with `?tab=collections` for albums. Accept legacy `?tab=saved`. Do not persist Saved in catalog filter storage. |

---

## Platform consistency (required)

1. **Existing patterns?** Catalog `Chip` + `FilterRail`. Designs / Collections stay the mode pills.  
2. **Duplicates another feature?** No — same Saved references.  
3. **Should reuse an existing workflow?** Yes — embed Saved list; bookmark still lands on You Saved.  
4. **Naming matches the app?** Saved.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Kind follows Designs / Collections |
| Business rules | OK | Saved ≠ own archive |
| Workflows | OK | Bookmark → You Saved chip |
| Edge cases | OK | Legacy `tab=saved`; buyers keep inner Designs / Collections |
| Permissions | N/A | |
| User states | OK | Buyers: Saved only (no status chips) |
| Notifications | N/A | |
| Error handling | OK | Existing Saved error |
| Scalability | N/A | |
| Mobile interactions | OK | No extra sticky chrome |
| Accessibility | OK | Chip + existing testid |
| Platform consistency | OK | |

---

## Approved scope for this slice

- You library: Designs / Collections; chips Published / Draft / Archived / Saved.
- Saved designs when Designs + Saved; Saved collections when Collections + Saved.
- Buyers without a library: Saved list with inner Designs / Collections (no fake archive chips).
- Deep links: `/more?saved=1`, `/more?tab=collections&saved=1`; `/saved` and old `?tab=saved` still land correctly.

## Explicitly deferred / rejected

- Mixing Saved rows into Published / Draft / Archived lists.

## Sign-off

Required gaps closed: Yes. Ready: Yes.
