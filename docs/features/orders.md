# Orders, samples & returns

## Purpose

Trade execution after trust **or open catalog**: place and fulfill **orders** (standard or photo), request **samples**, and manage **returns** (with escalate → **complaint**). **Discoverable** designs/collections (e.g. audience Everyone) can be ordered **without** an active Connection; restricted audiences still need connection / selection / follow as published. Photo orders and samples without a discoverable product still need a connection.

Sellers can fulfill **partially**: quote fewer qty / skip designs, confirm or decline lines, and split dispatch across multiple LRs.

## Who uses it

Buyers place / accept quotes; sellers quote, confirm, dispatch, deliver. Samples and returns are managed from the **Orders** tab (unified feed + type filter).

## User flows

### Orders (`/orders`)

| Kind | How |
|------|-----|
| **Standard** | Pick published designs / lines → quantities → place request. **I-handle curated pack:** ticket and chat are with the pack owner (trader), not the mill — `POST /orders/from-pack`. **Multi-supplier** (own / Direct): `POST /orders/batch` creates **one order per `product.companyId`**, then a confirmation with a **link per chat** (partial failures listed). |
| **Photo** | **＋ → Photo order** — phone: **Add photos** opens continuous in-app camera (multi-shot; torch/zoom when supported); **Gallery** in camera chrome for file pick. Desktop: Add opens gallery multi-select directly. Then per-photo pieces (presets set all), supplier (unless `?seller=`), **note** (text and/or **voice**), send. Leaving mid-flow prompts **Leave the page?** — Cancel stays; Leave discards. |
| **Inquiry** | From a collection: **Ask for rates** creates a `requested` trade with `intent: inquiry` (same lines/quote path). UI says **Inquiry** (not Order); chat card `Inquiry #… · Inquiry`. Soft until firmed. |

Lifecycle actions (role-dependent): confirm, add rates / accept quote, decline, dispatch (LR/transporter), deliver, cancel. Buyer may **Edit inquiry/order** (qty / remove lines) until the seller quotes or confirms/declines — each edit **updates** the living chat card (**Updated**). Action failures show **in the open sheet** or as a **toast** on page CTAs — never as a buried line behind the sheet.

**Inquiry firm-up:** `intent` flips to `order` when the seller sends a **quote**, confirms any lines, or the buyer **accepts quote**. Decline/cancel stay terminal. Later chat cards use `Order #`.

### Dual trade (Trading on)

Needs **I trade on Ekum**. Path is a **TradeLane** per trader × supplier × buyer — two fields, four outcomes. UI is **two switches**, never four radios. See [TradeLane](../superpowers/specs/2026-09-02-tradelane-design.md) and [client one-pager](../superpowers/reviews/2026-09-02-trader-path-client-review.md).

| This order is with | They see each other | What happens |
|--------------------|---------------------|--------------|
| **Me** (I handle) | Off *(first pair order)* | Buyer’s ticket is the trader. Two private chats. Mill tickets stay **Waiting** until **Send** (or **Change** qty/rate, then Send). Seller cannot list them before Send. **Trader desk:** one list row (the buyer ticket) marked **Trading**, with mill shop names on that row. Find by mill name or mill `#` still hits this row — never a mill subset row. Mills are **subsets** on that page (qty/rate, Send per shop). Desk face **Send quote** only after a mill has quoted; quoting Meena without asking the mill sits under **Take over** with Open chat / Decline / payment / dispatch / settle / View (else nothing). **Confirm** stays off so the trader does not lock the buyer before **Send**. After a mill quotes, each design on that mill card shows **From {shop}** vs **To {buyer}** (or Not sent yet); Send quote prefills from mill rates. After Send, mill `#` sits beside the shop; mill chat uses that `#` and opens the buyer ticket. After Send, mill confirm / qty / dispatch **pass through**; mill **quote** waits until the trader sends rates to the buyer. When the buyer **accepts quote**, released mills become confirmed so they can Dispatch / Ask for payment. Rare **Hold** / **Resume** live last in that mill’s **⋯** (not on the card). See [I-handle desk](../superpowers/specs/2026-09-07-trader-i-handle-desk-design.md). |
| **Me** | On | Same ticket (trader). **One** group: supplier + trader + buyer. Order updates go there after Send-hold rules allow. |
| **{Supplier shop}** (Direct) | Off | Buyer’s ticket is the design owner. Sharer sees **Shared**. Confirm lists each owner name when several. Buyer–seller private chat. |
| **{Supplier shop}** | On | Same Direct ticket. Same trio group (not a second group). |

