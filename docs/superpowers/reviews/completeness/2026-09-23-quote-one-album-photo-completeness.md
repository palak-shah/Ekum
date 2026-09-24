# Feature Completeness Review — Quote one photo in a chat album

**Date:** 2026-09-23  
**Module / ask:** Reply/quote a single shot inside a multi-photo chat album so they can talk with that picture as the reference. No Order / Ask rates on the viewer.  
**Anchors:** `docs/features/chat.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same job as WhatsApp “reply to this photo”: name the design in chat. Trade actions stay on the order sheet. |
| UX Designer | PhotoViewer **Quote** (one word). Composer shows that thumb. In-thread quote shows that thumb. Menu Reply still quotes the whole album. |
| Solution Architect | `replyToPhotoIndex` on the reply message metadata. No new table. Validate parent is a photo album and index is in range. |

## Platform consistency

1. Existing patterns? Reply composer + PhotoViewer headerAction (Find → Chat).  
2. Duplicates? No — this is a tighter Reply, not a second Order path.  
3. Reuse? Reply chrome, PhotoAlbum → PhotoViewer.  
4. Naming? **Quote** on the viewer; composer still **Replying to**.

**Philosophy conflict?** No

## Approved scope

- Viewer **Quote** on the current photo (albums of 1+).
- Send stores `replyToPhotoIndex`; preview includes `photoUrl`.
- Composer + bubble quote show that thumb.
- No Order / Ask rates on the viewer.

## Sign-off

Yes · 2026-09-23
