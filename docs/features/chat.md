# Chat

## Purpose

Company-to-company messaging for trade: text, photos, voice, and **cards** (collection / product / order / rate) with server-side **source masking**.

## Who uses it

Any company. Unconnected first messages land in the recipient’s **Requests** inbox.

## User flows

1. Open **Chats** → search + **＋**. One sheet, sequential (no pills). **New chat** = pick businesses first (Find on Ekum is a **link** after 2+ characters in search, or **immediately** if there are no connections; tap shows shops **not already in Connections**; **Send invite** is OS share / copy — not a phone-book sync; empty query + no connections → name / mobile / GST field after tap). Need at least one other business. Owner with staff: **Next** → **Add your team** (**Optional — add teammates or skip** inline link when two+ shops; search when 10+ staff; **Select all** / **Clear**). One footer: **Open chat with {business}** (one shop) or **Next** (two+). Success toast says **Chat started** / **Opened chat** / **Back in chat** from API `opened`. Two+ shops then **New group** (name) → **Create**. No staff / not owner: one shop **Open chat**; two+ **Next** → name. Header **Back** is the previous step (keeps picks); **Close** dismisses. Sheet height is fixed; steps stay mounted (hide, don’t remount). Inbox tabs **All Chats** / **Requests Received**. List chrome matches Explore (filter) and Orders (＋). Inbox/headers show **business name** (or group title) only — no Team/Private labels. Rows stay flat (not cards): company is primary; Order / Quote / Photo / Return (etc.) is the object line when the last message is not plain text.
2. Open thread → send text / photo; share design, collection, or order cards (**uniform layout** — header is the primary: `Order #… Requested` / pack name / design name; **kind badge + left color rail** (Order teal / Collection steel / Design clay); white/surface fill with **restrained teal** on rail, badge, links, and primary CTAs — not solid teal bubble fills; who, detail, CTA below; inline thumbs left; ~92% width; no Design/Collection type-label line — CTA names the kind); receive quote / order action cards from trade flows. **Explore / album Share** can also drop a `collection_card` into a chosen chat (catalogue → chat). **Forward is free** for live published cards (blocked senders still cannot); opening the pack still checks view with the catalog owner. Share failures show **InlineNotice** in the sheet.
3. **Open chat** or **Ignore** a pending first-contact thread (not Accept/Decline — those words are for orders).
4. Pin. **Mute** (stay on, no pings — other shop does not see). **Leave** (confirm sheet → off this chat; rejoin via `＋` → Open existing if still live). Last owner on the shop **1:1** cannot Leave — they mute. Groups: owner can **Remove group** (confirm sheet → archive for our shop). **Team on chat** (⋯, owners only): staff list — on chat highlighted **Selected**, tap to take off; tap **Add** to include. Owner(s) pinned at the bottom. Saves immediately.
5. Unread badge on bottom nav; mark read on open / Mark all read when unread. **Open thread like WhatsApp:** unread → land on first unread with **“N unread messages”** divider; no unread → newest + composer ready. Deep link `?message=` still wins. **Voice:** when the text box is empty, **hold mic** to record; **release** stages a preview (not auto-send). Too short / empty → toast, no send. Preview: play · **× delete** · Send. Slide left while holding cancels. Cap ~2 min. Bubble: play/pause + duration.

## Business rules