**First order** for a new pair: **Me**, see-each-other **Off**. Everyday Place / Send has **no** path controls. Change on **More** (that sheet), the **order page**, or **Your paths** (You). We remember the pair until they change; the next order follows the lane.

Reveal **Off** still only *hides* the other end on tickets — we do **not** block Connection or chat if they find each other. Escape Direct → **Take over** while still requested with no seller quote (same moment as flipping **This order is with** to Me).

Shipped code may still stamp Profile / pack `path=` until TradeLane is built; product default for a **new** pair is I handle + no group even if Profile says Direct. Older per-share override: [2026-08-21](../superpowers/specs/2026-08-21-direct-vs-handle-settings-design.md).

**Clarity:** Chat cards: **Forwarded by {name}** when sharer ≠ owner. Open-path list for forwarder: **Shared** (not You sell); counterpart = seller. **Toll / soft-hide (chain-safe):** On every I-handle **Manage** parent ticket and its trade chat, **never** show upstream mill/shop names — only the two parties on that hop. No **Related orders** box on detail (desk = mill cards for the trader; end buyer sees only the trader hop). Mill identity stays on subset tickets and trader mill desks. Applies when Meena is herself a trader to the next hop. Lists otherwise **You buy** / **You sell**. Orders tab is a **unified feed** (orders + samples + returns), newest-first. Top chrome matches Chats/Explore: **search + filter icon + trailing ＋** (new order). Filter menu lists statuses (Requested through Cancelled, including **Settled**) plus type (Order / **Trading** / Sample / Return). **Trading** is I-handle tickets you sell (linked mill lots on that row). Find words `trading` or `linked` apply the same type. When a menu filter is on, **Showing … · Clear** appears under the search row. **Find** (any query, kind, status, or date) shows **all** matching rows — attention chips Needs you / In progress / **Completed** apply only when Find is empty. `/samples` and `/returns` redirect here with `?kind=`; status deep links use `?status=`. Tiles may show a short staff name when known. Order detail **Timeline** reads the append-only order trail (who / when / note); falls back to derived steps when trail is empty. Your team sees staff names on your actions; counterparties see business names only. Parties card may still show last-touch staff · date. Buyers never see “confirm” verbs: when they accepted a quote, timeline and Parties say **Quote accepted by …**; when the seller locked supply, **Confirmed by …**. CTAs stay role-owned (buyer: Accept quote / Cancel / Raise return; seller: Quote / Confirm lines / Dispatch more / Settle order). Chat keeps **one living reference** per order: rich card for ask-rates / place-order / quote; later statuses update that same message (including `order_settled`). **View order →** / tap opens the order; **Accept quote** only while `canAcceptQuote`.

### Samples & returns (on Orders)

Samples and returns appear in the same `/orders` list (meta line says Sample / Return). Find → **Sample** or **Return**, or open `/orders?kind=sample|return`. Sample rows are glanceable (no detail route yet); return rows open the related order with `?return=` so detail shows and highlights that return.

**Sample (planned):** a toggle on the order builder marks the trade as a sample — an indicator only, same lifecycle as a normal order (parallel to **Inquiry**). No separate Samples menu or ＋ entry.

| Need | How |
|------|-----|
| **Quote partial** | Send quote sheet: lower offer qty, toggle **Can’t supply** per line, set rates (**Same rate for all** or each design; qty + rate on one line), optional **note** (text and/or **voice**) → chat **Quote** card (totals frozen on that message) |
| **Line outcomes** | **Confirm / decline lines** without rates; posts `Order #… · Confirmed|Declined|Updated` in chat; body only names counts that happened (no “declined 0”); rollup when no open lines remain |
| **Confirm all open** | One tap confirms every remaining open line |
| **Split dispatch** | On confirmed order: compact qty list (scroll) + sticky **LR** (required), transporter/parcels optional → shipment history; status → **`part_shipped`** until everything shippable is out, then **`dispatched`** |

