# TradeLane — path, reveal, desk

**Date:** 2026-09-02  
**Status:** Shipped for Your paths + ticket Me/mill + reveal; Agent still out  
**Client lock:** first pair order = I handle, no group; four outcomes via two wholesaler switches  
**Shipped desk:** [I-handle desk](./2026-09-07-trader-i-handle-desk-design.md) = reveal Off; reveal On Completeness [2026-09-07-tradelane-reveal-on](../reviews/completeness/2026-09-07-tradelane-reveal-on-completeness.md); Your paths Completeness [2026-09-08-your-paths](../reviews/completeness/2026-09-08-your-paths-completeness.md)  
**Redesign (approved direction):** Multi-supplier Place → always [main + linked lots](./2026-09-08-unified-main-linked-lots-design.md); Direct = transparent desk, not N batch tickets. Completeness Redesign `2026-09-08-unified-main-linked-lots` — no code until Proceed slice.  
**Supersedes for new pairs:** Profile-only Direct default and “always hide the other end” in [2026-08-21-direct-vs-handle-settings-design.md](./2026-08-21-direct-vs-handle-settings-design.md)  
**Anchors:** [orders.md](../../features/orders.md), [settings.md](../../features/settings.md), [2026-09-02-trader-path-client-review.md](../reviews/2026-09-02-trader-path-client-review.md)

## Problem

Traders need a quiet first order and a place to change “who the ticket is with” and “can mill and retail see each other” **per supplier × buyer**, at the moment they feel it (More / order page), not on every share.

## Record

`TradeLane` (one per trader company × seller company × buyer company):

| Field | Values | Default on first create |
|-------|--------|-------------------------|
| `ticket` | `me` (I handle) · `mill` (Direct) | `me` |
| `reveal` | `false` · `true` | `false` |

Four outcomes = those two fields. UI is **two switches**, never four radios.

| ticket | reveal | Chat | Order counterpart (buyer) |
|--------|--------|------|---------------------------|
| `me` | false | Two 1:1s: buyer–trader, trader–seller | Trader |
| `me` | true | One group per mill. **Reveal On ⇒ mill named on main order and in chat** (soft-hide off for that mill). Living card = mill subset. | Trader |
| `mill` | false | Buyer–seller 1:1; trader sees order on list | Seller |
| `mill` | true | Same group of three | Seller |

Reveal on ⇒ group exists (create once, reuse). Reveal off ⇒ no trio group. Group title = three **business** names; any of the three companies’ owners may rename (system line: who changed it). Team: each shop’s owners add staff to **this** group; roster change does not spawn a second group.

## When the lane is read

1. **New pair** (no row): behave as `me` + `reveal=false`. Do not stamp Profile Direct onto the first ticket.
2. **Existing pair:** next share/order/publish/curate through this trader for that seller+buyer uses the lane.
3. **Writes:** More on the order/share sheet, **order detail**, **Your paths**. Same copy both places.

### Copy (wholesaler)

- **This order is with** → **Me** / **{seller shop name}**
- **{Seller} and {buyer} can see each other** → Off / On  
  - On: *One group chat. Order updates go there.*  
  - Off: *They only talk to you, not to each other.*

Everyday Place / Send: **no** these controls.

## Your paths

Route under **You** (Settings): `/settings/paths` (name in UI: **Your paths**).

- Search shop name.
- List: supplier · buyer on each card; **inline** Me / {mill} and see-each-other Off/On (tap saves that row).
- Empty: no pairs until a first middle-hop order exists.
- Saves update `TradeLane` for **future** orders only. Changing ticket/reveal on a **live** order (order page) applies to that order and updates the lane.

Needs **I trade on Ekum**. Buy-only / sell-only without trading: no desk.

## Profile

**When buyers order from what I share** was removed. Path lives only on **Your paths** (and live order switches). New lane = I handle + no reveal.

## Out of scope here

- Agent capability (no rules).
- Forward vs view vs relist (separate spec).
- Send-hold / hide-the-hop as the *only* legal I-handle shape — hide is **reveal=false**; group is **reveal=true**.
- Collection-as-order qty (separate).

## Tests (when built)

- First middle-hop order creates lane `me`/`false`; no group. **Shipped.**
- Order page mill card persists reveal; Your paths persists ticket + reveal for **future**. **Shipped.**
- Reveal on creates or reuses one trio group after Send; Send-hold defers mill in group. **Shipped.**
- Your paths search + edit. **Shipped.**
- Live ticket flip while Requested + no quote. **Shipped** (single mill).
- Publish / share path radios removed. **Shipped.**
