# Feature Completeness Review — Explore feed virtual scroll + easy image load

**Date:** 2026-10-04  
**Module / ask:** Easy loading for feed images + virtual scroll; stop API hang when Explore / Home open large feeds.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. This is performance of the existing buying feed — not a new surface. Unbounded `findMany` + mounting every card’s full images hangs the Nest media process; fix query windows + windowed DOM + deferred image src.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need Explore to open fast with seeded packs. Spec already says **12 posts then More posts** — restore that so shelves stay reachable. |
| UX Designer | Same cards/kit; virtualization must not change chrome or selection. Lazy images keep placeholders (foam/initial) until near viewport. |
| Solution Architect | Cap ranking windows on `feed` / `collections` (still cursor-page). Stream local media instead of buffering whole files. Client: window virtualizer + intersection-deferred `CoverImage` src. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Opportunity cards, CoverImage, Explore home sections, cursor pages.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Reuse `/explore/home` + documented More posts; do not invent a second feed API.  
4. **Naming matches the app?** **More posts** (existing copy in explore.md / demo checklist).

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same ranked posts; windowed render |
| Business rules | OK | Ranking window approximate at scale (documented) |
| Workflows | OK | Select / follow / story filter unchanged |
| Edge cases | OK | Empty / story filter / selling buyers list |
| Permissions | N/A | |
| User states | OK | Loading / error / empty unchanged |
| Notifications | N/A | |
| Error handling | OK | Image miss keeps foam; API errors unchanged |
| Scalability | Gap→fix | Unbounded findMany + buffered media GETs |
| Mobile interactions | OK | Window scroll virtualizer; BM-07 padding unchanged |
| First glance (BM-11) | OK | Required trader-eye on phone width |
| Accessibility | OK | Virtual rows stay in accessibility tree via measure |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Unbounded Explore `feed` / `collections` loads

| Field | Content |
|-------|---------|
| Gap | Non-following (and following) `feed` / `collections` load **all** rows then page in memory |
| Why it matters | Home + Explore home hang Nest / Postgres under seed |
| Impact if ignored | Server “gets hanged” as reported |
| Recommendation | Ranking-window `take` then existing `pageMerged` |
| Priority | Required before implementation |

### G-002 — Feed mounts every image at once

| Field | Content |
|-------|---------|
| Gap | All cards in DOM; `loading=lazy` still queues many `/media` GETs; local media `readFile`s whole files |
| Why it matters | API event loop flooded while scrolling nowhere |
| Impact if ignored | UI jank + API hang even after query caps |
| Recommendation | Virtual list + defer src until near viewport; stream media |
| Priority | Required before implementation |

### G-003 — Missing More posts cap (spec drift)

| Field | Content |
|-------|---------|
| Gap | explore.md says 12 then More posts; UI shows full home payload |
| Why it matters | Discovery shelves / long scroll; worse image storm |
| Impact if ignored | Spec + demo checklist wrong |
| Recommendation | Restore initial 12 + More posts |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Cap Explore `feed` / `collections` DB takes with a ranking window
- Stream local `/media` GETs (no full-file buffer)
- Virtualize Explore mixed / collections / designs feed lists
- Easy image load: defer `CoverImage` src until near viewport (+ `decoding=async`)
- Restore **12 posts → More posts**
- Docs + units; BM-11 glance

## Explicitly deferred / rejected

- Real pixel thumbnail pipeline / CDN transforms (URL `_thumb` convention stays; no force without files)
- Infinite `/explore/home` cursor API (home stays sectioned; window + More posts)
- Virtualizing Home opportunity rows (smaller; feed API cap covers hang)
- Changing Explore ranking semantics beyond window approximation

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