| Rule | Detail |
|------|--------|
| Participant states | `active` · `pending` (requests) · `archived` (silent — decline / leave / block) |
| Unconnected first message | Recipient starts **pending**; reply/accept activates |
| Open-catalog order | Order / Ask rates on a discoverable post opens/activates a **trade thread** (both Active) with a living order card — **no** Connection and **not** the pending inbox. Distinct from cold Message |
| Block | Sender may still see a thread; recipient side is silently archived |
| Owner on cards | Design/collection cards show **Order goes to** the ticket party: **I handle** → sharer (you); **Direct** → design owner. Header is pack/design name (no Design/Collection label); who-acted lives under the header |
| Forward | **Text, photo, design, collection, order card** (not payment/system). Catalog: free for live published (not blocked); view on **open**. Order: forward card OK; **open** needs party (buyer/seller/facilitator) + hold/reveal. Non-party order teaser is **stripped** (no names/thumbs/amounts). Relist/Curate ≠ Forward. Locked packs: blurred thumbs; no PhotoViewer. |
| First share from Explore | Same as Forward — live published card, not blocked. Sender need not match Explore audience. |
| Message actions | Top-right chevron: **Reply · Forward · Copy · Star · Edit · Delete** (when applicable). Long-press still selects for forward. **No Select all** on thread forward mode (tap only); dock Cancel / Forward (n), **max 10**. |
| Edit | Own **text** only, within **15 minutes** of send. Quiet **Edited** mark. |
| Delete | **Delete for me** (hide on our company). **Delete for everyone** on own messages within **1 hour** → tombstone “This message was deleted”. After window, for-me only. |
| Star | Toggle in menu; thread search filter **Starred**; **You → Starred** cross-chat list (tap → thread `?message=`). |
| Who is on a chat | New chats start with **active owners**. Staff see it only after an owner adds them. Other shop sees **business name** only. No Private/Team word. |
| One 1:1 | One direct thread per company pair (**order home**). `findDirect` is the pair only. Do not create a second owner-only thread. |
| Groups | Unique by **other companies + your people** (self-leave and archived Team still count; owner × does not). Same shops + different staff = two groups OK. Create/add/× clone → **That’s the same as [name]. Open that chat?** No silent merge. |
| First reach | **Every active owner** is notified. Open chat / Ignore = any owner. Ignore is for the whole company. They can write again later (new request). Archived Team people are not notified. |
| Archived group inbound | If they write again and you have **not** Network-blocked them → ping owners again; Open restores inbox. `＋` Open existing also restores. |
| Block | Reuse Network **Block** (silent). While blocked: no first-reach ping, no archived-group ping. Unblock only from Network. |
| Mute | Per person on the thread (`ThreadMember.alertLevel`). Stay on the chat. Other shop does not see that. Unmute is the same control. |
| Leave | Confirm first (Cancel / Leave). Off the thread, out of inbox. Your side only: “Priya left this chat.” Last **owner** on the 1:1 cannot Leave (mute instead). Groups: last owner on an empty our-side may Remove group or mute. Rejoin if live via Open existing. Leave is not Leave Team. |
| Remove group | Confirm first (Cancel / Remove group). Owner archives **our** company on that group (inbox gone, history kept). Other companies keep their thread. Not a hard delete. No Remove on the 1:1. |
| Team on chat | Owners toggle staff (⋯ only). Highlighted = on chat; tap to take off. Owner(s) at bottom. No search. |
| Roster vs company row | Company `ThreadParticipant` = request / archive / pin / read. Person `ThreadMember` = who can open it. |
| Access approve | Can activate pending chat participants when trust is granted |
| Team sender line | Your staff see **who on your team** sent each outgoing bubble (`Ravi` vs implicit you) as quiet text inside the bubble — on **every** teammate message once `senderUserId` is stored. Other businesses still see only your **business name** — never staff names. Messages sent before sender attribution may lack a name until backfilled. |
| Order card actors | Body says **You** (mine) or the other party’s **business name** — never Seller/Buyer |
| One living order reference | Each order has **one** trade-thread message (`order_card` / `rate`) that **updates in place**. Inquiry/order create + quote stay **rich bubble cards** (header = `Order #… Action`, kind badge, 3+1 thumbs). **Direction owns surface** (WhatsApp-like): **incoming** = light surface + Ekum teal left rail + dark text + teal View links; **outgoing** = solid Ekum teal + white text/links. Status (Requested / Updated / Dispatched / Accepted / Quote) is copy only — never a third fill. Quote keeps Accept CTA but still follows direction chrome. Later status pulses use the **same header grammar** as a compact chip with the same direction rule. Tap → order detail (full timeline). Legacy stacks: UI shows only the latest per order. |
| Payment card | One living `payment_card` per ask. Title includes the order id (`Payment · Order #… · ₹…` / `… · Paid`). Tap → order. Buyer **Paid**; seller **Mark received**. No Seller/Buyer on the card. |
| Buy for buyer | Seller-logged ticket: living order card + **Accept** (not Accept quote). Off-app `/o/:token`. |
| Order card CTAs | Quiet **View order →** (or **View inquiry →** while live `intent` is still inquiry / Ask rates; flips to View order after quote firms intent); whole card also opens the ticket; solid **Accept quote** only when live `canAcceptQuote` — never rewrite frozen Quote card copy |
| In-thread search | Header search opens **ListSearchRow** chrome: kit **TextInput** + **46×46 filter** square (Orders / Explore). Close via header search again (or Esc) — no Done. Scope via filter menu; **Showing …** + Clear when not All. Typing shows hit stepper row (**Clear · N of M · ↑↓**). Empty scope browses that slice **newest at bottom**. Photos / Collections / Designs / Orders / Starred as before. |
| Inbox search | Chats list search matches company/group name **and** message content (order #, shared design/collection, text). Deep hits show muted **In chat · …** why-line instead of last-message preview. Tap opens the thread. |
| Attach share | From **＋** → Design / Collection / **Camera** / **Photos** / Order. Design·Collection·Order: icon-only back, search, multi-select, **Send (n)**. **Camera** (phone): shared ContinuousCamera → Done sends **one** photo album message; Cancel sends nothing; Gallery on chrome = same as Photos. ContinuousCamera start must not restart when the parent re-renders (e.g. closing the attach sheet). Desktop Camera opens gallery. **Photos**: device gallery multi-pick → one album. Tap album → PhotoViewer (swipe/pinch). |
| Leave guard | Composer draft, reply, attach selection, photo upload / open camera, or forward/select WIP → **Leave the page?** before back or bottom-nav away (Cancel default). |
| Composer | Multi-line like WhatsApp: text wraps, field grows up to ~5 lines then scrolls (no scrollbar chrome). **Enter** sends; **Shift+Enter** new line. |

Message types: text, photo, voice, collection_card, product_card, order_card, rate, payment_card, system. Voice: body = audio URL; metadata.durationMs (max 2 min).

Chat photo albums open the shared **PhotoViewer** (pinch / swipe within that album). Close returns to the thread.

## Edge cases / empty states

- Empty Chats → **Find businesses** → Explore (`Businesses Only` + search open).
- Empty **New** (no connections) → **Find on Ekum** link immediately, then name / mobile / GST if they tap with an empty search; **Find in Explore**. Other pickers still use the Find on Ekum **field**.
- Find on Ekum hit → **Request access** or **Message** (opens/starts a thread; not auto-connect). Already on the connection list → omitted from Find results (Add from the list above).
- Chats ＋ **Send invite** (after Find is opened) → connect link via OS share. Other pickers: invite only on a phone-like miss.
- Explore **Share** with no chats → same **Find in Explore** CTA; single album/design still offers **48h link**.
- Empty New → short line that unknown businesses land here.
- Blocked counterpart → no confirmation of block in UI.
- Thread detail uses counterpart header (shell title suppressed).

## Seed walkthrough

1. As **Meena** or **Ravi**: open the seeded direct thread — text + Wedding Edit collection card.
2. Send a reply; confirm unread clears.
3. As an unconnected test company: message Ravi → appears under Ravi’s chat requests.

## Automated verification

- **Functional:** `pnpm test:e2e:functional` — `@chat` send + in-thread search + `＋` opens chat (no Private); `@chat` requests Open/Ignore
- **Regression:** `pnpm test:e2e:smoke` + `pnpm --filter @ekum/web test` — PhotoAlbum BM-01, order card copy/dedupe, thread search helpers
- Completeness: `docs/superpowers/reviews/completeness/2026-09-01-chat-membership-completeness.md`, `2026-09-01-new-chat-sheet-completeness.md`
- CI: units via `pnpm test`; E2E smoke via manual `workflow_dispatch`

## Where it lives

- Web: `apps/web/src/features/chats/` (`ChatsPage`, `ThreadPage`, `messagePreview`, `chatMessageActions`)
- API: `apps/api/src/conversation/`
- Contracts: `packages/domain-types/src/conversation.ts`
