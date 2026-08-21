# Feature Completeness Review — Select all float

**Date:** 2026-08-21  
**Module / ask:** Move Select all / Clear into a floating row the moment select mode starts (not under the last tile)  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/saved.md`, `docs/features/catalog.md`, `docs/features/chat.md`, `docs/superpowers/specs/2026-08-21-select-all-float-design.md`  
**Disposition:** Proceed

> Chrome fix for an existing select job. Does not add a new trade path.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders already know Select / long-press → Order / Curate. They cannot find Select all after they have already selected. Fix visibility; do not add a second select model. |
| UX Designer | One kit float under existing sticky chrome. Header stays (Save / Share / Grid / search). Bottom dock = verbs only. Explore has no Select all (endless feed). Match accent text already used for Clear. |
| Solution Architect | Shared `SelectAllFloat` + `selectAllState(visibleIds, selectedIds)`. Page-local ids only — traveling shortlist rules unchanged. No API. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Select / long-press, traveling shortlist, bottom verbs, accent text actions. Float is the same job as today’s Select all, moved into the viewport.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — same shortlist / catalog / chat select sets.  
4. **Naming matches the app?** **Select all** / **Clear** / `N selected`. No “Select all on this album.”

**Philosophy conflict?** No. Rejected: Select all on Explore; replacing the page header; a second stacked header row.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Select all / Clear page-local; Cancel per surface unchanged |
| Business rules | OK | Does not wipe off-screen shortlist members |
| Workflows | OK | Order / Curate / Share / Publish / Forward unchanged |
| Edge cases | OK | Empty list hides float; 0 selected still shows Select all; mixed Saved albums not in the id set |
| Permissions | N/A | Same who-may-select as today |
| User states | OK | Select mode on/off; all / some / none of this list |
| Notifications | N/A | |
| Error handling | N/A | No new network |
| Scalability | OK | Explore excluded (endless) |
| Mobile interactions | OK | BM-07: pad top for float + bottom for nav + dock; verify with select mode on |
| Accessibility | OK | Float buttons need names; count is text |
| Platform consistency | OK | One kit; asked before inventing float vs header-replace |

---

## Gaps

### G-001 — First / last tile clipped under float + dock

| Field | Content |
|-------|---------|
| Gap | New top chrome plus existing bottom dock |
| Why it matters | BM-07 — clipped tile is a blocking bug |
| Impact if ignored | Last design sliced; Select all covers first row |
| Recommendation | Measure float under header; pad scroll body both ends; check album + My Catalog + chat on mobile viewport with selection > 0 |
| Priority | Required before implementation |

### G-002 — Explore “Select all” temptation

| Field | Content |
|-------|---------|
| Gap | Users may expect the same float on Explore |
| Why it matters | Endless mixed posts — “all” is undefined |
| Impact if ignored | Accidental mass-select / product confusion |
| Recommendation | No float on Explore; dock Clear stays. Deferred unless we later define a bounded “this page of results” |
| Priority | Future improvement (explicitly out of slice) |

### G-003 — Photo viewer (point 6)

| Field | Content |
|-------|---------|
| Gap | Tap photo → WhatsApp-style zoom viewer |
| Why it matters | Separate user ask |
| Impact if ignored | None for this slice |
| Recommendation | Own Completeness + spec after this ships |
| Priority | Future improvement |

---

## Approved scope for this slice

- Kit float + `selectAllState` on: album, Saved (designs), shop Designs, My Catalog (current filter), chat forward-select.
- Bottom dock: verbs only (except Explore **Clear**).
- Remove under-grid **Select all on this album**.
- Docs: `collections.md` / `saved.md` / `catalog.md` / `chat.md` select chrome lines at implement time.
- Unit + web coverage for state + “visible as soon as select starts.”

## Explicitly deferred / rejected

- Select all / float on Explore  
- Header-replace select chrome  
- Points 2–4, 6, 7  
- Changing traveling-shortlist lifetime or Order / Curate rules  

## Sign-off

Required gaps closed or deferred in writing: Yes (G-001 in implement; G-002/003 deferred)  
Ready for implementation / `@functional` journeys: Yes — after spec review + plan  
