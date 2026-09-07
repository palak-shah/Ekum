# Feature Completeness Review — Uniform album chrome + find My designs

**Date:** 2026-09-03  
**Module / ask:** Thin Collection viewer action row; train one action language; make seller My designs findable without a Catalog tab  
**Anchors:** `docs/features/collections.md`, `docs/features/catalog.md`, `docs/features/settings.md`, ui-quality-bar  
**Disposition:** Redesign → Proceed

> Five equal header pills fight one-job / tight chrome. Library under You is correct IA; entries from ＋ and Home were too quiet.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One muscle memory: long-press to select → Select all + Clear float; one primary + ⋯; trade on dock; library via You / ＋ / Home. |
| UX Designer | Match editor/thread ⋯; Explore dock Share. No new bottom tab. |
| Solution Architect | UI-only; reuse BrowseSelectBar / CatalogShareSheet / PageHeader patterns. |

---

## Platform consistency (required)

1. **Existing patterns?** Long-press select (Explore), Edit/Open pill, MoreHorizontal ⋯, sticky dock + Select all/Clear float.  
2. **Duplicates?** No.  
3. **Reuse?** AlbumSelectBar Share language on collection dock.  
4. **Naming?** My designs; Bookmark / Share / Edit / Select / Feed·Grid.

**Philosophy conflict?** No (lists stay under You). Conflict was chrome density → Redesign of chrome only.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Header + find entries |
| Business rules | OK | No tab; Forward/share unchanged |
| Workflows | OK | Kavita finds /catalog |
| Edge cases | OK | Owner Bookmark in ⋯ |
| Permissions | OK | Edit owner-only |
| Mobile interactions | OK | BM-07 dock unchanged |
| Platform consistency | OK | After thin header |

---

## Gaps

### G-001 — Five equal album pills

| Field | Content |
|-------|---------|
| Gap | Bookmark · Share · Edit · Select · Feed crowded. |
| Recommendation | Select + Edit\|Bookmark + ⋯. Closed in this slice. |
| Priority | Required |

### G-002 — Seller cannot find library

| Field | Content |
|-------|---------|
| Gap | ＋ only creates; Home only “Add designs”; You label quiet. |
| Recommendation | ＋ / Home / You → My designs. Closed in this slice. |
| Priority | Required |

---

## Approved scope

- Collection viewer header language + ⋯ + dock Share.
- ＋ My designs; You why-line; Home seller → `/catalog`.
- Docs + gap matrix.

## Explicitly deferred

- Explore / Saved / Order chrome rewrite.
- Catalog bottom tab.
- Broadcast removal.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
