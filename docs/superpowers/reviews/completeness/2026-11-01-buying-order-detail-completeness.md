# Feature Completeness Review — Buying 1:1 order detail chrome (Iteration 2)

**Date:** 2026-11-01  
**Module / ask:** Restyle **normal Buying 1:1 bilateral** order detail to the approved Selling 1:1 design language and client HTML prototype: section order, supplier card, private note, folded Can’t supply, Dispatches after Designs, collapsed Timeline, always-on Chat icon + buyer action / wait bar.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-11-01-selling-order-detail-completeness`, `2026-10-30-order-ticket-chrome-completeness`, `2026-10-31-ticket-notes-timeline-path-icons-completeness`, client `Ekum Order Page Prototype (Copy).html`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

This is a **scoped visual Redesign of Buying 1:1 ticket chrome**. Selling, Direct, and I-handle (Manage parent, mill hops, trader “For {buyer}” card) keep today’s layout. No API, database, lifecycle, status vocabulary, or Notes-permission change. Do not copy Selling Confirm / Dispatch / Settle onto the buyer dock.

Selling 1:1 completeness (`2026-11-01-selling-order-detail-completeness`) deferred Buying. **This slice supersedes that deferral for `direction=buying` + `tradeMode=bilateral` only.** Direct, I-handle, and mill hops stay on the prior chrome.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One Buying 1:1 ticket: header → supplier → private note → progress → designs → dispatches → notes → timeline → always-on bar. Chat is one path (the bar), to the existing supplier 1:1 thread. Wait copy stays **Waiting: supplier**. Buyer verbs stay Cancel / Edit / Accept quote / Decline (logged). Seller tools never appear. |
| UX Designer | Supplier shop name as title, **Supplier** under it. Private note labelled **Private note · Only you** after the party. Can’t supply folded. **Dispatches · N LRs** (not prototype **Received**). Timeline · N until tap. Bar: 48×48 chat icon left (line square) + buyer verb or wait; completed = **Chat with {supplier}**. No five-tab nav. |
| Solution Architect | Gate with `isBuyingBilateralTicket` (buying + bilateral + not mill hop + no mill desks). Reuse Selling 1:1 branches already on `OrderDetailPage` via a shared “1:1 ticket chrome” flag; party role, chat name, and dock verbs stay Buying-specific. No new endpoints. |

---

## Platform consistency (required)

1. **Existing patterns?** PageHeader, StatusPill, ⋯, Avatar 48, kit Button / Card / BottomTradeDock, ticket design rows, hop Notes, Selling 1:1 section order and dock Chat square.  
2. **Duplicates another feature?** No — Chat still opens the existing buyer↔supplier 1:1 thread. Notes stay hop-scoped. Personal note stays company-only.  
3. **Should reuse an existing workflow?** Yes — `orderActionDock` **buy** kind; `orderTicketWaitingCue`; `SellingDockChat` (generalize name only); Dispatches card; `ticketSupplyableItems` / fold; `collapseToHeader` Timeline.  
4. **Naming matches the app?** Supplier (not Purchase party); **Dispatches** (not Received / Shipments); **Private note · Only you**; **Waiting: supplier**; Chat (not Open chat / Message supplier). Status pills stay Placed / Confirmed / Part shipped / Dispatched / Settled.  
5. **Units?** Unchanged. Whose = remaining ticket lines · which = order unit on progress / qty · Rate per on the line. Progress stays `N of M sent` (already asserted). Pack conversion stays on Total.

**Philosophy conflict?** No if this chrome is **Buying 1:1 only**. Applying dock Chat / always-on bar / header-only Timeline to Direct or I-handle would fight prior completeness → would be Reject this slice.

Prototype “Received”, “Part received”, “Accept extra”, and shop-named wait copy fight shipped product (Mark received retired; extra is a line +N; wait is role words). Those are **Reject** below — not document-and-build.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Reorder + Chat bar + fold + Dispatches chrome; buyer verbs unchanged |
| Business rules | OK | Amend / cancel / accept-quote / decline-logged / notes permissions unchanged |
| Workflows | OK | Chat → existing supplier thread; Edit / Cancel / Accept quote sheets stay |
| Edge cases | OK | No threadId hides Chat; no private note hides card; 0 LRs hides Dispatches; all declined → empty main list + disclosure; mill hop excluded |
| Permissions | OK | Personal note company-only; hop Notes unchanged; buyer cannot edit dispatch |
| User states | OK | Gate excludes selling / direct / manage / mill hops / mill desks |
| Notifications | N/A | |
| Error handling | OK | Existing in-sheet / toast |
| Scalability | N/A | |
| Mobile interactions | OK | Always-on bar + `BOTTOM_DOCK_CLEARANCE_CLASS` (BM-07); no tab restore; `/orders/:id` already hides five-tab nav |
| First glance (BM-11) | OK | Supplier name loudest after header; wait quiet on bar when there is no verb; Can’t supply folded; Cancel/Edit stay on the bar (not buried) |
| Units (order / dispatch / Rate per) | OK | No ₹ / qty string change this slice. Progress keeps **sent**. |
| Accessibility | OK | Chat square has visible **Chat** name (aria-label); wait has text; Timeline summary is a button; complete bar has **Chat with {supplier}** |
| Platform consistency | OK | Kit Button / Card / dock; Buying-only gate; Selling 1:1 unchanged |

---

## Inspection — current Buying 1:1 page

Shared `OrderDetailPage`. Buying 1:1 today is the **non-`isSellingBilateralTicket`** branch.

| Region | Current Buying 1:1 |
|--------|-------------------|
| Header | `Order #id` / `Inquiry #id`; subtitle `Buying · {relative} · {myNo}`; StatusPill; ⋯ (Order form PDF · Manual order no. · Personal note · Complaint last). Already matches Selling / prototype. |
| Private note | Dashed foam lock card **above** the party when set. |
| Party | `supplier · {shop}` + 48px Avatar + quiet **chat icon** on the row. |
| Waiting | Muted clock + **Waiting: supplier** on the party card when idle (not Needs you; not done). |
| Progress | Card `N of M {noun} sent` + bar when dispatch is in play. Hidden pre-ship. |
| Designs | All lines inline (declined not folded). Ticket facts: name + Rate per, qty / sent under. Total via `OrderTicketBillBlock`. Buyer cannot fulfill-edit. |
| Transporter | Quiet `Transporter · …` if set and no shipments yet. |
| Complaints | Open complaints card **before** Notes (Selling 1:1 moved this after Timeline). |
| Notes | Hop-scoped **Notes & comments** · Both sides see these. Composer + / Add. No Forward on 1:1. |
| Timeline | **Timeline · N** with the **newest row visible**; tap expands extras. |
| Shipments | Heading **Shipments**, after Timeline. Per row: LR/bill lines, transporter, date, qty, packing-list PDF. No edit pencil (`direction !== 'selling'`). |
| Dock | Only when `orderActionDock.kind === 'buy'`: ghost **Cancel** (or **Decline** if seller-logged) · **Edit** · teal **Accept quote**. No Chat on the bar. Confirmed / part shipped / complete / cancelled with no verb = **empty bottom** (tabs already hidden). |
| Chat | Party-row icon → existing `threadId` (living message when set). |

