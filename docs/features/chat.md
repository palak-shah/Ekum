# Chat

## Purpose

Company-to-company messaging for trade: text, photos, voice, and **cards** (collection / product / order / rate) with server-side **source masking**.

## Who uses it

Any company. Unconnected first messages land in the recipient’s **Requests** inbox.

## User flows

1. Open **Chats** → search + **＋** (start chat with a company or new group); inbox tabs **Chats** (active) / **New** (pending first contact). List tabs share the same search + trailing square chrome as Explore (filter) and Orders (＋).
2. Open thread → send text / photo; share design, collection, or order cards; receive quote / order action cards from trade flows.
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
| Owner on cards | Design/collection cards show `from {owner company}`; sender (You/forwarder) sits above the card |
| No-forward lock | When `reference.allowForward === false`, non-owners cannot Forward (action hidden). API rejects with `FORWARD_NOT_ALLOWED`. Owner may still share. Same rule for `product_card` and `collection_card`. |
| Message actions | Top-right chevron opens Reply / Forward / Select (long-press still works) |
| Owner-only threads | Hidden from staff even with chat permission (domain-ready) |
| Mute | Local `ThreadAlertLevel`; never signalled to the other party |
| Access approve | Can activate pending chat participants when trust is granted |
| Order card actors | Body says **You** (mine) or the other party’s **business name** — never Seller/Buyer |
| One living order reference | Each order has **one** trade-thread message (`order_card` / `rate`) that **updates in place**. Inquiry/order create + quote stay rich cards (designs clubbed, Order/Inquiry #); later status pulses become a compact chip. Tap → order detail (full timeline). Legacy stacks: UI shows only the latest per order. |
| Order card CTAs | Quiet **View order →** (whole card also opens order); solid **Accept quote** only when live `canAcceptQuote` — never rewrite frozen Quote card copy |
| In-thread search | Header search opens a band (no always-on filter rail). Scope chips **All · Media · Orders** live inside search. Empty **Orders** / **Media** browses that slice; typing narrows within scope. Match stepper **N of M** + ↑↓ jumps hits in the timeline. Media = photos/voice; Orders = living order/rate refs (deduped). Catalog cards stay in All / text search. |

Message types: text, photo, voice, collection_card, product_card, order_card, rate, system.

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
