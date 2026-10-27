# Feature Completeness Review — album member Publish has no Who

**Date:** 2026-10-26  
**Module / ask:** Publishing a draft design from the collection page must not ask Who — that sheet is confusing because the pack already has audience.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Proceed (Redesign of album ⋯ Publish = You Designs Who / `post-to-market`)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Who belongs to the Explore post. Collection Publish already chose Who for this pack. A draft member going live here is the same job as pack Publish promoting own drafts: **Published** for Order inside the pack, **no** solo Explore tile (`postedToMarketAt` stays null). Solo Explore still needs Who on You Designs / the editor. |
| UX Designer | Album ⋯ **Publish** and DesignSheet ⋯ **Publish** (when opened from this album) are one tap + toast **Published**. No second Who sheet. Draft chip comes off. First-ever sell still needs consent on collection Publish or You Designs Publish — not a new checkbox here. |
| Solution Architect | `POST /collections/:id/publish-members` stamps collection audience onto own draft members; does not set `postedToMarketAt`. You Designs `BulkProductPublishSheet` / `post-to-market` unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Pack Publish already promotes own drafts without Explore tiles. Hide / Draft on members is one tap (+ confirm only when shared across packs).  
2. **Duplicates another feature?** No — You Designs Publish stays the Explore path.  
3. **Should reuse an existing workflow?** Reuse pack-publish member stamp, not the design Who sheet.  
4. **Naming matches the app?** Publish / Published. No Unpublish.  
5. **Units?** N/A.

**Philosophy conflict?** Yes → **Redesign** of album member Publish = Explore Who, then **Proceed**.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | One-tap Publish on album / in-sheet; no Who |
| Business rules | OK | No `postedToMarketAt`; inherit pack audience; mill rows skipped |
| Workflows | OK | You Designs / editor keep Who |
| Edge cases | OK | Draft pack still stamps stored audience; GC leftovers published without Explore tile; `canPublish` false → existing consent error |
| Permissions | OK | Owner + own draft members of this pack |
| User states | OK | Catalog album same; GC same (GC is not Explore) |
| Notifications | OK | Toast Published N |
| Error handling | OK | API toast |
| Scalability | N/A | |
| Mobile interactions | OK | No extra sheet; no new sticky bar |
| First glance (BM-11) | OK | Publish stays in ⋯; no loud Who on the album |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | ⋯ Publish; toast |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Album Publish opened the Explore Who sheet

| Field | Content |
|-------|---------|
| Gap | Album ⋯ Publish reused `BulkProductPublishSheet` (`post-to-market`), so traders picked Who again on a pack that already has audience. |
| Why it matters | Two Whos for one pack. Looks like a second Explore post. |
| Impact if ignored | They skip Publish or invent a second audience that fights the collection. |
| Recommendation | One tap: mark own draft members Published in this pack; no Explore tile. Who stays on collection Publish and You Designs. |
| Priority | Required before implementation |

Closed by this slice.

---

## Approved scope for this slice

- `POST /collections/:id/publish-members` — own draft members of this pack (including GC leftovers); stamp pack audience; **no** `postedToMarketAt`.
- Album select ⋯ **Publish** and DesignSheet ⋯ **Publish** (album context): one tap + toast. No Who sheet.
- You Designs / editor **Publish** unchanged (Who + Explore tile).

## Explicitly deferred / rejected

- Consent checkbox on the album (first sell stays on collection Publish / You Designs).
- Publishing a member as a solo Explore tile from the album (You Designs).
- Changing Pack Publish member promotion.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
