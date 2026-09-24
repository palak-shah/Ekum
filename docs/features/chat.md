# Chat

## Purpose

Company-to-company messaging for trade: text, photos, voice, and **cards** (collection / product / order / rate) with server-side **source masking**.

## Who uses it

Any company. Unconnected first messages land in the recipient’s **Requests** inbox.

## User flows

1. Open **Chats** → search + **＋**. One sheet, sequential (no pills). **New chat** = pick businesses first (Find on Ekum is a **link** after 2+ characters in search, or **immediately** if there are no connections; tap shows shops **not already in Connections**; **Send invite** is OS share / copy — not a phone-book sync; empty query + no connections → name / mobile / GST field after tap). Need at least one other business. Owner with staff: **Next** → **Add your team** (**Optional — add teammates or skip** inline link when two+ shops; search when 10+ staff; **Select all** / **Clear**). One footer: **Open chat with {business}** (one shop) or **Next** (two+). Success toast says **Chat started** / **Opened chat** / **Back in chat** from API `opened`. Two+ shops then **New group** (name) → **Create**. No staff / not owner: one shop **Open chat**; two+ **Next** → name. Header **Back** is the previous step (keeps picks); **Close** dismisses. Sheet height is fixed; steps stay mounted (hide, don’t remount). Inbox tabs **All Chats** / **Requests Received**. List chrome matches Explore (filter) and Orders (＋). Inbox/headers show **business name** (or group title) only — no Team/Private labels. Rows stay flat (not cards): company is primary; Order / Quote / Photo / Return (etc.) is the object line when the last message is not plain text.
2. Open thread → send text / photo; **＋** attach: Design · Collection · Photos · **Photo order** (buying; 1:1 opens `/orders/new?seller=` with that shop selected and changeable) · Document · Order (share). Type **`@`** to mention a teammate on this chat or another business (pick above the composer); share design, collection, or order cards (**uniform layout** — header is the primary: `Order #… Requested` / pack name / design name; **kind badge + left color rail** (Order teal / Collection steel / Design clay); white/surface fill with **restrained teal** on rail, badge, links, and primary CTAs — not solid teal bubble fills; who, detail, CTA below; inline thumbs left; ~92% width; no Design/Collection type-label line — CTA names the kind); receive quote / order action cards from trade flows. **Explore / album Share** can also drop a `collection_card` into a chosen chat (catalogue → chat). **Forward is free** for live published cards (blocked senders still cannot); opening the pack still checks view with the catalog owner. Share failures show **InlineNotice** in the sheet.
3. **Open chat** or **Ignore** a pending first-contact thread (not Accept/Decline — those words are for orders). If they had **requested access**, **Open chat** also Approves that request → **one mutual Connection** (no second Network Approve).
4. Pin chat. **Mute** on the floating menu opens a **sibling pick** beside it (**8 hours / 1 week / Always**) — not a sheet. Stay on, no pings — other shop does not see. **Unmute** is one tap. Last owner on the shop **1:1** cannot Leave — they mute. **Leave** (confirm sheet → off this chat; rejoin via `＋` → Open existing if still live). Groups: tap the **group name** → group page (header is **Back** only — name lives once under the photo; small **camera** to add a picture, **editable name**, **N businesses**, one-line or owner **Add a line** that expands a field there). Segments **Businesses · Media · Settings** (same bar as All Chats / Requests). **Businesses:** search + **＋** add connected shops. Below the shops: **Your team** (our people on this chat — never the other shops’ staff). Owners **Add** opens Team on chat; **×** takes staff off this chat (not owners). Search filters shops only (team hides while typing). A quiet **Share invite** in the ＋ sheet opens the phone’s share apps with a `/g/:token` link — not a second CTA next to Add. **Media:** Photos · Documents · Designs · Collections in this group. **Settings:** Mute · Pin · Team on chat (owners) · Leave · Remove group. Join if connected to a shop already on the group; else request to connect with the host. Not a people roster (other shops’ staff stay hidden). **Team on chat** (⋯ or Settings, owners only): **our** staff.
5. Unread badge on bottom nav; mark read on open / header **⋯ → Mark all read**. Header **⋯** is a **floating** menu (same chrome as thread ⋯ / row long-press), not a sheet. **⋯ → Invite to connect** (one-tap share; not on ＋). **⋯ → Starred** (cross-chat starred messages) and **⋯ → Archived** (occasional lists, not peer tabs) — Archived is chats we hid with Archive; **Unarchive** on the row menu; open does not auto-unarchive (a new message still restores to All Chats). **⋯ → Select chats** (All Chats): tap rows (accent, no checkbox) → dock **Archive · Clear · Delete**. **Long-press** (or right-click) a row → floating menu **Pin · Mark as unread** (when already read) **· Mute · Archive / Unarchive · Clear chat · Delete chat** (1:1) or **Exit group**. Confirm Clear / Delete / Exit stays a sheet. Bulk tidy stays **your shop only**. Not copied from WhatsApp: Lock, Favourites, lists, Block (Network). A half-typed note stays on this device and shows **Draft: …** on the row. Archive hides the row (new message or **＋** Open existing or Unarchive brings it back to All Chats, not Requests). Clear empties history for us, row stays. Delete = clear + hide row. Confirm Clear and Delete. Cancel in the header. Requests stay Open / Ignore. ⋯ sits on the **Chats** title row with bell / You — not beside All Chats / Requests. Action disabled when nothing is unread. **Open thread like WhatsApp:** unread → land on first unread with **“N unread messages”** divider; no unread → newest + composer ready. Deep link `?message=` still wins. **Voice:** when the text box is empty, **hold mic** to record; **release** stages a preview (not auto-send). Too short / empty → toast, no send. Preview: play · **× delete** · Send. Slide left while holding cancels. Cap ~2 min. Bubble / quote note: compact play + progress + duration — no native `<audio>` chrome (Android).

