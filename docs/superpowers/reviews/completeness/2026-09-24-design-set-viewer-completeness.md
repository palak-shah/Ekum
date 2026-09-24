# Feature Completeness Review — Design set: WhatsApp-style next + shop name

**Date:** 2026-09-24  
**Module / ask:** Shared 2+ designs open as one album; arrows go to the next design; each frame names the shop so it is not one pack  
**Anchors:** `docs/features/chat.md`, `docs/features/explore.md`, `2026-09-16-design-album-share`  
**Disposition:** Proceed

> Completeness already said tap → PhotoViewer. Grid-only was a gap. Shop name per design is required so mixed shops are not read as one Collection.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One door, many designs, many shops. Next photo can be the next design. |
| UX Designer | Reuse kit PhotoViewer (swipe / arrows). Caption = design name; detail = shop. Tiles also show shop. |
| Solution Architect | Flatten visible designs’ photos in share order. Locked designs stay out of the strip. |

---

## Platform consistency (required)

1. **Existing patterns?** PhotoViewer captions/details.  
2. **Duplicates?** No — not a Collection.  
3. **Reuse?** PhotoViewer, DesignSetPage.  
4. **Naming?** **Designs**; shop name, not Seller/Buyer badges.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Per-design access |
| Workflows | OK | Chat / 48h → set |
| Edge cases | OK | One shop vs many; no photos; locked |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | OK | Typical small share |
| Mobile interactions | OK | Swipe + arrows |
| Accessibility | OK | Caption + shop |
| Platform consistency | OK | |

---

## Approved scope

- Flatten open designs into one PhotoViewer strip (share order).  
- Auto-open viewer on set page; close → grid. Tile tap starts at that design.  
- Caption = name; detail = shop (`From {business}`). Same shop line on tiles.

## Explicitly deferred / rejected

- Treating the set as a Collection.  
- Cross-design Order from the viewer.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes (units + existing share-link journey)  
