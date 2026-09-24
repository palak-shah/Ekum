# Feature Completeness Review — Who expandable, pack tags, set size

**Date:** 2026-09-24  
**Module / ask:** Pieces-per-set only when unit is set; Who on the page as an expandable; collection tags append to designs  
**Anchors:** `docs/features/collections.md`, `docs/features/00-concepts.md`  
**Disposition:** Redesign → Proceed

> Asking pieces-per-set for piece/metre is noise. Who-in-a-sheet is a second surface. Same-for-all tags duplicate pack tags.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack tags are the pack’s labels. They land on every member (append, no duplicate). A design can already have tags — pack tags add on. Who is a create decision on the page. Pieces-per-set only when they sell as a **set**. |
| UX Designer | **Who can see this?** chevron on create (not a sheet). Create & Publish publishes from the dock; incomplete Who expands that row. Same for all: no Tags field. **Pieces in one set** only if unit is set. Same hide on the design sheet. |
| Solution Architect | `unionTags(design, pack)` on create (photos + library). Same-for-all no longer stores tags. Clear `piecesPerPack` when unit is not set. Edit Visibility sheet stays for already-saved packs. |

---

## Platform consistency (required)

1. **Existing patterns?** `CollectionExpandableSection` + `PublishAudienceFields`.  
2. **Duplicates another feature?** Removes Same-for-all tags (pack tags win).  
3. **Should reuse?** Yes — `unionTags`.  
4. **Naming?** **Who can see this?** **Pieces in one set**.

**Philosophy conflict?** Yes vs Who-on-Publish-sheet and Same-for-all tags → **Redesign**.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Append, no overwrite, no dups |
| Workflows | OK | Dock publish; expand Who on miss |
| Edge cases | OK | Unit switch clears set size |
| Permissions | OK | Consent on Who expandable |
| User states | OK | Create vs edit sheet |
| Notifications | N/A | |
| Error handling | OK | Toast + expand Who |
| Scalability | N/A | |
| Mobile interactions | OK | Collapsed rows; BM-07 |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None required.

---

## Approved scope for this slice

- Create: **Who can see this?** expandable; dock Create & Publish does not open a Who sheet.  
- Pack Tags only; append onto every member (`unionTags`). No Same-for-all tags.  
- **Pieces in one set** only when unit is **set** (Same for all + design sheet).  
- Edit Visibility / Publish sheet unchanged.

## Explicitly deferred / rejected

- Pieces-per-box / dozen fields.  
- Who expandable on edit (sheet remains).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