## Business rules

| Rule | Detail |
|------|--------|
| Participant states | `active` · `pending` (requests) · `archived` (silent — decline / leave / block) |
| Unconnected first message | Recipient starts **pending**; reply/accept activates |
| Open-catalog order | Order / Ask rates on a discoverable post opens/activates a **trade thread** (both Active) with a living order card — **no** Connection and **not** the pending inbox. Distinct from cold Message |
| Block | Sender may still see a thread; recipient side is silently archived |
| Owner on cards | Design/collection cards show **Order goes to** the ticket party: **I handle** → sharer (you); **Direct** → design owner. Header is pack/design name (no Design/Collection label); who-acted lives under the header |
| Forward | **Text, photo, document, design, collection, order card** (not payment/system). Catalog: free for live published (not blocked); view on **open**. Order: forward card OK; **open** needs party (buyer/seller/facilitator) + hold/reveal. Non-party order teaser is **stripped** (no names/thumbs/amounts). Relist/Curate ≠ Forward. Locked packs: blurred thumbs; no PhotoViewer. |
| First share from Explore | Same as Forward — live published card, not blocked. Sender need not match Explore audience. |
| Message actions | Top-right chevron: **Reply · Forward · Copy · Star · Edit · Delete** (when applicable). **Photo** long-press opens that same Ekum menu (WhatsApp-style; not device Save). Other types: long-press still **Select** for forward. While **Selecting**, photo collage taps **toggle select** (do not open PhotoViewer). **No Select all** on thread forward mode (tap only); dock Cancel / Forward (n), **max 10**. **Quote one shot:** open the album → **Quote** on that photo. Composer and the reply bar show **that** thumb (not the whole collage). Menu Reply still quotes the album. No Order / Ask rates on the viewer. |
| Edit | Own **text** only, within **15 minutes** of send. Quiet **Edited** mark. |
| Delete | **Delete for me** (hide on our company). **Delete for everyone** on own messages within **1 hour** → tombstone “This message was deleted”. After window, for-me only. |
| Star | Toggle in menu; thread search filter **Starred** (this chat); **⋯ → Starred** cross-chat list (tap → thread `?message=`). |
| Who is on a chat | New chats start with **active owners**. Staff see it only after an owner adds them. Other shop sees **business name** only. No Private/Team word. |
| One 1:1 | One direct thread per company pair (**order home**). `findDirect` is the pair only. Do not create a second owner-only thread. |
| Groups | Unique by **other companies + your people** (self-leave and archived Team still count; owner × does not). Same shops + different staff = two groups OK. Create/add/× clone → **That’s the same as [name]. Open that chat?** No silent merge. |
| First reach | **Every active owner** is notified. Open chat / Ignore = any owner. Ignore is for the whole company. They can write again later (new request). Archived Team people are not notified. |
| Archived group inbound | If they write again and you have **not** Network-blocked them → ping owners again; Open restores inbox. `＋` Open existing also restores. |
| Block | Reuse Network **Block** (silent). While blocked: no first-reach ping, no archived-group ping. Unblock only from Network. |
| Mute | Per person (`ThreadMember.alertLevel` + `mutedUntil`). **8 hours / 1 week / Always**. Expired mute = unmuted. Other shop does not see that. |
| Mark unread | Our shop. Sets `lastReadAt` just before the last inbound so the row is “needs you” without opening. Opening still marks read. |
| Archived | Our shop. `inboxHiddenAt` set. Find again at **⋯ → Archived**. Unarchive or a new message returns it to All Chats. |
| Draft on list | Device-local composer text. Row shows **Draft: …** until send. |
| Seen | 1:1 only. **Seen** under the last outgoing when the other shop’s `lastReadAt` is at or after that message. Not staff ticks. Groups: no. |
| Typing | 1:1 header **{shop} typing…**. Heartbeat while the composer has text; stale after ~6s. Poll while the thread is open. Groups: no. |
| Pin message | One message per thread (everyone). Banner jumps to it. Unpin from the banner menu or **Unpin message**. Not the same as Pin chat. |
| Links | In chats + in-thread filter. Text with `http` / `www`. |
| Reactions | 👍 ❤️ 🙏. One per shop per message. Counts on the bubble. |
| Group photo | Group page: camera on the circle (owners). Thread ⋯ **Group photo** sheet still works. Shows on the group page and under the thread title. |
| Group name | Owners tap the name on the group page → edit in place (1–120). Empty keeps the last name. |
| Group one-line | Owners tap **Add a line** or the line → kit field expands there (80 chars). Not a sheet. |
| Group page | Tap group title. **Businesses · Media · Settings**. Businesses = shops (You / city), search, **＋** add connected. Below shops: **Your team** (our people). Owners **Add** / **×** staff. Quiet **Share invite** in the ＋ sheet opens OS share apps. Media = Photos / Documents / Designs / Collections (kind icons + colors, same as attach / In chats — not initials). Settings = Mute · Pin · Team on chat · Leave · Remove group. |
| Group invite | `/g/:token`. Join if connected to a shop on the group. Already in → open chat. Not connected → request to connect with the host. |
| Leave | Confirm first (Cancel / Leave). Off the thread, out of inbox. Your side only: “Priya left this chat.” Last **owner** on the 1:1 cannot Leave (mute instead). Groups: last owner on an empty our-side may Remove group or mute. Rejoin if live via Open existing. Leave is not Leave Team. |
| Remove group | Confirm first (Cancel / Remove group). Owner archives **our** company on that group (inbox gone, history kept). Other companies keep their thread. Not a hard delete. No Remove on the 1:1. |
| Team on chat | Owners toggle staff (⋯ only). Highlighted = on chat; tap to take off. Owner(s) at bottom. No search. |
| Roster vs company row | Company `ThreadParticipant` = request / archive / pin / read. Person `ThreadMember` = who can open it. |
| Access approve | Activates pending chat participants. **Open chat** on that pending thread also Approves a pending access request from them (one gate). |
| Team sender line | Your staff see **who on your team** sent each outgoing bubble (`Ravi` vs implicit you) as quiet text inside the bubble — on **every** teammate message once `senderUserId` is stored. Other businesses still see only your **business name** — never staff names. Messages sent before sender attribution may lack a name until backfilled. |
| Order card actors | Body says **You** (mine) or the other party’s **business name** — never Seller/Buyer |
| One living order reference | Each order has **one** trade-thread message (`order_card` / `rate`) that **updates in place**. Inquiry/order create + quote stay **rich bubble cards** (header = `Order #… Action`, kind badge, 3+1 thumbs). **Direction owns surface** (WhatsApp-like): **incoming** = light surface + Ekum teal left rail + dark text + teal View links; **outgoing** = solid Ekum teal + white text/links. Status (Requested / Updated / Dispatched / Accepted / Quote) is copy only — never a third fill. Quote keeps Accept CTA but still follows direction chrome. Later status pulses use the **same header grammar** as a compact chip with the same direction rule. Tap → order detail (full timeline). Legacy stacks: UI shows only the latest per order. |
| Payment card | One living `payment_card` per ask. Title includes the order id (`Payment · Order #… · ₹…` / `… · Paid`). Tap → order. Buyer **Paid**; seller **Mark received**. No Seller/Buyer on the card. |
| Buy for buyer | Seller-logged ticket: living order card + **Accept** (not Accept quote). Off-app `/o/:token`. |
| Order card CTAs | Quiet **View order →** (or **View inquiry →** while live `intent` is still inquiry / Ask rates; flips to View order after quote firms intent); whole card also opens the ticket; solid **Accept quote** only when live `canAcceptQuote` — never rewrite frozen Quote card copy |
| In-thread search | Header search opens **ListSearchRow** chrome: kit **SearchInput** (leading search icon, keyboard **Search**) + **46×46 filter** square (Orders / Explore — not WhatsApp chip strip). Close via header search again (or Esc) — no Done. Scope via filter menu; **Showing …** + Clear when not All. Typing shows hit stepper row (**Clear · N of M · ↑↓**). Empty scope browses that slice **newest at bottom**. Scopes: All / Photos / **Documents** / Collections / Designs / Orders / Starred. |
| Inbox search | Chats list search matches company/group name **and** message content (order #, shared design/collection, text). Deep hits show muted **In chat · …** why-line instead of last-message preview. Tap opens the thread. **Empty search (focused):** section **In chats** — Photos · Documents · Collections · Designs · **Links** (WhatsApp-style cross-chat find). **Orders** stay on the Orders tab (not here). Tap a kind → `/chats/find?kind=` results (Photos = month grid, one cell per image URL; Documents / Collections / Designs = list). **Photos tap** → PhotoViewer (swipe across find results); **Chat** in viewer → thread `?message=`. Other kinds tap → thread `?message=`. |
| Attach share | From **＋** → Design / Collection / **Photos** / **Document** / Order. **Match WhatsApp / Instagram muscle memory** unless Ekum has a clearly simpler path (e.g. one Photos row like Add designs). Design·Collection·Order: icon-only back, search, multi-select, **Send (n)**. **Photos**: phone → ContinuousCamera (Gallery on chrome); desktop → gallery; multi → **one album** collage message (WhatsApp-style). Tap → PhotoViewer. **Document** (WhatsApp-like): multi-pick → **one message per file**; file card with name · type · size; image-as-document shows a small thumb + opens as file (not album). Allowlist PDF / Word / Excel / CSV / text / original photo. No video. 15MB per file. Invalid types skipped with a toast; valid ones still send. |
| Leave guard | Composer draft, reply, attach selection, photo or document upload / open camera, or forward/select WIP → **Leave the page?** before back or bottom-nav away (Cancel default). |
| Composer | Multi-line like WhatsApp: text wraps, field grows up to ~5 lines then scrolls (no scrollbar chrome). **Enter** sends; **Shift+Enter** new line. **`@`** (start of a word) opens a compact pick **above the composer** — your teammates on this chat + the other shop(s). Not a sheet. Not the other shop’s staff. Tap inserts `@Name `. Mentioned people get a ping even if they muted. `@everyone` is out. |

Message types: text, photo, voice, document, collection_card, product_card, design_album, order_card, rate, payment_card, system. Voice: body = audio URL; metadata.durationMs (max 2 min). Document: body = file URL; metadata `{ url, fileName, contentType, sizeBytes? }`. **design_album**: metadata.productIds (≥2); chat card like a pack collage labeled **Designs** + **View designs →** → virtual set page `/designs/set?ids=…` (no My Catalog pack). Opens the shared **PhotoViewer** (one photo at a time; swipe / **next** arrow can land on the next design). Each frame and tile names the shop (**From {business}**) so mixed designs are not read as one Collection. Per-design audience/view rules on open.

Chat photo albums open the shared **PhotoViewer** (pinch / **vertical swipe** between photos in the album, WhatsApp-style; horizontal still works). Close returns to the thread. Document cards follow WhatsApp: name · type · size; original photos show a thumb but still open as a file (not PhotoAlbum).

## Edge cases / empty states

- Empty Chats → **Find businesses** → Explore (`Businesses Only` + search open).
- Empty **New** (no connections) → **Find on Ekum** link immediately, then name / mobile / GST if they tap with an empty search; **Find in Explore**. Other pickers still use the Find on Ekum **field**.
- Find on Ekum hit → **Request access** or **Message** (opens/starts a thread; not auto-connect). Already on the connection list → omitted from Find results (Add from the list above). Already in an **active chat** → **Message** only (no Request access; why-line **In chats**).
- Chats ＋ **Send invite** (after Find is opened) → connect link via OS share. Other pickers: invite only on a phone-like miss.
- Explore **Share** (Selection): **2+ designs** → one clubbed chat card (**View designs →** virtual set) and **48h link** kind `designs`; access stays per design. **1 collection + 1 design** → two chat cards and two 48h links (row stays).
- Empty New → short line that unknown businesses land here.
- Blocked counterpart → no confirmation of block in UI.
- Thread detail uses counterpart header (shell title suppressed).

## Seed walkthrough

1. As **Meena** or **Ravi**: open the seeded direct thread — text + Wedding Edit collection card.
2. Send a reply; confirm unread clears.
3. As an unconnected test company: message Ravi → appears under Ravi’s chat requests.

## Automated verification

- **Functional:** `pnpm test:e2e:functional` — `@chat` send + in-thread search + `＋` opens chat (no Private); `@chat` requests Open/Ignore; Document attach (`chat.document.journey.spec.ts`); inbox Select chats + row long-press + **⋯ Archived** (`chat.inbox-select.journey.spec.ts`)
- Completeness Phase B: `docs/superpowers/reviews/completeness/2026-09-23-chats-phase-b-completeness.md`
- Completeness mentions: `docs/superpowers/reviews/completeness/2026-09-23-chat-mentions-completeness.md`
- Completeness group info: `docs/superpowers/reviews/completeness/2026-09-23-group-info-completeness.md`, `2026-09-23-group-info-media-settings-completeness.md`, `2026-09-23-group-info-your-team-completeness.md`, `2026-09-23-group-info-team-manage-completeness.md`
- **Regression:** `pnpm test:e2e:smoke` + `pnpm --filter @ekum/web test` — PhotoAlbum BM-01, order card copy/dedupe, thread search helpers
- Completeness: `docs/superpowers/reviews/completeness/2026-09-01-chat-membership-completeness.md`, `2026-09-01-new-chat-sheet-completeness.md`, `2026-09-13-chat-document-attach-completeness.md`
- CI: units via `pnpm test`; E2E smoke via manual `workflow_dispatch`

## Where it lives

- Web: `apps/web/src/features/chats/` (`ChatsPage`, `ThreadPage`, `messagePreview`, `chatMessageActions`)
- API: `apps/api/src/conversation/`
- Contracts: `packages/domain-types/src/conversation.ts`
