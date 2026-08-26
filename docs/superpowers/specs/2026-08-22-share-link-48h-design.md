# 48h share link — design

**Date:** 2026-08-22  
**Status:** Approved  
**Anchors:** Completeness `2026-08-22-share-link-48h-completeness.md`

## Job

Send **this** album or design as one Ekum link. Guest can look when the pack is **Everyone**. Closed packs show only the card. Join to trade. Then Ekum rules apply.

## Surfaces

- **Share** sheet chats: **pinned first**, then recent (`lastMessageAt`).  
- **When they order** (Direct / I handle): ConnectionPicker bordered rows.  
- **Share a link · 48 hours**: quiet accent text under the chat list.  
- Share payload: `Ekum · {name}` plus the URL on its own line. No attached photo.  
- Guest `/s/:token` is **public** (not behind login).  
  - **Everyone** (published + live): Ekum + cover + name + design photos/names. Look only. Tap a design or **Open on Ekum** → login / onboard → **this** pack.  
  - **Not Everyone**: cover + name + **Request access** → login / onboard → usual Request / Follow on the real viewer.  
- **Already on Ekum** (onboarded): skip the guest page; open the real pack.  
- OG: `GET /share-links/:token/card` — `Ekum · {name}` + one photo.

## Rules

- Expires 48 hours → expired on `/s/:token` (no login).  
- Public GET returns design thumbs **only** when `open` (audience Everyone and live). Closed packs never leak the album.  
- After join: same audience as in-app. Blocked → 404. No auto-connect.

## API

- `POST /share-links` `{ collectionId }` **or** `{ productId }`  
- `GET /share-links/:token` (public) `{ kind, targetId, name, image, audience, open, designs, expired, path }`  
- `GET /share-links/:token/card` (public HTML)