Mill hops (`isTraderMillHop`) and Direct / I-handle buyers share this same non-Selling branch today, including the **For {buyer} · your selling order** card on mill hops.

---

## Inspection — differences from Selling 1:1 and prototype

Prototype `detailView()` is one stack for 1:1 sell **and** buy: party (Buyer vs Supplier) → private note → progress → Designs (can’t supply folded) → ships → Notes → Timeline collapsed → always-on bar. Prototype `actionBar`: chat **icon** + primary, or icon + wait, or full-width **Chat with {party}** when done. Prototype buying wait is “Waiting for {shop} to accept/send”; list shortens to **Waiting: supplier**. Prototype ships heading is **Received** on buy vs **Dispatches** on sell. Prototype buying bar has **no** Cancel / Edit.

| Area | Buying today | Selling 1:1 (shipped) | Prototype 1:1 buy | This slice |
|------|--------------|----------------------|-------------------|------------|
| Party | `supplier · shop` + chat icon | Shop + **Buyer**, no chat | Shop + **Supplier**, no chat | **Proceed** — match Selling language, role = Supplier |
| Private note | Above party | After party | After party | **Proceed** |
| Wait | On party | On dock when no verb | On bar (shop-named wait) | **Proceed** — dock when no verb; copy stays **Waiting: supplier** |
| Can’t supply | Inline | Folded | Folded | **Proceed** |
| Ships | **Shipments**, after Timeline | **Dispatches** after Designs | **Received** after Designs | **Proceed** Dispatches (Reject Received) |
| Timeline | Newest row showing | Header only | Header only | **Proceed** |
| Dock Chat | None | Icon + verb/wait; complete = Chat with {buyer} | Icon + wait; complete = Chat with {party} | **Proceed** — icon-only beside verbs/wait; complete = Chat with {supplier} |
| Buyer verbs | Cancel / Edit / Accept quote | n/a (seller verbs) | None on bar | **Preserve** — do not copy prototype’s empty buy bar |
| Progress verb | `sent` | `sent` | `received` | **Reject** received — keep sent |
| Status pills | Placed / Confirmed / … | Same | New / Accepted / Part received / Completed | **Reject** remap (same as Selling) |
| Extra qty | Line +N | Line +N | Accept extra / Ask in chat | **Reject** — no API |
| Changed tags | None | Deferred | Disclosure | **Defer** (same as Selling) |
| Five-tab nav | Hidden on `/orders/:id` | Hidden; dock `aboveAppNav={false}` | Detail has no tabs | **Preserve** — do not restore |

