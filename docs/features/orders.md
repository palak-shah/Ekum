# Orders & samples

## Purpose

Trade execution after trust **or open catalog**: place and fulfill **orders** (standard or photo) and request **samples**. **Returns are not in the product.** Shop issues go through **1:1 chat ＋ complaint**. **Discoverable** designs/collections (e.g. audience Everyone) can be ordered **without** an active Connection; restricted audiences still need connection / selection / follow as published. Photo orders and samples without a discoverable product still need a connection.

Sellers can fulfill **partially**: quote fewer qty / skip designs, confirm or decline lines, and split dispatch across multiple LRs.

## Who uses it

Buyers place / accept quotes; sellers quote, confirm, and dispatch (full ship closes as **Dispatched**). Samples and returns are managed from the **Orders** tab (unified feed + type filter).

## User flows

Bottom nav **Orders** shows a teal count (same pill as Chats) for how many tickets **Need you** — the same rows as the Pending list left accent (orders, samples). Hidden at 0; the **exact** number (not 9+). Tap opens `/orders`.

### Orders (`/orders`)

| Kind | How |
|------|-----|
| **Standard** | Pick published designs / lines → **How many each** sheet (thumb → PhotoViewer with name / sold-as / rate; name · sold-as (Set / Dozen · 12 pcs / Metre / Piece) · min · rate under the name — no catalog tags; qty stepper on the right; ×). **×** also drops the design from traveling **Selection** (sheet and list stay in sync). Mixed Selection (2+ shops, no single pack stamp): no “Order goes to &lt;one company&gt;”; banner **This becomes N orders — Shop (n designs), …**; shop name on each line. List scrolls; sticky footer is **Place Order · Share** (equal teal), then **Ask rates** and **Order for buyer**. **Share** uses the same chat sheet as album / You (qty unused). From **Your selection**, a successful Share empties the pile. Note is a one-line strip (Colour, packing…) — no **Add note**. Qty is the design’s sell-as unit (**set** when that is how they sell); ± is **1**. Facts under the name stay sold-as · pcs/set · min · rate. When pcs-per-set is known and qty is in, show **Total N pcs** (e.g. 5 sets × 4 = Total 20 pcs). → place request. Qty boxes are **blank** the first time they order from that shop (no platform default of 20/100); after they enter a count, the last count comes back (`ekum:qty-each:v2`). **Same for all** chip opens an empty focused stepper (like quote ₹); Apply fills every line. Multi-design: idle chip **Same for all** (or **Same for all · N** once a count exists) expands to one compact row (label · − qty + · **Apply** / **Cancel** on the right). Tap opens an **empty** focused qty box (type, then Apply) — never a platform guess. **Place Order / Ask rates / Order for buyer** stay off until every line has pieces ≥ 1. Every qty box works the same — the typed digits stay on screen (they can clear the box); blur / Done may leave it empty until they type again. **Enter** or mobile **Done** on Same for all submits Apply; **Esc** cancels. On a line qty, **Enter** / **Next** jumps to the next line qty (last line **Done**). Same jump on order builder, mill Send, Send quote, dispatch, edit, return, and Change qty — not on rate fields. **Curated pack (multi-supplier):** always `POST /orders/from-pack` → **one** buyer and trader main + linked mill lots (not batch). **Transparent** (Your paths / ticket mill): buyer sees mill cards on that main. **Private** (default Me): soft-hide mills for buyer. **Multi-supplier without one pack stamp:** `POST /orders/batch` still creates one order per `product.companyId`. From **Your selection**, a successful Place **leaves** the empty pile and opens the **first successful ticket** (that **chat**, or `/orders/:id` if no thread) — never the Orders list (Needs you buries a just-placed wait) and never **Nothing selected** next to the toast. Shop dock Place already opens the thread. |
| **Photo** | **Orders ＋** or **chat ＋ → Photo order** (1:1 opens `/orders/new?seller=` with that shop selected; they can change it). Not on nav ＋. Phone: **Add photos** opens continuous in-app camera (multi-shot; torch/zoom when supported); **Gallery** in camera chrome for file pick. Desktop: Add opens gallery multi-select directly. Then per-photo pieces (blank until they type or pick a preset; last shop count is remembered like How many each), supplier picker, **note** (text and/or **voice**), send. A chat prefill alone is not a leave-dirty change. Leaving mid-flow prompts **Leave the page?** — Cancel stays; Leave discards. |
| **Inquiry** | From a collection: **Ask for rates** creates a `requested` trade with `intent: inquiry` (same lines/quote path). UI says **Inquiry** (not Order); chat card `Inquiry #… · Inquiry`. Soft until firmed. |

