# Feature Completeness Review — pack members stay published

**Date:** 2026-10-06  
**Module / ask:** Draft is not the main thing. After add/replace photos in a pack, keep designs **published**. Do not drop a live pack to draft.  
**Anchors:** `docs/features/collections.md`, `docs/features/catalog.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders publish albums. Draft is a quiet save for **new** packs only (**Save in Draft**). Edit / replace / photos must not strand designs as Not published or silently Hide the pack. |
| UX Designer | No extra Publish chip as the job. Adding a photo to a pack **is** publish (pack-only). Hide stays in ⋯. |
| Solution Architect | `setProducts` always promotes own drafts (not Archived). Stop auto-writing Collection Draft when the last live member leaves or list/Explore sees an empty live pack. Explore still omits packs with no published members. Explicit Hide still drafts. |

---

## Platform consistency (required)

1. **Existing patterns?** Pack Publish already marks members Published without Explore tiles.  
2. **Duplicates?** No.  
3. **Reuse?** Same promote as pack publish.  
4. **Naming?** **Publish** / **Hide** — not Set live.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Photo add → published members |
| Business rules | OK | Hide is the only pack unpublish |
| Workflows | OK | Replace then photos stay published |
| Edge cases | OK | Archived: no promote. New collection Save in Draft unchanged |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | OK | |
| Mobile interactions | OK | |
| First glance (BM-11) | OK | No Not published as the default |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — members and packs fall to draft on add/replace

| Field | Content |
|-------|---------|
| Gap | Photos create Draft; empty/last-member rules Hide the pack. |
| Why it matters | Draft is not the job on Edit. |
| Impact if ignored | Not published + red errors + no live photos. |
| Recommendation | Promote own drafts on any non-archived pack; do not auto-draft live packs. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Own drafts in `setProducts` → Published (pack who/rates, no `postedToMarketAt`) unless pack is Archived.
- Do not auto-draft a Published pack when empty or last live member is gone.
- Explicit **Hide from Explore** still drafts.
- New collection **Save in Draft** stays (deferred: not the edit path).

## Explicitly deferred / rejected

- Removing Save in Draft from New collection.
- Auto-Publish a never-published pack just because they added a photo on Edit.
