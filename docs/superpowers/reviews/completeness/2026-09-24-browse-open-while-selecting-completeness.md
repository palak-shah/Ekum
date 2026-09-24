# Feature Completeness Review — Open collection / design while Selecting

**Date:** 2026-09-24  
**Module / ask:** Selecting must not block opening a collection or a design (more photos). Same on Explore, shop, album, Saved.  
**Anchors:** `docs/features/explore.md`, `docs/features/company.md`, `docs/features/collections.md`, `docs/features/saved.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traveling pile stays one pile. Opening is look; Selecting is pick. Traders need both in one browse. |
| UX Designer | Reuse shop Collections: mosaic / photo toggles while Selecting; **name always opens**. Long-press photo still starts select. No extra chrome, no checkboxes. |
| Solution Architect | Split title vs media click on existing cards. Album page select stays page-local. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Shop collection cell already: mosaic = select when Selecting, name = open. Explore cards already have media + title rows — title currently reuses the toggle handler.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — shop Collections split.  
4. **Naming matches the app?** Select / Selecting; open collection / design.

**Philosophy conflict?** No. One job per *tap target*, not one job for the whole card.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Photo toggle + name open |
| Business rules | OK | Types in pile unchanged |
| Workflows | OK | Long-press → select; name → open |
| Edge cases | OK | Ghost click after long-press still suppressed on media |
| Permissions | N/A | |
| User states | OK | Idle tap on photo still opens |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky chrome |
| Accessibility | OK | Name is a link / open control |
| Platform consistency | OK | Same split on Explore, shop designs, album, Saved |

---

## Approved scope for this slice

- Explore collection / design cards: media tap toggles while Selecting; **name always opens**.  
- Shop design cells: same as shop collections (name → design page).  
- Album viewer: name / title opens the design sheet (more photos); photo toggles while this album is Selecting.  
- Saved feed + grid: same split.  
- Docs + unit + Explore functional: after select, name still opens.

## Explicitly deferred / rejected

- Separate Open / Select buttons on the mosaic.  
- Native checkboxes on tiles.

## Sign-off

Required gaps closed: Yes. Ready: Yes.