Lifecycle actions (role-dependent): confirm, add rates / accept quote, decline, dispatch (LR/transporter), settle when qty mismatches, cancel. Buyer may **Edit inquiry/order** (qty / remove lines) until the seller quotes or confirms/declines — each edit **updates** the living chat card (**Updated**). Action failures show **in the open sheet** or as a **toast** on page CTAs — never as a buried line behind the sheet.

**Inquiry firm-up:** `intent` flips to `order` when the seller sends a **quote**, confirms any lines, or the buyer **accepts quote**. Decline/cancel stay terminal. Later chat cards use `Order #`.

### Dual trade (Trading on)

Needs trading on the shop. Path is a **TradeLane** per trader × supplier × buyer — two fields, four outcomes. UI is **two switches**, never four radios. See [TradeLane](../superpowers/specs/2026-09-02-tradelane-design.md) and [client one-pager](../superpowers/reviews/2026-09-02-trader-path-client-review.md).

**Target redesign (shipping slice):** curated / multi-supplier **Place** always creates **one main order + linked mill lots** (`from-pack`). **Private** (TradeLane ticket Me, default): buyer soft-hides mills. See [unified main + linked lots](../superpowers/specs/2026-09-08-unified-main-linked-lots-design.md). Batch remains for non-pack multi-seller without one pack stamp.

| Buyer talks to | Share a group | What happens |
|--------------------|---------------------|--------------|
| **Me** (I handle) | Off *(first pair order)* | Buyer’s ticket is the trader. Two private chats. Mill tickets stay **Waiting** until **Send** (or **Change** qty/rate, then Send). Seller cannot list them before Send. **Trader desk:** one list row (the buyer ticket) marked **Trading**, with mill shop names on that row. Find by mill name or mill `#` still hits this row — never a mill subset row. Mills are **subsets** on that page (qty/rate, Send per shop). **Send** (teal) is the mill-card job, **right-aligned** with quiet ghost **Decline** to its left (only before Send; confirm sheet). Same order as the dock **Send all**. Sticky **action dock** (bottom edge; hides app nav while the dock is on): ghost **Decline** · **Send quote** · **Send all** (teal when two or more mills are still waiting; else quote is teal). Decline with 2+ waiting mills confirms dropping those hops; otherwise the note sheet. After one shop Decline, Send all is the remaining waiting mills. Confirmed / part shipped: **Dispatch** (teal; **Dispatch more** when already part shipped) · **Settle** only if `canSettle`. Per-card **Send · Decline** stay on the mill. Do not repeat these verbs as full-width page buttons. **Order detail stays in the AppShell** — the five-tab bottom nav stays. Create collection may hide those tabs (compose); a ticket does not. Scroll padding clears dock + nav (BM-07). **Send quote**, order Decline, dispatch, and settle sit on the desk (Confirm stays off). Trade **Open chat** is a quiet Parties link (not a CTA). **Confirm** stays off so the trader does not lock the buyer before **Send**. List **Needs you** on Trading rows names the mills still waiting (**Send to {shop}** / **Send to A + B**) or **Send quote** after mill rates — never **Confirm** while a mill lot is unsent. After a mill quotes, each design on that mill card shows **From {shop}** vs **To {buyer}** (or Not sent yet); Send quote prefills from mill rates. After Send, mill `#` sits beside the shop; mill chat uses that `#` and opens the buyer ticket. After Send, mill confirm / qty / dispatch **pass through**; mill **quote** waits until the trader sends rates to the buyer. When the buyer **accepts quote**, released mills become confirmed so they can Dispatch. Rare **Hold** / **Resume** live last in that mill’s **⋯** (not on the card). See [I-handle desk](../superpowers/specs/2026-09-07-trader-i-handle-desk-design.md). |
| **Me** | On | Same ticket (trader). **One group per mill.** Reveal On ⇒ mill **shown on the main order** and in the trio (not soft-hidden). Living card = mill subset. Designs appear **only** under each mill card — no second aggregate item list. Parties **Open chat** on the Trading / main ticket = buyer and trader 1:1; each mill card has **Open group chat** for that mill’s trio. |
| **{Supplier shop}** (Direct) | Off | Buyer’s ticket is the design owner. Sharer sees **Shared** — **Handle myself** only (not Confirm / decline / Send quote). Those seller tools appear after Handle myself, on the new **Me** ticket (you are the seller). Mill still quotes/confirms while the hop stays Direct. Buyer–seller private chat. |
| **{Supplier shop}** | On | Same Direct ticket. Same trio group (not a second group). |