### Samples (`/samples`)

Redirects to `/orders?kind=sample` (deep link only — not in You menu). Future: sample is an order-level toggle at place time, not a separate workflow.

### Returns (`/returns`)

Redirects to `/orders?kind=return`. Within return window after **settled** (or legacy deliver) → buyer picks designs/qty (**default all = full return**) → **Select all** / **Clear** on the raise sheet → living **order** card becomes **Order #… Returned** (optional note + **View order →**; no separate return card) → seller approve / partial / decline on the order (chat card unchanged) → resolve. Escalate creates a **complaint**.

## Business rules

### Order status (rollup)

| Status | Meaning |
|--------|---------|
| `requested` | Pre-confirmation; lines may be `open` or already `declined` from a quote |
| `confirmed` | At least one line confirmed; ready to ship |
| `part_shipped` | Mid-fulfillment only: some qty out, some still open — StatusPill while you can still Dispatch more or Settle |
| `dispatched` | Full ship done — **order complete**; return window starts |
| `settled` | Seller **Settle order** after qty mismatch — **completed**; line qty := shipped so the ticket is whole for the new qty (not “partly” anything). StatusPill **Settled**. Timeline may still list earlier Part shipped events |
| `delivered` | Legacy buyer Mark delivered; lists treat as completed |
| `declined` / `cancelled` | Terminal — timeline ends on this step (no dispatch/settle tail) |

### Line status

| `lineStatus` | Meaning |
|--------------|---------|
| `open` | Still negotiable |
| `declined` | Seller can’t / won’t supply |
| `confirmed` | Agreed; may still ship |
| `dispatched` | Fully shipped for that line |
| `delivered` | Line delivered with the order (legacy) |

### Other rules

| Rule | Detail |
|------|--------|
| Trade access | Discoverable product lines (open audience) **or** active connection; blocked → silent 404 |
| Snapshots | Name/sku/images frozen at place time; qty/rate may change via quote |
| `requestedQuantity` | Original buyer ask; offer qty cannot exceed it; preserved after settle |
| Quote | At least one supplyable line; open lines omitted from payload are treated as unavailable |
| Accept quote | Only after the seller posts a Rate card — catalog rates on lines (e.g. after Ask for rates) do not count |
| Chat totals | Rate card `totalLabel` is frozen in message metadata — earlier order cards do not pick up later rates |
| Shipments | Each dispatch is an `OrderShipment` with its own **LR** (required); transporter/parcels optional; history is not overwritten |
| Action cards | One living `order_card` / `rate` per order in the trade thread — lifecycle transitions **update that row** (preserve `metadata.quoted`); do not append a new card per status. Legacy stacks: UI keeps the newest per order |
| Intent | `order` (default) or `inquiry`; firm → `order` on quote / confirm lines / accept quote |
| Amend | Buyer `POST /orders/:id/amend` while requested, all lines open, no seller message yet; increments `amendCount`; posts `order_updated`. **I-handle:** mill-owned designs are allowed (seller is the trader). |
| Chat events | `order_requested` · `rate_requested` · `order_updated` · `quote_sent` · `lines_decided` · `quote_accepted` · `order_declined` · `order_cancelled` · `order_dispatched` · `order_settled` · `order_delivered` (legacy) |
| Dispatchable qty | Only `confirmed` / `dispatched` lines have remaining qty — `open` lines cannot be shipped |
| Settle | Seller-only while **part shipped** (qty mismatch); `POST /orders/:id/settle`; line `quantity` := shipped; status → `settled` (**Completed**). Timeline **Settled**. **I-handle:** mill Settle rewrites matching parent (Meena) lines; parent → `settled` when **all released** mill subsets are complete (one supplier Settled → parent Settled; two+ with one open → those lines done, rest pending, stay part shipped). **Trader does not Settle** the Manage parent while mill desks exist — mills close it. Stuck parents heal on open/list. |
| Full dispatch | Remaining 0 → status `dispatched` (complete; no Settled timeline row; no buyer Mark delivered) |
| Own album vs curated pack | Own-design albums place via `/orders/batch`. Curated I-handle packs use `/orders/from-pack`. If from-pack rejects `NOT_CURATED` / `DIRECT_PACK`, Place Order falls back to batch so the buyer is not stuck. |
| Order trail | Append-only `OrderTrailEvent` rows drive Order detail **Timeline**. Pass-through from mills uses **trader** name only on the parent ticket; mill names never stored or returned on that surface. |
| Soft-hide | Manage parent trail/chat: no upstream shop names (write + read scrub). Mill desks / subset tickets keep mill identity for the trader at that hop. |
| Note + voice | Optional **Note** + mic on order update sheets (quote, settle, dispatch, amend, lines, cancel/decline, raise return, payment ask). Text and/or voice. Clips play on Timeline; return reason / payment note also store voice on those records |
| Return window | Set on full dispatch / settle / legacy deliver (`RETURN_WINDOW_DAYS`); job `return_window.expire` |
| Payment ask | Seller **Ask for payment** after confirmed / part_shipped / dispatched / delivered / settled. Amount required; note and pay-how optional. One `open` ask at a time. Buyer **Paid**; seller **Mark received**. Honour system — Ekum does not move money. Living `payment_card` in the trade thread. |
| Buy for buyer | Same select → quantity sheet (`{n} design(s)`). If selling/trading: **Place Order** + **Ask rates** when sourcing for yourself; **Order for buyer** opens buyer picker (connections + **Find on Ekum**). **Not on Ekum yet** (name + phone) appears only after a Find search with no match — not beside the empty search. Log `requested`; they **Accept**. Own designs only → **Order for buyer** only. Off-app `/o/:token`. No ＋ page. No auto Send-up. |

