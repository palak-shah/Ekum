# Presentable catalog share (WhatsApp) — design

**Date:** 2026-09-11  
**Status:** Implemented (local) — redeploy web + API + gateway nginx for beta  
**Anchors:** `docs/features/media.md`, `docs/features/collections.md`, `docs/features/referrals.md`, share-link OG (`share-link-og`, `/s/:token`), gated chat album teaser (`imagesLocked` / PhotoAlbum blur), presentable invite (`2026-09-11-presentable-invite-connect-design.md`)

## Job

A trader shares a **48h collection (or design) link** to WhatsApp. A **prospect** who is not yet on Ekum / not connected sees a **teaser card worth tapping** — blurred design thumbs (same language as gated chat album), **who is sharing**, and Ekum — not a generic site blurb and not a naked URL as the main content.

Separately: **＋ → Invite to connect** must actually open a share path (same polish as Find-on-Ekum invite), and messenger bots must receive real OG HTML for both `/s/` and `/r/` (today WhatsApp often shows homepage “Ekum” meta).

## Problem (observed)

1. WhatsApp preview for `/s/…` shows **generic** title “Ekum” + marketing description — not pack/seller card (bot likely got SPA shell, not `/card`).  
2. Message body shows raw `https://beta.ekum.app/s/…`.  
3. No blurred collage; no clear **company** sharing; Ekum mark weak/missing on the card.  
4. **＋ → Invite to connect** “is not sharing” — compose/share path or OG for `/r/` does not complete the job.

## Decision — Approach A (server OG collage)

WhatsApp only shows **one** `og:image`. Generate a **server-side teaser image** (blurred collage) and serve it from the public share-link card endpoint. Fix bot routing so crawlers always get that HTML.

### A. Messenger preview (`GET /share-links/:token/card`)

| Field | Rule |
|------|------|
| `og:title` | `{Seller} · {Pack or design name}` |
| `og:description` | `{Seller} shared a {collection\|design} on Ekum — open to view.` |
| `og:image` | Generated collage URL (see B), else absolute cover/thumb, else app icon |
| `og:site_name` | Ekum |
| Twitter | `summary_large_image` when collage/cover present |

**Teaser thumbs (even if pack is closed):** load up to **4** design thumbs for OG only (same trust idea as gated chat blur — tease, don’t unlock full album in WhatsApp). Prefer member order; pad with cover if fewer than 2.

### B. Collage image

- Layout: **2×2** when ≥4 thumbs; **1+2** or dual when fewer; single blurred cover if only one.  
- Soft blur + slight scale (match gated PhotoAlbum feel — readable as fabric, not crisp retail).  
- Quiet **Ekum** wordmark/mark in a corner.  
- Optional thin label strip: seller short name (if space).  
- Endpoint e.g. `GET /share-links/:token/og-image` (public, cacheable) **or** inline generation cached by token; must be absolute `https` URL WhatsApp can fetch.  
- Design/product link: single thumb (blurred) + same title/description pattern with seller.

### C. Share payload (native sheet)

- **Title:** `{Seller} · {Pack}`  
- **Text:** `{Seller} shared {Pack} on Ekum` — **do not** append a second naked URL line when `nativeShareFields` can attach `url` without duplicating (same helper as invite). Prefer preview-as-link; clipboard fallback still copies URL.  
- Pass **seller/owner company name** into `catalogShareCopy` (not pack name alone).  
- No PNG attachment in the share sheet (messengers split non-clickable image).

### D. Bot / edge (shared with invite)

- WhatsApp/Facebook/Telegram bots on **`/s/:token`** and **`/r/:token`** must receive API card HTML, never SPA index.  
- Harden nginx (and Vite middleware) so rewrite to `/api/v1/…/card` cannot fall through to the web shell.  
- Verify with a bot UA fetch before calling done.

### E. ＋ → Invite to connect

- **＋ → Invite to connect** must complete share: create open connect invite (or land on ready state) and open **Share** / copy — same copy + `shareOrCopyInvite` as Find on Ekum.  
- Do not leave the trader on a dead end with no share CTA. Prefer **one primary Share** after create (or create+share in one tap if that matches Find-on-Ekum).  
- OG for `/r/` already specified in invite design; ensure edge serves it (D).

## Rules

- Closed packs: OG teaser thumbs allowed; landing `/s/` behaviour unchanged (cover + request access when closed).  
- No full-res clear gallery in WhatsApp.  
- Trust ladder / 48h TTL unchanged.  
- Seller = catalog **owner** company (not the sharer if non-owner forward later — v1 owner).

## Out of scope

- Multi-target 48h links  
- Redesign in-app ShareLink landing chrome beyond what’s needed for OG  
- Attaching collage as a separate WhatsApp photo  

## Success

Prospects see a **blurred collage teaser**, **seller name**, and Ekum; tap opens `/s/…`. Message is not “generic Ekum + raw URL”. Invite from ＋ opens a real share. Bot fetch returns card HTML, not SPA.
