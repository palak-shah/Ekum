# Grouped designs share (chat + 48h) — design

**Date:** 2026-09-16  
**Status:** Approved for implementation  
**Anchors:** Completeness `2026-09-16-design-album-share-completeness.md`, `docs/features/chat.md`, `docs/features/explore.md`, CatalogShareSheet, PhotoAlbum / photo messages, share-link 48h

## Job

When a trader shares **2+ designs**, send them as **one chat-friendly collage** labeled **designs** — same model for **Ekum chat** and **48h WhatsApp link**. Not a Collection / pack. Visual calm like WhatsApp Media.

## Problem

Today multi-select posts **N `product_card`s** and hides **Share a link · 48 hours**. Thread looks noisy; off-app cannot share the set as one door.

## Decision

| Surface | Behavior |
|--------|----------|
| Chat | One message type `design_album` with `metadata.productIds` (ordered, unique, ≥2). Bubble = photo-message `PhotoAlbum` + caption **“{N} designs”**. Tap → `PhotoViewer` swipe. |
| 48h link | Kind `designs` with same `productIds`. Landing + OG use collage + **designs** copy. Tap → photo swipe. |
| Catalog | **Nothing** created in My Catalog. |

### Visual / copy (required)

- **Do:** photo-message collage; “{N} designs”; PhotoViewer.  
- **Don’t:** `collection_card` / trade-card pack chrome; pack/album/collection wording; collection KindIcon.

### Share sheet

- ≥2 designs → one `design_album` (not N product cards); always offer 48h CTA with same ids.  
- Albums in the same share still post as `collection_card`s; 48h multi path is designs-only.  
- 1 design / 1 album unchanged.

### API sketch

- Message: `type: design_album`, `metadata.productIds[]`, `body: "{N} designs"`. Same shareability as `product_card` per id.  
- `POST /share-links` `{ productIds }` (≥2) XOR `collectionId` XOR `productId`.  
- `ShareLinkView.kind: 'designs'`; `name` e.g. `{N} designs`; `designs[]` previews.

### Open / join

- Guest landing: collage + seller + “{N} designs”; swipe photos.  
- Open on Ekum: keep presenting the **set** (not only the first design as a solo share).

## Out of scope

- Auto-curate / silent Collection  
- Changing multi-album share (still N collection cards)  
- Chat-only or link-only half-ship

## Success

2+ designs → one collage in chat **and** one 48h link; copy says designs; never looks like a pack; no My Catalog row from this path.