**Uniform desk (locked 2026-09-09):** Curated / multi-supplier Place is always **one main** (what the buyer placed) + **linked mill lots** on that order — whether 2 or **10** mills. Trader learns one screen. List = one Trading row.

**Find / search (sub-order → main):** Searching a mill lot `#`, mill shop name, or other sub-order hit **opens the main order** for the **trader** (lots live inside that card — never a separate mill list row). **Buyer** with reveal **Off** does not see mill names or mill `#`s on the main — soft-hide — so those sub-order searches are not a buyer surface for private mills. Reveal **On** for a mill may name that mill on the main / group; Find still lands on the main.

**Buyer talks to** (closed row — selected only; tap opens You / mill)

| Choice | Involvement | What the trader sees |
|--------|-------------|----------------------|
| **You** (default with Share a group **Off**) | You run Send / quote on the desk | Main + mill cards (operate) |
| **These mills** (or one shop name) | Buyer may see mill cards. **Send** on each mill card. **Send quote** / Decline on the desk. | **Same main card** + mill cards; cue: Your move: Send to… / Send quote… |

UI for **These mills** (2+): label **These mills**, shop names listed quietly under (no picker). **Do not** explode into N separate Direct list rows — unmappable at many mills. Path card is the closed **Buyer talks to** row only — no `standard` kind word, no **?** help on the ticket. Mill cards do not lecture “not sent yet” — **Send** is the cue. Reveal is one row: **Share a group** · On/Off (no **?**). Your paths still explains lane scope. List mill shop names only on **Trading** (manage + selling) rows. You-buy / You-sell / buyer tickets never list mills.

**Live flip** (Requested + no quote): tap the selected **Buyer talks to** row, then You or These mills. That changes **this main** and stamps Your paths for those mill × buyer pairs. Your paths alone is **next orders only** (open tickets stay). System default for new pairs: **You + Off**. A trader may set many lanes to mills (unlikely).

**1 mill** can still show that shop’s name as the Mills option; structure stays main + one lot (same desk language).

**Interim code (superseded):** ~~flip cancelled the main and created N Directs~~ — **retired 2026-09-09**; Mills stamps lanes and stays on main.

Reveal **Off** still only *hides* the other end on tickets — we do **not** block Connection or chat if they find each other. Escape back toward operating the desk → flip to **Me** while still requested with no seller quote.

**First order** for a new pair: **Me**, see-each-other **Off**. Everyday Place / Send has **no** path controls. Change on **More** (that sheet), the **order page**, or **Your paths** (You). We remember the pair until they change; the next order follows the lane.

**Shipped:** TradeLane + Your paths + live reveal; Place = from-pack main+lots; **Mills** flip = observe on same main (buyer mill desks); UI list under Mills. Publish / share sheets no longer offer Direct / I handle. Profile has no path switch (removed).

