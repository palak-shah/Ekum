# WhatsApp chat open + locked card previews — design

**Date:** 2026-09-03  
**Status:** Approved (conversation)  
**Approach:** A — client open rule + blurred thumbs on gated chat cards  
**Anchors:** [chat.md](../../features/chat.md), `ThreadPage.tsx`, `PhotoAlbum.tsx`, `reference-resolver.ts`, `explore.service.ts` (collection open)

## Problem

1. **Open:** Threads always stick to newest. Traders expect WhatsApp: unread lands on first unread with an “N unread messages” line; no unread → newest + composer ready.  
2. **Locked cards:** Hiding all thumbs on a gated collection card makes the share look empty. Meena should still see **small blurred** design thumbs in chat; she must **not** open them full-screen. Opening the pack still uses Ask / shell without clear designs.

## Locked decisions

| Topic | Decision |
|-------|----------|
| Open with unread | Snapshot `lastReadAt` + `unreadCount` from thread summary **before** mark-read. Scroll to first **other-party** message with `createdAt > lastReadAt` (same rule as API unread count). |
| Unread divider | Quiet kit line: **“N unread messages”** above that first unread. Shown for that open visit only (snapshot). |
| Open with no unread | Stick to bottom (newest). |
| Deep link `?message=` | Wins over unread/bottom (existing jump + highlight). |
| Mark-read | Still `POST /threads/:id/read` on active open so list/nav badges clear. Snapshot keeps scroll/divider correct. |
| Live stick | Near-bottom stick + send-to-bottom unchanged. |
| Search / chip browse | Unchanged (already WhatsApp-style newest-at-bottom). |
| Chat card when gated | Restore preview `images` on product/collection refs. Add `imagesLocked: true` when viewer lacks `canViewCollectionProducts`. |
| Chat card UI | Small thumbs (existing `PhotoAlbum` thumb size) with **blur**; **no PhotoViewer** when locked. Card tap → open pack/design as today (Ask / shell). |
| Collection / product open | Unchanged from view-on-open: no clear cover mosaic / product gallery when products gated. Chat teaser ≠ full reveal. |
| Server open cursor | Out of scope (client computes from snapshot). |

## User flows

### Open with unread

1. Meena opens a thread with badge.  
2. Client keeps open-visit snapshot of `lastReadAt` / `unreadCount`.  
3. Mark-read runs; badge clears.  
4. Messages load → divider + scroll so first unread sits near the top of the list viewport.  
5. She can scroll up for older history or down to newest / composer.

### Open with no unread

1. Open → list at bottom; composer ready.

### Locked collection card in chat

1. Ravi shares Kavita’s followers pack to Meena.  
2. Meena sees card: name + **small blurred** thumbs.  
3. Tap thumb → nothing (no viewer).  
4. Tap card → collection shell + Ask Kavita; no clear design gallery until she has rights.  
5. After access → sharp thumbs; tap opens PhotoViewer as today.

## Technical sketch

### Open / unread (web)

- Pure helpers (unit-tested): `firstUnreadMessageId(messages, { lastReadAt, viewerCompanyId })`, divider placement.  
- `ThreadPage`: one open-visit snapshot per `id`; initial scroll once when messages ready (not on every poll).  
- Divider is a non-message row in the list render, keyed by snapshot unread count + first unread id.  
- If first unread is not in the loaded page window, scroll to bottom of loaded history toward older fetch only if product already paginates upward — **do not** invent a new history API this slice. Prefer: if unread is in loaded pages, jump; if not found after load, fall back to bottom (same as WhatsApp when history isn’t loaded yet — rare with default page size). Document that fallback.

### Locked previews (API + web)

- `MessageReference.imagesLocked?: boolean` in domain-types.  
- `ReferenceResolver`: always resolve catalog preview images for available cards; set `imagesLocked` when viewer is not owner and fails `canViewCollectionProducts`.  
- Revert “strip images when gated” for **chat refs only**. Collection detail still clears cover/preview when `products` gated.  
- `PhotoAlbum`: `locked?: boolean` — apply blur classes; disable open / omit PhotoViewer.  
- `ChatTradeCardView` / trade card model passes `imagesLocked` through.

## Out of scope

- Floating “jump to unread” chip while scrolled away.  
- Changing mark-read timing (e.g. only when scrolled past unread).  
- Blurred teaser on Explore feed mosaics.  
- Server-provided `firstUnreadMessageId`.

## Verification

- Units: first-unread helper; `imagesLocked` on resolver for Followers + non-follower; PhotoAlbum locked does not mount viewer.  
- Manual: unread open → divider + position; read thread → bottom; Meena chat card blurred, no viewer; collection Ask shell still no clear gallery.  
- Docs: `docs/features/chat.md` open + locked-card lines; Completeness review before code (quality gate).

## Spec self-review

- No TBD placeholders.  
- Chat blur ≠ collection full reveal (explicit).  
- Unread definition matches API (`senderCompanyId !== viewer`, `createdAt > lastReadAt`).  
- Fallback if first unread not in loaded pages: bottom (explicit).  
- Scope is one plan: open behaviour + chat preview lock flag.  
