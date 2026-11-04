# Feature Completeness Review — Repost inherits category and tags

**Date:** 2026-11-02  
**Module / ask:** Repost (Explore, Cart, mixed cart) must not ask category or tags. Inherit shared source values; omit when they differ; never block Publish with `CATEGORY_REQUIRED`.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/saved.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The supplier already categorized the pack/design. Asking again on Repost is a trap — Publish collection has no category field, then dumps **Pick which category this collection is for.** Own new collections still pick. |
| UX Designer | No Category/tags picker on Repost or on the Publish sheet. Curated editor does not show those as a job. Who / rates / relist stay the job. |
| Solution Architect | Close the Cart gap in 2026-10-27: stamp unique source hop; copy source `masterCategoryId` + tags; publish `required: false` for hop **or** foreign members. Mixed sources: unique shared values only. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Explore hop already skips Category; Cart create does not stamp the hop.  
2. **Duplicates another feature?** No picker.  
3. **Should reuse an existing workflow?** Yes — `peerRepostOmitsCategoryPick` + source stamp.  
4. **Naming matches the app?** Category / tags — no new jargon.  
5. **Units?** N/A.

**Philosophy conflict?** No. Own catalog still requires Category when 0 or 2+ shop categories.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Inherit; mixed omit; never ask |
| Business rules | OK | Own-only still picks Category |
| Workflows | OK | Explore in-sheet + Cart Add new → Publish |
| Edge cases | OK | Empty source category still publishes; mixed packs no hop |
| Permissions | N/A | |
| User states | OK | Foreign vs own-only |
| Notifications | N/A | |
| Error handling | OK | No red CATEGORY_REQUIRED on curated Publish |
| Scalability | N/A | |
| Mobile interactions | OK | Sheet unchanged |
| First glance (BM-11) | OK | One job: Who |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Cart unique source pack → `repostSourceCollectionId`; single foreign design → `repostSourceProductId`.  
- Copy source Master Category and tags on create when dto is empty.  
- Publish skip Category when hop **or** any foreign member.  
- Mixed cart: no hop; stamp unique shared identity after members; omit if they differ.  
- Curated editor hides category/tags; no red category error on Publish.  
- Own new collection still requires Category.

## Explicitly deferred / rejected

- Category picker on Repost (still deferred).  
- Changing Category/tags on a curated pack from Publish (Edit details later if needed).  
- Pack-only members becoming curatable.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
