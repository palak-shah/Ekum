# Presentable invite to connect — design

**Date:** 2026-09-11  
**Status:** Approved — implemented  

**Anchors:** Completeness `2026-09-11-presentable-invite-connect-completeness.md`, `docs/features/referrals.md`, 48h share OG (`share-link-og`, `/s/:token`)

## Job

Someone shares **Invite to connect** on WhatsApp. The recipient sees a **trusted Ekum card** (not a strange bare link), opens a **focused invite** (not an empty app shell page), and can request access with one clear tap.

## Surfaces

### A. Share payload (native sheet / WhatsApp)

- **Title:** `Ekum · Connect with {Business}`  
- **Text:** `{Business} invites you to connect on Ekum` then the URL **once** on its own line (`shareMessageText`).  
- **Share API:** Pass `title` + `text` only when the URL is already in `text` — do **not** also pass `url` (WhatsApp duplicates it). Clipboard fallback still copies the URL.  
- **Vouch:** `{Referrer} introduces {Target} on Ekum` (same URL rule).  
- Call sites pass **referrer company name** into `inviteShareCopy` (Find on Ekum, Referrals, compose).

### B. Messenger preview (Open Graph)

Mirror catalog `/s/:token` cards:

- Public **`GET /referrals/:token/card`** → HTML with:
  - `og:title` = `Ekum · Connect with {Business}` (vouch: `Ekum · {Referrer} introduces {Target}`)  
  - `og:description` = same sentence as share text (without URL)  
  - `og:image` = referrer `logoUrl` when absolute http(s), else `{webOrigin}/brand/app-icon-512.png`  
  - `og:site_name` = Ekum  
- Vite middleware (and beta edge, same as `/s/`) serves that HTML to WhatsApp/Facebook/Telegram bots on **`/r/:token`**. Humans still get the SPA.

### C. Focused landing `/r/:token` (option B)

- Route lives **outside** `AppShell` / bottom nav (same tier as `/s/:token`, `/t/:token`, `/login`).  
- Chrome: safe-area canvas, **Ekum** mark (accent wordmark or logo), no Home/Chats/＋ bar.  
- Hero: large company avatar / logo.  
- Open invite copy:  
  - Headline: **`{Business} invited you`**  
  - Why-line: **Connect on Ekum to see their designs and chat about trade.**  
  - CTA: **Request to connect**  
- Vouch: headline **`{Referrer} introduced you to {Target}`**; CTA **Request to connect** (to target).  
- City + optional note stay quiet under the name.  
- **Guest:** CTA → login with invite return stash (existing).  
- **Authed, needs onboarding:** → onboarding with return.  
- **Authed, ready:** redeem / request on this page (existing APIs).  
- Invalid/expired: focused error, still no bottom nav.

## Rules

- Trust ladder unchanged: redeem → pending access request → inviter approves on Buyers. No auto-connect.  
- No PNG attachment in the share sheet.  
- Self-redeem / blocked errors stay as today (toast or in-page notice).

## API / edge

- `GET /referrals/:token/card` `@Public()` HTML (like share-links card).  
- Resolve for SPA may stay authed for redeem; card endpoint loads referrer/target summary without leaking private catalog.  
- Bot middleware: `/r/:token` → fetch card HTML (extend existing share-link OG middleware pattern).

## Out of scope

- Redesigning Invites list / compose form  
- Team invite `/t/` visual parity (follow-up)  
- Changing approve flow on Buyers
