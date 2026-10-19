# Feature Completeness Review — Explore feed photo

**Date:** 2026-10-19  
**Module / ask:** Explore collection posts show one large photo (swipe up to 5) and a tight caption: name, price, tags, optional description.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same post, same actions. Mosaic becomes a photo strip so a trader sees one design at a time and opens the album for the rest. |
| UX Designer | Matches the client prototype: photo, icon row with dots, name left, rate right, muted tags. The note is on the collection. No overlay chip. |
| Solution Architect | Reuse `DesignPhotoCarousel` and the existing preview payload. Raise the preview URL cap from 4 to 5. `imageCount` stays the full thumb count. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes. Design posts already swipe. Icon row, teal rate, and shop header stay.
2. **Duplicates another feature?** No. Saved, You, and shop shelves keep the mosaic.
3. **Should reuse an existing workflow?** Yes. Tap still opens the collection; Selecting still toggles the photo; the name still opens.
4. **Naming matches the app?** Yes. **View more**. No Seller/Buyer labels.

**Philosophy conflict?** No.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Swipe ≤5, last card View more, caption fields |
| Business rules | OK | Rates still only when publish rates are visible. From-mill credit leaves this caption; it stays on the album. |
| Workflows | OK | Repost, Message, Share, Bookmark unchanged |
| Edge cases | OK | No price, no tags, no description, one photo, Selecting |
| Permissions | N/A | Same card |
| User states | OK | Own post still says You; actions still gray when not allowed |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Still five image URLs, not the whole album |
| Mobile interactions | OK | Horizontal swipe on the photo. No new sticky bar. |
| First glance (BM-11) | OK | One photo is the job. Tags stay quiet. The note is on the collection. |
| Accessibility | OK | Photo remains a named button |
| Platform consistency | OK | |

---

## Gaps

None required before this slice.

---

## Approved scope for this slice

- Explore collection posts (`OpportunityCollectionCard`, `CollectionPost`): one 4:5 photo, swipe up to 5, dots on the icon row, a last **View more** card when more photos exist, no overlay chip and no count line under the photo.
- Caption: name left, rate right when present, every tag. Description stays on the collection page.
- API preview list returns 5 URLs.

## Explicitly deferred / rejected

- Saved, You, shop, and business mosaics stay.
- Design posts keep on-photo dots and are not capped at 5.
- **From {mill}** is not shown under the Explore photo.
