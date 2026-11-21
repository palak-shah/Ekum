# Feature Completeness Review — Remove Post / Remove Repost availability

**Date:** 2026-11-21  
**Module / ask:** Remove my repost (Explore Edit); lineage-safe soft-unavailable; mixed member eligibility  
**Anchors:** `docs/features/collections.md`, `docs/features/explore.md`  
**Disposition:** Proceed

> Incremental change. Redesign only of P1 **pack omit** for mixed collections (member-level eligibility). Reuse soft-unavailable + immediate-source lineage. No cascade delete. No Delete on Explore.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Three distinct actions: Remove original (album/You Hide Draft), Stop allowing (`allowForward` OFF), Remove my repost (Explore Edit → Draft that child). Orders untouched. Remove → republish must not bump Explore rank. |
| UX Designer | Remove repost on shared RepostSheet Edit only (not Edit post). Confirm: visibility stops; orders unchanged. No Delete on Explore. Mixed packs must show honest remaining counts/rates/thumbs. Unavailable = existing shell, not Ask. |
| Solution Architect | Soft derived on read. Preserve `exploreActivityAt` on Remove-repost Draft; skip publish bump when stamp kept. Mixed: synced unavailable when chain soft; local stay; sticky exclude authoritative. Fail closed incomplete/cyclic. |

---

## Platform consistency

1. **Existing patterns?** Yes — RepostSheet + soft-unavailable + unpublish.  
2. **Duplicates?** No — not album Delete.  
3. **Reuse?** Yes — `setStatus` Draft / publish; `repost-availability`.  
4. **Naming?** Remove repost; Hide Draft elsewhere.  
5. **Units?** N/A for action; rate bands recomputed from eligible members only.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Remove + mixed eligibility |
| Business rules | OK | Three actions; rank lock; sticky exclude |
| Workflows | OK | Edit repost → Remove → confirm |
| Edge cases | OK | Sibling mesh; restore; cyclic |
| Permissions | OK | No weaken forward/pricing |
| Mobile / BM-07 | OK | Existing sheet |
| First glance BM-11 | OK | Honest remaining chrome |
| Units | N/A | Eligible-only rate band |
| Platform consistency | OK | |

---

## Gaps

### G-001 — P1 whole-pack omit hides local designs

| Field | Content |
|-------|---------|
| Gap | Upstream soft currently omits entire descendant pack |
| Recommendation | Member-eligible omit; honest chrome from remaining members |
| Priority | Required — Redesign of pack omit only |

Deferred: album/You Hide Draft rank behavior (still nulls activity).

---

## Approved scope

- Completeness + docs lock.  
- Member eligibility helpers; pack omit when zero eligible; incomplete/cyclic omit.  
- Surface wire + honest remaining chrome.  
- Remove repost UI + Draft preserving `exploreActivityAt`; republish no bump.  
- Tests per plan matrix.

## Explicitly deferred / rejected

- Delete/Archive on Explore.  
- Remove on Edit post.  
- Changing album/You Hide Draft rank.  
- Schema / cascade Archive of descendants.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