---

## Gaps

### G-001 — Gate must exclude mill hops, Direct, and I-handle

| Field | Content |
|-------|---------|
| Gap | Shared `OrderDetailPage` also renders Direct buyer tickets, I-handle parent (buyer talks to You), and trader mill hops (`direction=buying` + `downstreamOrderId`). |
| Why it matters | Mill hops need the For-{buyer} chain card, party chat, and wait-on-party. Direct is trio / observe. Selling 1:1 must not be rewritten. |
| Impact if ignored | Trader mill-hop and Direct journeys lose their chrome. |
| Recommendation | `isBuyingBilateralTicket`: `direction==='buying'` · `tradeMode==='bilateral'` · not `isTraderMillHop` · no `millDesks`. Every visual branch that today keys off `sellingOneToOne` becomes `sellingOneToOne \|\| buyingOneToOne`, except party role, chat counterpart name, and dock verbs. Selling gate stays `isSellingBilateralTicket`. |
| Priority | Required before implementation |

### G-002 — One Chat path; icon-only next to verbs

| Field | Content |
|-------|---------|
| Gap | Buying 1:1 still has the party-row chat icon. Completed / waiting tickets have no dock Chat. Prototype and Selling 1:1 put Chat on the bar. User lock: Chat is **icon-only** in the dock when it sits beside wait or actions. |
| Why it matters | Two Chat controls fight the quality bar. A labeled Chat next to Cancel / Edit is a second path and crowds the bar. |
| Impact if ignored | Trader hunts the party icon on a finished ticket; or the bar grows a text Chat plus Cancel plus Edit. |
| Recommendation | Buying 1:1: remove party chat icon. Dock: 48×48 line-square Chat (`listSquareButtonClass`, `aria-label="Chat"`) left + existing buy verbs, or wait. Complete / cancelled / declined = full-width **Chat with {supplier}** (prototype + Selling done state — not an extra labeled Chat beside verbs). No threadId → hide Chat. Destination stays `threadId` (+ living message). |
| Priority | Required before implementation |

