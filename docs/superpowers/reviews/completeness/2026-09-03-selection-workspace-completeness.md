# Feature Completeness Review — Selection workspace

**Date:** 2026-09-03  
**Module / ask:** Cart-like **Your selection** home (not named Cart); multi-surface pick; survive logout; empty on Clear / action done; unavailable rows stay faded with reason  
**Anchors:** `docs/features/explore.md`, `docs/features/saved.md`, `docs/features/catalog.md`, explore-select-preserve-types  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One traveling Selection for designs + collections from Explore, Saved, company, curated albums, My designs/collections. Trade verbs live on `/selection`, not browse docks. |
| UX Designer | Floater **N selected · View selection**; Explore header badge; `/selection` list with ×; faded unavailable + reason (never silent drop). My Catalog Publish dock stays. |
| Solution Architect | Keep dual session stores; stop logout wipe; revalidate via explore/own catalog GETs; shared action host on Selection page. |

---

## Platform consistency

1. **Existing patterns?** Yes — Saved header control, sticky docks above nav, SelectAllFloat, Order resolve / Curate / Share sheets.  
2. **Duplicates?** No second store; Selection ≠ Saved.  
3. **Reuse?** Same shortlist + album pick; relocate Explore AlbumSelectBar verbs to `/selection`.  
4. **Naming?** **Your selection** / **N selected** — never Cart/Basket.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Home + floater + multi-source |
| Business rules | OK | Types preserved; empty on Clear/success |
| Workflows | OK | Pick anywhere → act on `/selection` |
| Edge cases | OK | Unavailable fade + reason |
| Permissions | OK | Curate still Trading-gated |
| Mobile / BM-07 | OK | Selection sticky bar + content padding |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Curate with selected collections only

| Field | Content |
|-------|---------|
| Gap | Curate remains designs-only (prior explore-select review). |
| Recommendation | Toast when albums-only; do not expand for Curate. |
| Priority | Deferred (document only) |

---

## Approved scope

- Route `/selection` **Your selection**; Explore header Selection badge; AppShell floater when count > 0.
- Sources: Explore, Saved designs **and** collections, company, album viewer; My designs via **To selection** (published only — **not** auto-mirror).
- Remove verb docks from Explore `AlbumSelectBar` and Saved/company/album `BrowseSelectBar`.
- Survive logout; empty on Clear or successful Order/Curate/Bookmark/Share.
- Stale rows: keep, fade, show reason; actions use available subset.

## Explicitly deferred

- Server-backed Selection; Cart naming; collection-as-pack; Curate album expand

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
