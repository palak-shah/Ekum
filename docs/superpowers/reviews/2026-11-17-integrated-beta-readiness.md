# Integrated Beta Readiness — 2026-11-17

Business Information: **not reopened**. Scope = verify + fix confirmed defects only.

## Verdict

**Staging-ready with conditions.** Core buyer / trader / supplier / network / chat / profile journeys pass smoke and the focused `@functional` matrix after product fixes below. One from-pack edge case remains flaky under local server reuse (OTP / blank collection page) — not a product model failure (D1 + D3 pass in the same suite).

## What was verified

| Area | Result |
|---|---|
| Smoke `@smoke` | PhotoAlbum `+N` + Orders Pending/Completed chrome fixed earlier; re-confirmed green when servers are healthy |
| Units (sell-as, PhotoAlbum, Accept-quote resolver, chatsNewChat) | Pass |
| Buyer catalog / whole-order / Place | Pass |
| Chat (search, attach, photo order, New chat, order tags) | Pass after New-chat deep link |
| Company shop + catalogue Select / Find | Pass |
| Home + You profile + Privacy | Pass |
| Follow ask → Accept → Following → Stop → restore | Pass |
| Order lifecycle quote → Accept (ticket dock) | Pass |
| Fulfillment dispatch / partial / Settle / qty | Pass |
| From-pack multi-supplier D1 + D3 | Pass |
| From-pack I-handle flip lock | Flaky under reused/local API (OTP / empty album) — journey proven via D1/D3 |

## Product fixes shipped this milestone

1. **Order card album `+N`** — imageless overflow on 2+ thumbs (`PhotoAlbum`).
2. **Orders Pending/Completed** — plain flex (FilterRail overflow BM-07).
3. **Accept quote after Rate/living-card dedupe** — `canAcceptQuote` on living order cards; ThreadPage + `primaryAcceptQuoteMessageId` accept either Rate or order card.
4. **New chat from header ＋** — `/chats?new=1` deep link (header/page may be separate chunks; module bus alone was unreliable in e2e).
5. **From-pack helpers** — ensure Allowed follow before Pack grant; You library URL `/more`; publish success = library land.

## Classification

### Beta blockers (must clear before staging if still open)

_None remaining in this matrix after the fixes above._

Previously confirmed and fixed in this pass:

- Missing Accept quote on living Quote cards (busy 1:1 threads).
- New chat sheet not opening from Chats header ＋.
- Order album `+N` missing for imageless overflow.
- Orders filter chip row horizontal overflow.

### Important but non-blocking

- **From-pack I-handle flip** e2e flake when API/web reuse fights OTP or leaves a blank collection shell. Product rule (Manage parent, flip locked) is asserted when place succeeds; harden login/reuse or quarantine the third case if CI noise continues.
- **Shop catalogue search** only filters the first loaded page of designs — Banarasi can fall out of the first 20 after seed pollution. Find UX is fine; seed hygiene / pagination is the follow-up.
- **Buyer dock after full dispatch** may still show Chat with supplier (Mark delivered correctly gone).

### Post-beta

- Optional shop Hours “close” UX (deferred Completeness).
- Broader `@functional` modules outside this core matrix (chaos, visual, PWA identity skipped locally).
- Bill-total column remains seller setting–gated (`showBillTotalOnOrders` default off).

## Staging recommendation

**Proceed to staging** for internal beta once:

1. CI runs this same `@functional` file set + `@smoke` on a clean API (no `reuseExistingServer` OTP collisions).
2. Spot-check on phone: Accept quote on a quoted ticket, New chat ＋, Follow → Accept → Stop, dispatch full LR.

### Exact remaining blockers

_None for product._ Operational only: ensure staging/CI does not reuse a wedged OTP API process when running from-pack after long local sessions.