### G-003 — Wait vs Cancel / Edit on the same bar

| Field | Content |
|-------|---------|
| Gap | Requested Buying tickets today show **Waiting: supplier** on the party **and** Cancel · Edit on the dock. Selling 1:1 puts wait on the dock only when `actionDock.kind === 'none'`. A 390px bar cannot hold Chat + Cancel + Edit + wait. |
| Why it matters | Prototype has no buyer amend on the bar. Product must keep Cancel / Edit / Accept quote. |
| Impact if ignored | Crowded dock (BM-11) or lost amend. |
| Recommendation | **Dock verbs win.** When `kind === 'buy'`: Chat icon + Cancel/Decline · Edit · Accept quote; no wait on party or dock. When `kind === 'none'` and idle: Chat icon + **Waiting: supplier**. Needs you (Accept quote) already clears the waiting cue. List row still shows Waiting: supplier. |
| Priority | Required before implementation |

### G-004 — Always-on bar on confirmed / complete Buying tickets (BM-07)

| Field | Content |
|-------|---------|
| Gap | Confirmed / part shipped / complete Buying 1:1 currently has no dock and no tabs. Prototype and Selling always have Chat. |
| Why it matters | Empty bottom is a dead screen. Adding a dock without clearance clips Designs / Notes (BM-07). |
| Recommendation | Always show `BottomTradeDock` with `aboveAppNav={false}` on Buying 1:1. Apply `BOTTOM_DOCK_CLEARANCE_CLASS` whenever that dock is on. Verify last card fully readable with wait dock and with Chat-only dock (phone width). |
| Priority | Required before implementation |

### G-005 — Dispatches, not Received; progress stays sent

| Field | Content |
|-------|---------|
| Gap | Prototype labels buy ships **Received** and progress **received**. Product retired Mark received / Mark delivered. Ticket progress and list already say **sent**. Selling 1:1 locked **Dispatches**. |
| Why it matters | “Received” implies a receive action and fights `orders.md`. Mixing sent/received on the same ticket invents a second unit of meaning. |
| Recommendation | Reuse Selling Dispatches card (heading + LR count + LR · transporter · date · qty). Keep packing-list PDF; keep no edit pencil for buyers. Progress copy unchanged (`N of M sent`). |
| Priority | Required before implementation · **Reject** Received / received |

---

## Approved scope for this slice

What may be implemented / journey-tested after this review (only if disposition is **Proceed**):

- Gate `isBuyingBilateralTicket` (buying + bilateral + not mill hop + no mill desks). Selling 1:1, Direct, I-handle parent, mill hops unchanged.
- Buying 1:1 section order: header · supplier · private note · progress · designs · dispatches · notes · timeline · complaints / manual ref.
- Supplier card: shop name + muted **Supplier**; no party chat icon; no wait on the party.
- Personal note preview after supplier when set (**Private note · Only you**). Hide when empty.
- Fold declined lines under **N can't supply** (same disclosure as Selling).
- Dispatches after Designs when there are LRs (`1 LR` / `N LRs`); LR · transporter · date · qty. Keep packing-list PDF. No buyer edit pencil.
- Timeline collapsed to **Timeline · N** until tap.
- Always-on bar (`aboveAppNav={false}`): Chat **icon** + existing Cancel / Decline / Edit / Accept quote; or Chat icon + **Waiting: supplier**; complete / cancelled / declined = **Chat with {supplier}**. No five-tab nav.
- Chat destination = existing supplier 1:1 `threadId`. Status pills and ⋯ menu unchanged.

## Explicitly deferred / rejected

