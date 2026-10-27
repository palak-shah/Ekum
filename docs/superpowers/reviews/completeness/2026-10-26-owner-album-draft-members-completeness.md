# Feature Completeness Review — owner album draft members

**Date:** 2026-10-26  
**Module / ask:** Draft designs stay on the **owner** album with a Draft chip (including inside a published collection/catalog). Select ⋯ Draft for designs on the album and on You. Draft the collection/catalog from the album too. Buyers still see live designs only.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Proceed (Redesign of “unpublished members hidden on every album except General Collection”)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack status and design status stay independent. A published album may hold draft designs; a draft album may hold published designs. Those published designs stay on You → Designs and on other live albums. Hide from buyers is still Hide. The owner must see what they drafted, or they cannot manage it. |
| UX Designer | Same quiet foam **Draft** chip as You collections. One caption: name + chip. Album select ⋯ **Draft** after Bookmark. Album idle ⋯ **Draft this collection / catalog** after Edit (not on General Collection). You Designs default list stays published; Find → Draft gets the chip. Traveling Selection still skips drafts. |
| Solution Architect | Explore `collectionDetail` returns non-archived members for the owner (including drafts); visitors stay published-only. Explore / shop mosaics stay published-only. Album list helper takes `isOwner`. Unpublish design = existing `POST /products/:id/unpublish`. Unpublish pack = existing `POST /collections/:id/unpublish`. |

---

## Platform consistency (required)

1. **Existing patterns?** Foam Draft chip, You Hide Draft / select Draft, editor ⋯ Draft + Also draft these designs, `OwnerPackLifecycleSheet`, `sharedDesignDraftCopy`.  
2. **Duplicates another feature?** No — album was missing Draft for members and for the pack. You / editor keep their paths.  
3. **Should reuse an existing workflow?** Unpublish endpoints, lifecycle sheet, other-pack-counts confirm when a design sits in more than one pack.  
4. **Naming matches the app?** Draft, not Unpublish. Catalog noun on catalog albums.  
5. **Units?** N/A — no ₹ or qty string change.

**Philosophy conflict?** Yes → **Redesign** of the owner-album hide rule, then **Proceed**. Buyers / Explore / shop stay published-only. Pack Publish still promotes own draft members.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Owner lists drafts with chip; Draft actions in and outside the album |
| Business rules | OK | Status independent; buyers published-only; archived still hidden |
| Workflows | OK | Album select Draft; You Hide Draft; album ⋯ Draft pack; editor ⋯ Draft |
| Edge cases | OK | Shared-pack confirm; mill/curated picks not draftable; GC no pack Draft |
| Permissions | OK | Owner only |
| User states | OK | Draft pack owner can stay on album; You Designs published tab unchanged |
| Notifications | N/A | Toast Draft |
| Error handling | OK | Failed unpublish toasts |
| Scalability | N/A | |
| Mobile interactions | OK | Same ⋯ sheets; no new sticky bar |
| First glance (BM-11) | OK | Chip quieter than the photo and name; not a second title |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Chip text Draft; ⋯ labels |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Owner album hid draft members

| Field | Content |
|-------|---------|
| Gap | Unpublished members were hidden on the owner album except General Collection, so Draft on a design in a published pack looked like a delete. |
| Why it matters | Traders cannot manage what they cannot see. |
| Impact if ignored | Ask fails; they hunt You Find → Draft. |
| Recommendation | Owner album lists non-archived members; Draft chip. Buyers unchanged. |
| Priority | Required before implementation |

Closed by this slice.

---

## Approved scope for this slice

- Owner album (regular, catalog, GC): non-archived members; Draft chip on draft tiles.
- Buyer / Explore / shop mosaic: published members only.
- Album select ⋯ **Draft** (published own designs). Shared-pack confirm copy updated.
- Album idle ⋯ **Draft this collection / catalog** after Edit (published, not GC).
- You Designs Find → Draft tiles get the same chip. Published Designs tab stays published-only.
- `packDraftCopy` catalog noun.

## Explicitly deferred / rejected

- DesignSheet ⋯ Draft (select is the path).
- Mixing drafts into You Designs published list.
- Changing Pack Publish so it does not promote own draft members.
- Draft chip on Explore / shop / buyer tiles.
- Share / Replace / Ask still say “collection” on catalog albums.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
