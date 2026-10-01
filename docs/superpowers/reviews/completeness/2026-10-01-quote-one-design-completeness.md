# Feature Completeness Review — Quote one design in a chat set

**Date:** 2026-10-01  
**Module / ask:** Same job as Quote on a photo album: name **one design** from a `design_album` so they can discuss it in the thread. No Order / Ask rates on the viewer.  
**Anchors:** `docs/features/chat.md`, `docs/features/explore.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Photos already Quote one shot. A clubbed Designs card is the same talk-about-this-thing job — one design, not the whole collage. Trade actions stay on the ticket. |
| UX Designer | Open **View designs →** → set page → tap a design → PhotoViewer **Quote** (same word as photos). Composer + reply bar show that design’s thumb and **Design · {name}**. Menu Reply still quotes the whole set. Quote only when the set was opened from that chat (thread + message). 48h / Explore set has no Quote. |
| Solution Architect | `replyToProductId` on send + reply metadata. Parent must be `design_album` and the id in `productIds`. Do not reuse `replyToPhotoIndex` (one design can have several photos). Preview thumb from `reference.designItems`. |

---

## Platform consistency (required)

1. **Existing patterns?** PhotoViewer `headerAction` Quote; reply composer; `replyToPhotoIndex` sibling.  
2. **Duplicates another feature?** No — tighter Reply, not Ask rates / Order.  
3. **Should reuse an existing workflow?** Yes — same Quote + composer as photo albums.  
4. **Naming matches the app?** **Quote**; composer **Replying to** / **Design · name**.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Quote current design in the set viewer when opened from chat |
| Business rules | OK | Must belong to that album message |
| Workflows | OK | Viewer Quote → back to thread composer |
| Edge cases | OK | Locked/missing designs cannot be quoted (no slide); menu Reply = whole set |
| Permissions | OK | Same as any reply in that thread |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | OK | Invalid parent / id → `INVALID_REPLY_DESIGN` |
| Scalability | OK | No new table |
| Mobile interactions | OK | Quote in PhotoViewer header; composer already BM-07 |
| Accessibility | OK | Same control as photo Quote |
| Platform consistency | OK | Matches photo Quote |

---

## Approved scope for this slice

- `designSetPath` carries `thread` + `msg` from the chat card.
- Design set PhotoViewer **Quote** when those params exist → `/chats/:id` with quote state.
- Send `replyToProductId`; list preview thumb + **Design · name**.
- Composer shows that thumb; no Order / Ask rates on the viewer.

## Explicitly deferred / rejected

- Quote from 48h / Explore-only set (no thread).
- Quote a single `product_card` (already Reply on the card).
- Order / Ask rates on the design-set viewer.

## Sign-off

Yes · 2026-10-01
