# TradeLane — path, reveal, desk

**Date:** 2026-09-02  
**Status:** Direct links under Network (2026-10-28). Ticket/reveal UI retired — a Direct Link **is** mill ticket + trio. Agent still out.  
**Client lock:** no Direct Link = I handle, no group until Send; Direct Link = mill ticket + **one** mill–buyer–trader group (same three shops in any name order; create/reuse on Save; Place and trader mill Order for buyer join that thread — never a second trio). Mill own-catalog Order for buyer stays mill–buyer 1:1 (not the trio). Completeness: `2026-10-29-one-trio-collapse-completeness`.  
**Shipped desk:** [I-handle desk](./2026-09-07-trader-i-handle-desk-design.md) for no-link mills. Completeness [2026-10-28-direct-links-network-completeness](../reviews/completeness/2026-10-28-direct-links-network-completeness.md). Mixed Place: `2026-10-28-direct-link-order-workflow-completeness`.  
**Place routing:** eligible Direct Link → Direct mill ticket + trio at Place. No link → Manage parent + mill hops. Removing a Direct Link does not reroute open tickets. I-handle desk for remaining mills: [unified main + linked lots](./2026-09-08-unified-main-linked-lots-design.md).  
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

Four outcomes remain in storage. Product UI is **one bit**: Direct Link exists or not. Direct Link create always persists `ticket=mill`, `reveal=true`. No live ticket/reveal editing.

| ticket | reveal | Chat | Order counterpart (buyer) |
|--------|--------|------|---------------------------|
| `me` | false | Two 1:1s: buyer–trader, trader–seller | Trader |
| `me` | true | One group per mill. **Reveal On ⇒ mill named on main order and in chat** (soft-hide off for that mill). Living card = mill subset. | Trader |
| `mill` | false | Buyer–seller 1:1; trader sees order on list | Seller |
| `mill` | true | Same group of three | Seller |

Reveal on ⇒ group exists **after Send** (create once, reuse). Your paths PATCH must not create the trio while a hop is still Waiting. Reveal off ⇒ no trio group. Group title = three **business** names; any of the three companies’ owners may rename (system line: who changed it). Team: each shop’s owners add staff to **this** group; roster change does not spawn a second group.

`TradeLane.behaviors` JSON: `directOrder` on for Direct Links. Auto-repost is **not** a per-lane toggle — eligibility is Direct Link + discoverable source + `allowForward`. Audience = **Selected** Direct Link buyers for that supplier (not the trader’s Followers). `showSourceShops` on (`From {shop}`). Creating the link does not copy live albums; only collections created after the link hop. One pack per trader × canonical root; existing pack gets source design adds in place. Manual Followers Repost reuses that pack. Completeness: `2026-10-28-auto-repost-selected-buyer-completeness`, `2026-10-28-auto-repost-future-only-supplier-completeness`. Direct Links UI: **Supplier** (not Mill). List is Supplier | Buyer | Remove (completeness `2026-10-28-direct-links-compact-list-completeness`). Locked On rows (including auto-repost last: **New supplier posts go to this buyer**) live on the ＋ sheet only (completeness `2026-10-28-direct-link-auto-repost-row-completeness`).

## When the lane is read

1. **New pair** (no row): behave as `me` + `reveal=false`. Do not stamp Profile Direct onto the first ticket.
2. **Existing pair:** next share/order/publish/curate through this trader for that seller+buyer uses the lane.
3. **Writes:** Network **Direct links** create/remove (and follow-revoke cleanup). Order page has no ticket/reveal pick.

### Copy (wholesaler)

- **This order is with** → **Me** / **{seller shop name}**
- **{Seller} and {buyer} can see each other** → Off / On  
  - On: *One group chat. Order updates go there.*  
  - Off: *They only talk to you, not to each other.*

Everyday Place / Send: **no** these controls.

## Direct links (Network)

Route: `/network/direct-links`. Legacy `/settings/paths` and `/settings/your-paths` redirect here.

- Search shop name.
- List: mill · buyer. Locked mill ticket + trio (no ticket/reveal rows).
- **＋** mill = shops I follow; buyer = shops that follow me.
- Empty until they add a Direct Link.
- Create/remove is **future** orders only (open tickets stay). Follow/unfollow that would drop a link confirms first; server deletes only affected lanes and closes that lane’s `groupThreadId`.

Needs **I trade on Ekum**. Buy-only / sell-only without trading: no Direct links row.

## Profile

**When buyers order from what I share** was removed. Path lives on **Direct links**. No Direct Link = I handle + no reveal.

## Out of scope here

- Agent capability (no rules).
- Forward vs view vs relist (separate spec).
- Send-hold / hide-the-hop as the *only* legal I-handle shape — hide is **reveal=false**; group is **reveal=true**.
- Collection-as-order qty (separate).

## Tests (when built)

- First middle-hop order creates lane `me`/`false`; no group. **Shipped.**
- Live ticket/reveal editing retired; Direct Link create persists mill + trio. **Shipped.**
- Direct Place opens mill–buyer–trader group immediately; I-handle stays private until Send. **Shipped.**
- Network Direct links search + create/remove; follow-revoke confirm. **Shipped.**
- Live ticket flip while Requested + no quote. **Shipped** (single mill).
- Publish / share path radios removed. **Shipped.**