## Edge cases / empty states

- Restricted audience without membership → cannot place trade (`CONNECTION_REQUIRED`). Open (discoverable) catalog lines order without connection — including published designs that are only reachable inside an openable album (not only standalone Explore market posts).
- Quote with all lines “Can’t supply” → rejected; use **Decline order** instead.
- Partial ship sets status `part_shipped` until fully out (`dispatched`) or **Settle order** (`settled`). After Settle, StatusPill is **Settled** (qty rewritten); Part shipped stays only as earlier Timeline rows.
- Mark delivered retired for the happy path; full ship closes as `dispatched`.

## Seed walkthrough

1. As **Meena**: place / open the seeded requested order.
1b. As **Ravi**: open the **buyer** I-handle ticket (Meena). Mill lots are on that page. **Send** on a mill releases that hop. Before Send, that mill must not see it. Trader Orders list stays the buyer row only.
2. As **Ravi**: Send quote — lower one qty, mark another Can’t supply → rate card in chat.
3. As **Meena**: Accept quote → order confirmed.
4. As **Ravi**: Dispatch part of remaining qty with LR-1, then **Settle order** (mismatch) **or** Dispatch more until remaining 0 → `dispatched` (complete).
5. As **Meena**: Raise a return within the return window if needed.

## Automated verification

- Functional: `pnpm test:e2e:functional` — `@orders` core trade (request → quote → accept → confirmed); I-handle desk `orders.i-handle-desk.journey.spec.ts`
- Regression: `pnpm test:e2e:smoke` — order card `+N` (BM-01); web units for order card copy/dedupe
- Completeness: `docs/superpowers/reviews/completeness/2026-08-11-orders-completeness.md`; I-handle desk: `docs/superpowers/reviews/completeness/2026-09-07-trader-i-handle-desk-completeness.md`

## Where it lives

- Web: `apps/web/src/features/orders/`
- API: `apps/api/src/orders/`
- Contracts: `packages/domain-types/src/orders.ts`, `OrderLineStatus` in `enums.ts`
- Schema: `OrderItem.requestedQuantity` / `lineStatus`, `OrderShipment` + `OrderShipmentItem`
- Jobs: `return_window.expire` in `apps/api/src/jobs/`