**Clarity:** Chat cards: **Forwarded by {name}** when sharer ≠ owner. Open-path list for forwarder: **Shared** (not You sell); counterpart = seller. **Toll / soft-hide (chain-safe):** On every I-handle **Manage** parent ticket and its trade chat, **never** show upstream mill/shop names — only the two parties on that hop. No **Related orders** box on detail (desk = mill cards for the trader; end buyer sees only the trader hop). Mill identity stays on subset tickets and trader mill desks. Applies when Meena is herself a trader to the next hop. Lists otherwise **You buy** / **You sell**. Orders tab is a **unified feed** (orders + samples), newest-first. One compact filter row: **Pending** / **Completed** (status) and quieter **All** / **Buy** / **Sell** (direction). Buy/Sell is a **temporary view filter**, not an account mode — default **All** on each new visit to Orders; kept while opening a ticket and Back; reset when leaving for Home / Explore / Chats / You. Find still searches the unified feed unless Buy or Sell is on. Rows still **You buy** / **You sell**. List rows match **Chats inbox geometry** (not chat jobs): 48px Avatar, shop name + **time** top-right, a job/status preview, then a third muted facts line **`Order #… · N designs`** so two tickets with the same shop are still distinct. Preview is the Needs you verb when they must act, else `You buy|You sell|Trading` plus a quiet status word — **not** a StatusPill in the time slot. No swipe, pin, mute, unread pill, or Archive. Top chrome matches Chats/Explore: **search + filter icon + trailing ＋** (new order). Filter **Select Status** follows the chip — **Pending:** Requested, Confirmed, Part shipped; **Completed:** Dispatched, Settled, Cancelled. No Received / Approved / Resolved / Declined. Type is separate (Order / Sample). I-handle tickets stay in that feed (preview still says **Trading**). When a menu filter is on, **Showing … · Clear** appears under the search row. **Find** (query, kind, or date) shows **all** matching rows — attention chips **Pending** / **Completed** apply when that Find is empty. A **status** pick stays inside the active chip. **Pending** is every open trade (not finished); **Completed** is finished / declined / cancelled. When the signed-in company must act: soft **left accent edge** + quiet wash on the row, and that same Needs you line as the preview (**Needs you · Send quote** / Confirm / Accept quote / Dispatch / **Send** on Trading). Pending sorts those rows first. Deep links: `?filter=pending` (default); legacy `needs` / `progress` open Pending. `/samples` redirects here with `?kind=sample`; `/returns` opens `/orders`. status deep links use `?status=` (the six only, plus legacy `delivered`). Tiles may show a short staff name when known. Order detail **Timeline** reads the append-only order trail (who / when / note); falls back to derived steps when trail is empty. Your team sees staff names on your actions; counterparties see business names only. Parties card may still show last-touch staff · date. The other shop’s name in Parties is a profile link (/company/:id); **(you)** stays plain. **Open chat** is a quiet accent link in Parties (buyer and trader 1:1), not a page CTA or More actions row. No **View {shop}** ghost CTA. Mill names on mill desks stay text (not linked) so a buyer never opens a mill profile while reveal is off. Buyers never see “confirm” verbs: when they accepted a quote, timeline and Parties say **Quote accepted by …**; when the seller locked supply, **Confirmed by …**. CTAs stay role-owned on the **same sticky dock** (buyer: ghost **Cancel** · **Edit** · teal **Accept quote** when quoted; logged ticket **Decline · Accept**). Seller: Quote / Confirm / Dispatch / Settle). While `order-action-dock` is on, **app bottom nav is hidden** and the dock sits on the bottom edge; a finished ticket (dock none) keeps nav. How-many / Place builder docks are unchanged. Chat keeps **one living reference** per order: rich card for ask-rates / place-order / quote; later statuses update that same message (including `order_settled`). **View order →** / tap opens the order; **Accept quote** only while `canAcceptQuote`.

### Samples (on Orders)

Samples appear in the same `/orders` list (preview **Sample · {status}**). Find → **Sample**, or open `/orders?kind=sample`. Sample rows are glanceable (no detail route yet).

**Sample (planned):** a toggle on the order builder marks the trade as a sample — an indicator only, same lifecycle as a normal order (parallel to **Inquiry**). No separate Samples menu or ＋ entry.

| Need | How |
|------|-----|
| **Quote partial** | Send quote sheet: **h-12** design thumb + name, lower offer qty, toggle **Can’t supply** per line (**row stays**; thumb/name/qty/rate mute as **Declined**; **Can’t supply** stays full colour so it is obvious to untick). Untick restores the live row. Reopen lists every open + declined design; declined stay **Can’t supply** checked until untick. **Order page** (item list and mill-desk rows) mutes those lines and shows **Can’t supply** without opening Send quote. Set rates (2+ supplyable: **Same for all** chip → empty focused field, **one ₹**; **Apply** fills supplyable lines only; qty stays per line), optional **note** (text and/or **voice**) → chat **Quote** card (totals frozen on that message; shows quoted · can’t supply counts). Re-quote can restore a previously declined line; updates the living card; **buyer** Timeline shows one quote row (`Quote updated — ₹…` + quiet **Edited**) — prior ₹ amounts hidden; seller keeps full quote history. Quote note lives on Timeline / chat only (not repeated under line items). |
| **Line outcomes** | Sticky dock on a normal seller ticket (not I-handle): before a quote, **Decline · Confirm · Send quote** (quote teal). After **Send quote**, **Decline · Send quote · Confirm** (Confirm teal — lock or drop the ticket; quote stays to edit rates). **Confirm** opens **Confirm / decline lines**: dispatch-style cards, all on. Tap off = **decline** that design. Sheet footer matches the dock: ghost **Decline** left, teal **Confirm** right. **Confirm** writes ticks as confirm and offs as decline (needs ≥1 tick). **Decline** declines every open line. Partial qty is **Dispatch**. Posts `Order #… · Confirmed|Declined|Updated` in chat. |
| **Split dispatch** | On confirmed order: compact qty list (scroll) + sticky **LR** (optional), transporter/parcels optional → shipment history; status → **`part_shipped`** until everything shippable is out, then **`dispatched`**. Items card (one card): every fulfillment line uses the same pair **dispatched N · pending M** (pieces; both always). No extra line-status word, no second status card. Accent pending while open. Ticket header stays Settled / Dispatched · complete. |

