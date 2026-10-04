# Feature Completeness Review — Empty / unpublished pack hidden from followers

**Date:** 2026-10-02  
**Module / ask:** Never show unpublished designs on the album viewer. When the last (or only) Published design is hidden, unpublish the pack so followers are not left with an empty album.  
**Anchors:** `docs/features/collections.md`, `docs/features/explore.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | A pack is only a pack while it has a live design. Hide the only design → hide the pack. |
| UX Designer | Explore / shop / album: live designs only (count matches). **No longer available** only on Saved, share cards, and Your selection when the supplier later hid it. |
| Solution Architect | On design hide/archive/delete: draft published packs with no remaining Published member. Visitor lists require a Published member. `collectionDetail` omits unpublished members. |

---

## Platform consistency (required)

1. **Existing patterns?** Publish already refuses empty packs; this is the after-hide / leftover case.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same You status line / Feed caption.  
4. **Naming matches the app?** Empty · Not published. Not “no SKUs”.

**Philosophy conflict?** No — one job, don’t strand followers.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hide + owner copy |
| Business rules | OK | ≥1 Published member to discover |
| Workflows | OK | Publish still needs ≥1 design; members become Published on pack publish |
| Edge cases | OK | Chat deep link / 48h: same 404 for visitors |
| Permissions | OK | Owner always sees own pack |
| User states | OK | Draft · Empty |
| Notifications | N/A | |
| Error handling | OK | NOT_FOUND like other gated packs |
| Scalability | OK | Indexed member status filter |
| Mobile interactions | OK | Tile line only |
| First glance (BM-11) | OK | Status is the loud fact when not live |
| Accessibility | OK | Text in subtitle |
| Platform consistency | OK | |

---

## Gaps

None required.

---

## Approved scope for this slice

- Hide / archive / delete a design drafts any live pack that would have no Published member left.
- Album viewer (owner and visitor) lists Published designs only.
- Visitor Explore / shop / search omit packs with no Published member.
- Leftover pointers (Your selection, Saved, share, **order lines**) say **No longer available**.
- Docs + units.

## Explicitly deferred / rejected

- Backfill job beyond You list / owner album open heal.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units)