- Remap pills to New / Accepted / Part received / Completed. **Reject** (same as Selling).
- Prototype heading **Received** and progress verb **received**. **Reject** — keep Dispatches + sent.
- Prototype **Accept extra** / Ask in chat on over-ship. **Reject** — no API; line +N and chat already exist.
- Extra accept/reject, new note APIs, trio Notes. **Reject**.
- Restore five-tab nav on the ticket. **Reject**.
- Labeled Chat button beside Cancel / Edit. **Reject** (icon-only in that row).
- Copy Selling Confirm / Dispatch / Settle onto Buying. **Reject**.
- Direct / I-handle / mill-hop restyle. **Rejected this slice** (unchanged).
- Caption-on-the-right Designs heading polish; line **Changed** tags. **Defer** (same as Selling).
- Shop-named wait (`Waiting for {shop} to accept`). **Reject** — role words stay.

## Proposed implementation (after review)

1. Add `isBuyingBilateralTicket` next to `isSellingBilateralTicket` in `orderTicketChrome.ts`. Exclude `isTraderMillHop`.
2. On `OrderDetailPage`, `oneToOneTicket = sellingOneToOne \|\| buyingOneToOne`. Drive section order, fold, Dispatches placement, Timeline collapse, always-on dock, wait-on-dock, party stack, hide party chat, private-note placement from that flag.
3. Party role label already maps `supplier` → Supplier. Chat-only copy uses `data.sellerName` when buying, `data.buyerName` when selling. Generalize `SellingDockChat` to take `counterpartName` (do not mechanically reuse seller verbs).
4. Buyer dock branch (`kind === 'buy'`) stays as today, prefixed by the Chat icon. Wait only when `kind === 'none'`.
5. Docs: `orders.md` Selling 1:1 ticket row + a Buying 1:1 ticket row. Gap matrix row.

### Exact files

| File | Change |
|------|--------|
| `apps/web/src/features/orders/orderTicketChrome.ts` | `isBuyingBilateralTicket` |
| `apps/web/src/features/orders/orderTicketChrome.spec.ts` | Gate unit (buying 1:1 true; selling / direct / manage / mill hop false) |
| `apps/web/src/features/orders/OrderDetailPage.tsx` | Shared 1:1 chrome flag; supplier role; dock Chat; wait move; fold; Dispatches; Timeline; BM-07 clearance |
| `docs/features/orders.md` | Buying 1:1 ticket lock; Selling row no longer says Buying unchanged |
| `docs/superpowers/reviews/feature-gap-matrix.md` | New Buying 1:1 row |

No API, schema, serializer, or `orderActionDock` verb changes.

### Exact tests

| Test | Change |
|------|--------|
| `apps/web/src/features/orders/orderTicketChrome.spec.ts` | New `isBuyingBilateralTicket` cases |
| `apps/e2e/tests/functional/orders.chrome.journey.spec.ts` — `buyer ticket chrome: Buying, wait, Notes; dock verbs stay` | Wait **not** on party when Cancel/Edit show; dock Chat icon (`aria-label="Chat"`); **Supplier** role; no party chat; Timeline header-only until tap; `app-bottom-nav` hidden |
| Same file — `seller same chrome; buyer Accept quote stays on the dock` | Buyer quoted: Chat icon + Accept quote; still no wait (Needs you) |
| Same file — `ticket progress uses order unit after part dispatch` | Still `sent`; add Dispatches on **buyer** ticket (not Shipments) |
| New case (same file) | Buying 1:1 complete → dock **Chat with {supplier}**; no Dispatch; nav hidden |
| `apps/e2e/tests/functional/orders.detail-notes.journey.spec.ts` | Chat may live on dock (aria Chat / Chat with); still no “Open chat” |
| I-handle / mill-hop journeys (`orders.i-handle-desk`, chrome Forward test) | Must still show party wait / hop card / no Buying 1:1 dock Chat |

Regression: `pnpm --filter @ekum/web test` (chrome spec) · `pnpm test:e2e:functional` filtered `@orders` chrome + i-handle. Trader-eye (BM-11): phone width, requested (Cancel/Edit + Chat icon), confirmed wait dock, complete Chat with supplier, a mill hop unchanged.

---

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — after this plan is reviewed. **Do not implement in this slice until then.**