### Samples (`/samples`)

Redirects to `/orders?kind=sample` (deep link only — not in You menu). Future: sample is an order-level toggle at place time, not a separate workflow.

### Returns (`/returns`)

**Removed.** `/returns` opens `/orders`. No Raise a return, no return rows, no Return type. Complaints stay in 1:1 chat ＋.

## Business rules

### Order status (rollup)

| Status | Meaning |
|--------|---------|
| `requested` | Pre-confirmation; lines may be `open` or already `declined` from a quote |
| `confirmed` | At least one line confirmed; ready to ship |
| `part_shipped` | Mid-fulfillment only: some qty out, some still open — StatusPill while you can still Dispatch more or Settle |
| `dispatched` | Full ship done — **order complete** |
| `settled` | Seller **Settle order** after qty mismatch — **completed** (StatusPill **Settled · complete**); line qty := shipped so the ticket is whole for the new qty |
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
| Shipments | Each dispatch is an `OrderShipment` with optional **LR**, transporter, parcels; history is not overwritten |
| Action cards | One living `order_card` / `rate` per order in the trade thread — lifecycle transitions **update that row** (preserve `metadata.quoted`); do not append a new card per status. Legacy stacks: UI keeps the newest per order |
| Intent | `order` (default) or `inquiry`; firm → `order` on quote / confirm lines / accept quote |
| Amend | Buyer `POST /orders/:id/amend` while requested, all lines open, no seller message yet; increments `amendCount`; posts `order_updated`. **I-handle:** mill-owned designs are allowed (seller is the trader). |
| Chat events | `order_requested` · `rate_requested` · `order_updated` · `quote_sent` · `lines_decided` · `quote_accepted` · `order_declined` · `order_cancelled` · `order_dispatched` · `order_settled` · `order_delivered` (legacy) |
| Dispatchable qty | Only `confirmed` / `dispatched` lines have remaining qty — `open` lines cannot be shipped |
| Dispatch sheet | Pending lines only (no Can’t supply, no fully shipped). Open = all **on** at remaining qty. Tap row off = still **pending** (not declined). Under the name: **SKU · unit · N ordered · pending M**. Compact qty when on. **Enter** / **Next** on qty jumps to the next on line. Tally **This LR · n designs · pcs** with **n pending** on the right when any line is off. Optional note+voice (public Timeline). **LR** / transporter / parcels in footer. **PDF** of a **saved** shipment (share/download) on the Shipments row. Restore declined designs via **Send quote**, not this sheet. Thumb → PhotoViewer. |
| Settle | Seller-only while **part shipped** (qty mismatch); `POST /orders/:id/settle`; line `quantity` := shipped; status → `settled` (**Completed**). Sheet shows summary + **Dispatched** \| **Pending** columns; **only pending rows** get accent wash + trailing pending qty (fully shipped rows stay quiet — scannable at 100+ lines). Timeline **Settled**. **I-handle:** mill Settle rewrites matching parent (Meena) lines; parent → `settled` when **all released** mill subsets are complete (one supplier Settled → parent Settled; two+ with one open → those lines done, rest pending, stay part shipped). **Trader does not Settle** the Manage parent while mill desks exist — mills close it. Stuck parents heal on open/list. |
| Full dispatch | Remaining 0 → status `dispatched` (**Dispatched · complete**; no Settled timeline row; no buyer Mark delivered) |
| Own album vs curated pack | Own-design albums place via `/orders/batch`. Curated I-handle packs use `/orders/from-pack`. If from-pack rejects `NOT_CURATED` / `DIRECT_PACK`, Place Order falls back to batch so the buyer is not stuck. |
| Order trail | Append-only `OrderTrailEvent` rows drive Order detail **Timeline**. Trader **Send** to a mill → **You sent to {shop}** on the Manage parent (one row per mill). Hold / Resume same pattern. First **Send quote** → **Quoted — ₹…**; later sends → **Quote updated — ₹…** (same `quoted` type). Pass-through from mills uses **trader** name only on the parent ticket for buyer-facing rows; mill names stay on trader Timeline when mill desks are visible, scrubbed for the buyer when soft-hide applies. |
| Soft-hide | Manage parent trail/chat: no upstream shop names (write + read scrub). Mill desks / subset tickets keep mill identity for the trader at that hop. **Reveal On** may show mill identity to the buyer on the main ticket — it must **not** expose trader desk CTAs / “Send to mill” cues (BM-09). |
| Note + voice | Optional **Note** + mic on order update sheets (quote, settle, dispatch, amend, lines, cancel/decline, raise return). Text and/or voice. Clips play on Timeline; return reason also stores voice on those records |
| Return window | Set on full dispatch / settle / legacy deliver (`RETURN_WINDOW_DAYS`); job `return_window.expire` |
| Payment | **Deferred.** No **Ask for payment** / **Paid** / **Mark received** in product. Order completes on full dispatch (`dispatched`) or settle. Legacy `payment_card` messages may still appear in chat as read-only. API payment-request routes reject with `PAYMENT_DISABLED`. |
| Buy for buyer | Same select → quantity sheet (`{n} design(s)`). If selling/trading: **Place Order** + **Ask rates** when sourcing for yourself; **Order for buyer** opens buyer picker (connections + **Find on Ekum**). **Not on Ekum yet** (name + phone) appears only after a Find search with no match — not beside the empty search. **Own designs:** log `requested`; they **Accept**; logger does not Confirm. **Mill designs:** mill is the seller. Path = Your paths (I handle / Direct); missing lane = I handle. I handle: mill Confirm after **Send**. Direct: mill Confirm; trader sees **Shared · mill**. Off-app `/o/:token` on own-catalog tickets only. No ＋ page. No auto Send-up. |

