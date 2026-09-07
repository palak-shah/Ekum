# Feature Completeness Review — Selection own-catalog handoff

**Date:** 2026-09-04  
**Module / ask:** My designs Selecting = lifecycle only; **To selection** handoff (published only); Chats-list chip; no auto-mirror into traveling Selection  
**Anchors:** `docs/features/catalog.md`, `docs/features/explore.md`, prior Selection workspace completeness  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Dual docks on My designs confuse traders. One job: lifecycle on My designs; trade verbs on Your selection after explicit handoff. |
| UX Designer | Single lifecycle dock + quiet **To selection**. Floater chip on Chats list; hide on thread and `/catalog`. Draft/archived toast on traveling Selection. |
| Solution Architect | Stop mirroring catalog local select into session stores; partition published on handoff; gate album-viewer toggles when status known. |

---

## Platform consistency

1. **Existing patterns?** Yes — sticky dock above nav, toast on skip, Selection chip language.  
2. **Duplicates?** No — removes dual-system confusion.  
3. **Reuse?** Same shortlist/album stores; verbs stay on `/selection`.  
4. **Naming?** **To selection** / **Your selection** — plain trader words.

**Philosophy conflict?** No. Private “never Explore” publish deferred — use Selected/Connections audience.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Handoff + lifecycle dock |
| Business rules | OK | Published-only traveling Selection |
| Workflows | OK | My designs → To selection → Order/Curate/… |
| Edge cases | OK | Toast when all drafts/archived |
| Mobile / BM-07 | OK | One dock row; floater not on catalog/thread |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Curate collections expand (unchanged)

Deferred from prior review.

### G-002 — Saved list has no status field

| Field | Content |
|-------|---------|
| Gap | Saved rows cannot toast at pick time for draft/archived; Selection home fades + reason after resolve. |
| Recommendation | Accept for this slice; optional status on Saved API later. |
| Priority | Future improvement |

---

## Approved scope

- My designs Selecting: Publish / Hide · draft / Archive / Restore + **To selection** only.  
- No auto-mirror of local catalog picks into traveling Selection.  
- **To selection** copies published only; toast otherwise; navigate `/selection`.  
- Floater: show Chats list; hide thread; hide `/catalog`.  
- Explore/shop remain published feeds; album viewer gates by product status when known.

## Explicitly deferred

- Dual Publish+Order docks; private never-Explore status; Curate album expand

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
