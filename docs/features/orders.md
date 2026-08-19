# Orders, samples & returns

## Purpose

Trade execution after trust **or open catalog**: place and fulfill **orders** (standard or photo), request **samples**, and manage **returns** (with escalate → **complaint**). **Discoverable** designs/collections (e.g. audience Everyone) can be ordered **without** an active Connection; restricted audiences still need connection / selection / follow as published. Photo orders and samples without a discoverable product still need a connection.

Sellers can fulfill **partially**: quote fewer qty / skip designs, confirm or decline lines, and split dispatch across multiple LRs.

## Who uses it

Buyers place / accept quotes; sellers quote, confirm, dispatch, deliver. Both manage samples and returns from You menu and Orders tab.

## User flows

### Orders (`/orders`)

| Kind | How |
|------|-----|
| **Standard** | Pick published designs / lines → quantities → place request. **Multi-supplier:** one gesture over mixed designs → `POST /orders/batch` creates **one order per `product.companyId`**, then a confirmation with a **link per chat** (partial failures listed). |
| **Photo** | **＋ → Photo order** — phone: continuous in-app camera (multi-shot; torch/zoom when the device supports them) or gallery multi-select; desktop: file multi-select. Then per-photo pieces (presets set all), supplier (unless `?seller=`), note, send |
| **Inquiry** | From a collection: **Ask for rates** creates a `requested` trade with `intent: inquiry` (same lines/quote path). UI says **Inquiry** (not Order); chat card `Inquiry #… · Inquiry`. Soft until firmed. |

Lifecycle actions (role-dependent): confirm, add rates / accept quote, decline, dispatch (LR/transporter), deliver, cancel. Buyer may **Edit inquiry/order** (qty / remove lines) until the seller quotes or confirms/declines — each edit **updates** the living chat card (**Updated**). Action failures show **in the open sheet** or as a **toast** on page CTAs — never as a buried line behind the sheet.

**Inquiry firm-up:** `intent` flips to `order` when the seller sends a **quote**, confirms any lines, or the buyer **accepts quote**. Decline/cancel stay terminal. Later chat cards use `Order #`.

**Clarity:** Lists and detail use **You buy** / **You sell**. Orders tab is a **unified feed** (orders + samples + returns), newest-first. Top chrome matches Chats/Explore: **search + trailing ＋** (new order); secondary chips under the row. **Find** (any query, kind, status, or date) shows **all** matching rows — attention chips Needs you / In progress / **Completed** apply only when Find is empty (typing `return` / Sample·Return shortcuts show raised and completed alike). `/samples` and `/returns` redirect here with `?kind=`. Tiles may show a short staff name when known. Order detail **Next** cue names the counterpart (never “seller”/“buyer”). Timeline includes a **Quoted** step (offered vs asked qty when lowered) while status stays `requested`, and **return** steps after Delivered when returns exist. Status **Confirmed** means agreed / ready to ship — but buyers never see “confirm” verbs: when they accepted a quote, timeline and Parties say **Quote accepted by …**; when the seller locked supply, **Confirmed by …**. CTAs stay role-owned (buyer: Accept quote / Cancel / Deliver; seller: Quote / Confirm lines / Dispatch). Chat keeps **one living reference** per order: rich card for ask-rates / place-order / quote (designs clubbed, `Inquiry #` / `Order #`); later statuses update that same message into a compact chip (`Order #… · Part dispatched`). **View order →** / tap opens the order; **Accept quote** only while `canAcceptQuote`.

### Samples & returns (on Orders)

Samples and returns appear in the same `/orders` list (meta line says Sample / Return). Find → **Sample** or **Return**, or open `/orders?kind=sample|return` (You links). Sample rows are glanceable (no detail route yet); return rows open the related order with `?return=` so detail shows and highlights that return.

| Need | How |
|------|-----|
| **Quote partial** | Send quote sheet: lower offer qty, toggle **Can’t supply** per line, set rates → chat **Quote** card (totals frozen on that message) |
| **Line outcomes** | **Confirm / decline lines** without rates; posts `Order #… · Confirmed|Declined|Updated` in chat; body only names counts that happened (no “declined 0”); rollup when no open lines remain |
| **Confirm all open** | One tap confirms every remaining open line |
| **Split dispatch** | On confirmed order: compact qty list (scroll) + sticky **LR** (required), transporter/parcels optional → shipment history; stay **confirmed** until everything shippable is out, then **dispatched** |