## Edge cases / empty states

- Restricted audience without membership → cannot place trade (`CONNECTION_REQUIRED`). Open (discoverable) catalog lines order without connection — including published designs that are only reachable inside an openable album (not only standalone Explore market posts).
- Quote with all lines “Can’t supply” → rejected; use **Decline order** instead. Untick restores a gray Declined row; sending a rate on it re-opens the line.
- Pack size (`piecesPerPack`) lives on **each design**, not one shop overwrite. How many each / order lines show sold-as + pcs/set when set, plus min and rate.
- Partial ship sets status `part_shipped` until fully out (`dispatched`) or **Settle order** (`settled`). After Settle, StatusPill is **Settled** (qty rewritten); Part shipped stays only as earlier Timeline rows.
- Mark delivered retired for the happy path; full ship closes as `dispatched`.

## Seed walkthrough

1. As **Meena**: place / open the seeded requested order.
1b. As **Ravi**: open the **buyer** I-handle ticket (Meena). Mill lots are on that page. **Send** on a mill releases that hop. Before Send, that mill must not see it. Trader Orders list stays the buyer row only.
2. As **Ravi**: Send quote — lower one qty, mark another Can’t supply → rate card in chat.
3. As **Meena**: Accept quote → order confirmed.
4. As **Ravi**: Dispatch part of remaining qty with LR-1, then **Settle order** (mismatch) **or** Dispatch more until remaining 0 → `dispatched` (complete).

## Automated verification

- Functional: `pnpm test:e2e:functional` — `@orders` core trade (request → quote → accept → confirmed); I-handle desk `orders.i-handle-desk.journey.spec.ts`
- Regression: `pnpm test:e2e:smoke` — order card `+N` (BM-01); web units for order card copy/dedupe; `QtyStepper.spec.tsx` (replace prefilled 20)
- Completeness: `docs/superpowers/reviews/completeness/2026-08-11-orders-completeness.md`; I-handle desk: `docs/superpowers/reviews/completeness/2026-09-07-trader-i-handle-desk-completeness.md`; mill Decline: `2026-09-23-mill-decline-beside-send-completeness.md`; nav Needs you: `2026-09-26-orders-nav-needs-you-completeness.md`; inbox list rows + dock hides nav: `2026-09-30-orders-inbox-rows-completeness.md`; line dispatched/pending: `2026-10-01-order-line-dispatched-pending-completeness.md`; How many note/step/sets: `2026-10-01-how-many-sets-note-strip-completeness.md`

## Where it lives

- Web: `apps/web/src/features/orders/`
- API: `apps/api/src/orders/`
- Contracts: `packages/domain-types/src/orders.ts`, `OrderLineStatus` in `enums.ts`
- Schema: `OrderItem.requestedQuantity` / `lineStatus`, `OrderShipment` + `OrderShipmentItem`
- Jobs: `return_window.expire` in `apps/api/src/jobs/`
