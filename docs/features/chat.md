# Chat

## Purpose

Company-to-company messaging for trade: text, photos, voice, and **cards** (collection / product / order / rate) with server-side **source masking**.

## Who uses it

Any company. Unconnected first messages land in the recipient’s **Requests** inbox.

## User flows

1. Open **Chats** → search + **＋** (start chat with a company or new group); inbox tabs **All Chats** (active) / **Requests Received** (pending first contact). List tabs share the same search + trailing square chrome as Explore (filter) and Orders (＋).
2. Open thread → send text / photo; share design, collection, or order cards (same layout, **dense/narrow** so more messages fit on a phone); receive quote / order action cards from trade flows. **Explore / album Share** can also drop a `collection_card` into a chosen chat (catalogue → chat; same `allowForward` rules as Forward).
3. **Open chat** or **Ignore** a pending first-contact thread (not Accept/Decline — those words are for orders).
4. Pin chats; mute/leave/groups as supported later.
5. Unread badge on bottom nav; mark read on open / Mark all read when unread.

## Business rules

| Rule | Detail |
|------|--------|
| Participant states | `active` · `pending` (requests) · `archived` (silent — decline / leave / block) |
| Unconnected first message | Recipient starts **pending**; reply/accept activates |
| Open-catalog order | Order / Ask rates on a discoverable post opens/activates a **trade thread** (both Active) with a living order card — **no** Connection and **not** the pending inbox. Distinct from cold Message |
| Block | Sender may still see a thread; recipient side is silently archived |
| Owner on cards | Design/collection cards show **Order goes to** the ticket party: **I handle** → sharer (you); **Direct** → design owner. Sender (You/forwarder) sits above the card |
| No-forward lock | When `reference.allowForward === false`, non-owners cannot Forward (action hidden). API rejects with `FORWARD_NOT_ALLOWED`. Owner may still share. Same rule for `product_card` and `collection_card`. |
| First share from Explore | Allowed when the album/design is **discoverable** to your business (same bar as Explore) and not forward-locked — not only after it already appeared in a chat. |
| Message actions | Top-right chevron opens Reply / Forward / Select (long-press still works). While **Select** is on, floating **Select all** / **Clear** (forwardable messages in this thread). Dock: Cancel / Forward. |
| Owner-only threads | Hidden from staff even with chat permission. Owner starts **Only you**; shared 1:1 / groups are **Team can see**. `findDirect` keys on pair + visibility so Only you does not reopen the trade thread. |
| Mute | Local `ThreadAlertLevel`; never signalled to the other party |
| Access approve | Can activate pending chat participants when trust is granted |
| Team sender line | Your staff see **who on your team** sent each outgoing bubble (`Ravi` vs implicit you) as quiet text inside the bubble — on **every** teammate message once `senderUserId` is stored. Other businesses still see only your **business name** — never staff names. Messages sent before sender attribution may lack a name until backfilled. |
| Order card actors | Body says **You** (mine) or the other party’s **business name** — never Seller/Buyer |
| One living order reference | Each order has **one** trade-thread message (`order_card` / `rate`) that **updates in place**. Inquiry/order create + quote stay rich cards (designs clubbed, Order/Inquiry #) with a **dense mosaic** (~40% scale, narrow bubble) so more of the thread fits on a phone; later status pulses become a compact chip. Tap → order detail (full timeline). Legacy stacks: UI shows only the latest per order. |
| Payment card | One living `payment_card` per ask (amount → **Paid**). Tap → order. Buyer **Paid**; seller **Mark received**. No Seller/Buyer on the card. |
| Buy for buyer | Seller-logged ticket: living order card + **Accept** (not Accept quote). Off-app `/o/:token`. |
| Order card CTAs | Quiet **View order →** (whole card also opens order); solid **Accept quote** only when live `canAcceptQuote` — never rewrite frozen Quote card copy |
| In-thread search | Header search opens a **tight two-row band** (input + chips; no helper line). Scope chips **All · Photos · Collections · Designs · Orders**. Empty chip browses that slice **newest at bottom** (WhatsApp). Typing narrows within scope; stepper **N of M** + ↑↓ sits on the input row — starts at newest match (bottom), ↑ older. Photos = photo messages; Collections / Designs = shared cards; Orders = living order/rate refs (deduped). Search is case-insensitive. |
| Inbox search | Chats list search matches company/group name **and** message content (order #, shared design/collection, text). Deep hits show muted **In chat · …** why-line instead of last-message preview. Tap opens the thread. |
| Attach share | From **＋** → Design / Collection / Order: icon-only back, hidden list scrollbar, **search**, tap rows to multi-select (accent border), **Select all** / **Clear** on the filtered list, sticky **Send (n)** posts each as its own chat card. Photos stay the device picker. |
| Leave guard | Composer draft, reply, attach selection, photo upload, or forward/select WIP → **Leave the page?** before back or bottom-nav away (Cancel default). |

Message types: text, photo, voice, collection_card, product_card, order_card, rate, payment_card, system.

Chat photo albums open the shared **PhotoViewer** (pinch / swipe within that album). Close returns to the thread.

## Edge cases / empty states

- Empty Chats → **Find businesses** → Explore.
- Empty New → short line that unknown businesses land here.
- Blocked counterpart → no confirmation of block in UI.
- Thread detail uses counterpart header (shell title suppressed).

## Seed walkthrough

1. As **Meena** or **Ravi**: open the seeded direct thread — text + Wedding Edit collection card.
2. Send a reply; confirm unread clears.
3. As an unconnected test company: message Ravi → appears under Ravi’s chat requests.

## Automated verification

- **Functional:** `pnpm test:e2e:functional` — `@chat` send + in-thread search scopes/stepper
- **Regression:** `pnpm test:e2e:smoke` + `pnpm --filter @ekum/web test` — PhotoAlbum BM-01, order card copy/dedupe, thread search helpers
- Completeness: `docs/superpowers/reviews/completeness/2026-08-11-chat-completeness.md`
- CI: units via `pnpm test`; E2E smoke via manual `workflow_dispatch`

## Where it lives

- Web: `apps/web/src/features/chats/` (`ChatsPage`, `ThreadPage`, `messagePreview`, `chatMessageActions`)
- API: `apps/api/src/conversation/`
- Contracts: `packages/domain-types/src/conversation.ts`
