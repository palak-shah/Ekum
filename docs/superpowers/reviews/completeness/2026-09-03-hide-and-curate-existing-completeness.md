# Feature Completeness Review — Hide · draft dock + Curate add-to-existing

**Date:** 2026-09-03  
**Module / ask:** My designs select dock **Hide · draft** for published items; Curate sheet **Add to existing pack**  
**Anchors:** `docs/features/catalog.md`, `docs/features/collections.md`, `docs/features/saved.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Both behaviours were already locked in feature docs; UI never shipped them. No philosophy change.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Published → Hide (back to draft) is the soft exit; Archive ends the season. Curate must grow an existing pack without forcing a new album. |
| UX Designer | Dock label **Hide · draft** (user lock). Curate keeps New form + quiet **Add to existing pack** (not New\|Existing pills). Pack list: accent-border rows. |
| Solution Architect | Reuse `POST …/unpublish` and `PUT …/products` (client union). No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** My designs select dock; CurateFromSelectionSheet; ConnectionPicker-style rows.  
2. **Duplicates?** No — editor ⋯ already has Hide; this is the bulk / Curate path.  
3. **Reuse?** Same unpublish + setProducts endpoints as single-item flows.  
4. **Naming?** Hide · draft on dock; toast **Added to …** for merge.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hide published; merge into owned draft/published |
| Business rules | OK | Ceiling on PUT; archived albums excluded from picker |
| Workflows | OK | Draft → editor; Published → toast stay put |
| Edge cases | OK | No owned albums → stay on New; mixed select dock |
| Permissions | OK | uploads / owned collections |
| Notifications | N/A | |
| Error handling | OK | Partial bulk failure toasts |
| Scalability | OK | List from GET /collections |
| Mobile interactions | OK | BM-07 existing dock pad |
| Accessibility | OK | Back + tappable rows |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Select dock missing Hide

| Field | Content |
|-------|---------|
| Gap | Only Archive / Publish / Restore on multi-select. |
| Recommendation | **Hide · draft N** for Published. Closed in this slice. |
| Priority | Required |

### G-002 — Curate Existing not in sheet

| Field | Content |
|-------|---------|
| Gap | Sheet only creates new packs. |
| Recommendation | Quiet link → owned list → merge. Closed in this slice. |
| Priority | Required |

---

## Approved scope

- My designs Designs + Collections: bulk Hide · draft.
- CurateFromSelectionSheet: Add to existing pack (drafts first, then published).
- Docs + gap matrix + units.

## Explicitly deferred

- Align editor ⋯ copy with dock (“Hide from Explore” vs “Hide · draft”).
- New\|Existing pills.

## Sign-off

Proceed — implement approved scope only.