### Samples (`/samples`)

Redirects to `/orders?kind=sample`. Lifecycle: request → seller dispatch → buyer receive / decline → optional **convert** to order.

### Returns (`/returns`)

Redirects to `/orders?kind=return`. Within return window after **full** deliver → buyer picks designs/qty (default all = full return) → seller approve / partial / decline → resolve. Escalate creates a **complaint**.

## Business rules

### Order status (rollup)

| Status | Meaning |
|--------|---------|
| `requested` | Pre-confirmation; lines may be `open` or already `declined` from a quote |
| `confirmed` | At least one line confirmed; may be **part shipped** |
| `dispatched` | All shippable qty has left (no remaining on non-declined lines) |
| `delivered` | Buyer marked delivered; **return window** starts |
| `declined` / `cancelled` | Terminal — timeline ends on this step (no dispatch/deliver tail) |

### Line status

| `lineStatus` | Meaning |
|--------------|---------|
| `open` | Still negotiable |
| `declined` | Seller can’t / won’t supply |
| `confirmed` | Agreed; may still ship |
| `dispatched` | Fully shipped for that line |
| `delivered` | Line delivered with the order |

### Other rules

| Rule | Detail |
|------|--------|
| Trade access | Discoverable product lines (open audience) **or** active connection; blocked → silent 404 |
| Snapshots | Name/sku/images frozen at place time; qty/rate may change via quote |
| `requestedQuantity` | Original buyer ask; offer qty cannot exceed it |
| Quote | At least one supplyable line; open lines omitted from payload are treated as unavailable |
| Accept quote | Only after the seller posts a Rate card — catalog rates on lines (e.g. after Ask for rates) do not count |
| Chat totals | Rate card `totalLabel` is frozen in message metadata — earlier order cards do not pick up later rates |
| Shipments | Each dispatch is an `OrderShipment` with its own **LR** (required); transporter/parcels optional; history is not overwritten |
| Action cards | One living `order_card` / `rate` per order in the trade thread — lifecycle transitions **update that row** (preserve `metadata.quoted`); do not append a new card per status. Legacy stacks: UI keeps the newest per order |
| Intent | `order` (default) or `inquiry`; firm → `order` on quote / confirm lines / accept quote |
| Amend | Buyer `POST /orders/:id/amend` while requested, all lines open, no seller message yet; increments `amendCount`; posts `order_updated` |
| Chat events | `order_requested` · `rate_requested` · `order_updated` · `quote_sent` · `lines_decided` · `quote_accepted` · `order_declined` · `order_cancelled` · `order_dispatched` · `order_delivered` |
| Dispatchable qty | Only `confirmed` / `dispatched` lines have remaining qty — `open` lines cannot be shipped |
| Return window | Set on full deliver (`RETURN_WINDOW_DAYS`); job `return_window.expire` |

## Edge cases / empty states

- Restricted audience without membership → cannot place trade (`CONNECTION_REQUIRED`). Open (discoverable) catalog lines order without connection.
- Quote with all lines “Can’t supply” → rejected; use **Decline order** instead.
- Partial ship leaves status `confirmed` with a **Part shipped** cue until fully out.
- Deliver blocked until order is fully `dispatched`.

## Seed walkthrough

1. As **Meena**: place / open the seeded requested order.
2. As **Ravi**: Send quote — lower one qty, mark another Can’t supply → rate card in chat.
3. As **Meena**: Accept quote → order confirmed.
4. As **Ravi**: Dispatch part of remaining qty with LR-1, then Dispatch more → status becomes dispatched when nothing remains.
5. As **Meena**: Mark delivered → return window applies.

## Automated verification

- Functional: `pnpm test:e2e:functional` — `@orders` core trade (request → quote → accept → confirmed)
- Regression: `pnpm test:e2e:smoke` — order card `+N` (BM-01); web units for order card copy/dedupe
- Completeness: `docs/superpowers/reviews/completeness/2026-08-11-orders-completeness.md`

## Where it lives

- Web: `apps/web/src/features/orders/`
- API: `apps/api/src/orders/`
- Contracts: `packages/domain-types/src/orders.ts`, `OrderLineStatus` in `enums.ts`
- Schema: `OrderItem.requestedQuantity` / `lineStatus`, `OrderShipment` + `OrderShipmentItem`
- Jobs: `return_window.expire` in `apps/api/src/jobs/`
