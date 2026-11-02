# Feature Completeness Review — Trader I-handle parent + mill hops

**Date:** 2026-11-02  
**Module / ask:** Inspect the existing I-handle implementation: parent buyer-facing order detail and mill cards; independent mill-hop pages and navigation; quantity mapping, amendments, mill pass, and partial dispatch; hop-scoped notes and selective Forward; private vs shared notes; mill identity before and after Send; OrderAudit ownership; actions, permissions, and lifecycle. Completeness only — **do not implement gaps**.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/superpowers/specs/2026-09-07-trader-i-handle-desk-design.md`, `2026-09-07-trader-i-handle-desk-completeness`, `2026-09-07-i-handle-no-upstream-names-completeness`, `2026-10-31-trader-mill-hop-selling-order-completeness`, `2026-11-01-trader-ihandle-order-detail-completeness`, `2026-11-01-order-audit-integrity-completeness`, `2026-11-01-selling-order-detail-completeness`, `2026-11-01-buying-order-detail-completeness`, `2026-11-02-buying-ticket-prototype-polish-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

This is **not** a new order model. Parent + mill hops (`downstreamOrderId`, `sourceItemId`) already exist. The slice is the **trader I-handle ticket**: one Manage parent desk + independent mill hop pages after Send. **Do not** restyle Selling 1:1, Buying 1:1, or Direct. **Do not** invent a parallel hierarchy.

Re-inspection of current code (2026-11-02), after 1:1 chrome shipped. Prior `2026-11-01-trader-ihandle-order-detail-completeness` is an anchor, not the source of truth. Phone: I-handle parent `#IU3U` at 390px — `supplier ·` / `buyer ·`, party Chat, mill Send/Decline, Timeline newest row (not 1:1 chrome).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One inbound ticket (`#parent`) is the trip. Mills are subsets on that page until Send; after Send each mill hop is a real selling ticket. Buyer never opens mill hops. Remaining holes: after Send the parent has no wait verb; mixed trader-owned lines vanish; parent Dispatch can fire while mills ship; How many note is copied onto mill hops. |
| UX Designer | Desk job is **Send mill lots**, then wait. Mill cards + card Send already do the first job. After Send, dock `none` + skipped wait cue = empty bottom (tabs already hidden). Do **not** paste Selling/Buying 1:1 Chat bar / stacked Buyer / Timeline-header-only onto this desk. Keep mill names on mill cards only. |
| Solution Architect | Reuse `Order` hops + `sourceItemId`. Pass-through (`passMillLinesToParent` / `passMillDispatchToParent` / `syncManageParentFromMillSettle`) and OrderAudit ownership are shipped. Close coordination: mill `editShipment` not copied; FG-007 extra-after-settle; amend rematch after parent `deleteMany`. Stop Place-note copy. No schema unless FG-007 rewrites existing `OrderShipment` rows. |

---

## Platform consistency (required)

1. **Existing patterns?** I-handle mill cards, kit Card / Button / StatusPill / BottomTradeDock, hop Notes + Forward, mill `#` hop link. Selling 1:1 applies **only** on the mill’s hop (mill is bilateral seller). Parent and trader mill hop stay off `oneToOneTicket` (`isIHandleSellingParent` / `isTraderMillHop`).  
2. **Duplicates another feature?** No — not Selling 1:1 restyle, not Direct trio, not a Related-orders box.  
3. **Should reuse an existing workflow?** Yes — parent `OrderDetailPage` mill desks; mill hop = same page gated by `isTraderMillHop` / `isSellingBilateralTicket`; mapping in `apps/api/src/orders/i-handle-desk.ts`.  
4. **Naming matches the app?** Mill cards use shop names. Party lines on the parent still say `supplier ·` / `buyer ·`. Wait copy must stay mill-named on mill cards, not dump mill names onto the buyer ticket.  
5. **Units?** No ₹ / qty string change required for chrome. Pass-through qty is live **order** unit on the mapped parent line. Pack on Explore stays collection; hop desks stay per design (`sourceItemId` blocks catalog-whole collapse).

**Philosophy conflict?** No if this slice stays **I-handle only**. Copying Selling/Buying 1:1 chrome onto the Manage parent would fight `2026-11-01-selling-order-detail` and `2026-11-01-buying-order-detail`. A second order tree would fight dual-network 1-hop.

---

## Ask vs inventory (classify each)

| Item | Classification | Evidence |
|------|----------------|----------|
| **1. Parent — buyer details** | Partial | Parties card: 48px Avatar, `supplier ·` / `buyer ·`, quiet chat on the party (`!oneToOneTicket`). Not stacked Name + **Buyer** (Selling 1:1 only — **Reject** copy). Personal note sits **above** the party card. |
| **1. Parent — progress** | Partial | Ticket `N of M sent` when dispatch is in play (`orderTicketProgress`). One parent bar, not per mill. After Send, `orderTicketWaitingCue` **skips** I-handle (`isIHandleSellingParent`). `traderDeskNextAction` / `orderDetailNextCue` are unit-tested and unused on `OrderDetailPage`. Dock often `kind === 'none'`. |
| **1. Parent — designs** | Partial | Designs live **inside mill cards** (`showOrderParentItemsList` false when any mill desk exists). Held: Qty \| Rate + Send. After Send: line chrome + From/To when mill quoted. **Hole:** trader-owned parent lines not in any mill `itemIds` **do not render**. |
| **1. Parent — mill cards** | Implemented | One mill card per hop. Shop; after Send mill `#` links to hop; held Send + ghost Decline; Hold/Resume last in mill ⋯; Reveal On group chat. Functional: `orders.i-handle-desk.journey.spec.ts`. Direct hops never sit here. No Related box. |
| **1. Parent — dispatches** | Partial | Mill dispatch creates a parent `OrderShipment` (`passMillDispatchToParent`). Card still titled **Shipments**, placed **after** Notes/Timeline (`!oneToOneTicket`). Qty-only (no mill LR/legs). Parent dock can still offer **Dispatch** while mill desks exist (`canSettle` is already false when `millDesks.length === 0` is required). |
| **1. Parent — notes** | Partial | Hop-scoped `OrderTicketNotes` + trader Forward + mill picker (2+). Title **Notes & comments**. Place-time How many note is **copied onto mill hops at create** (`spawnHandleUpstreams` `note: dto.note`). |
| **2. Supplier hops — independent detail / nav** | Implemented | Each hop is a full `Order` on `OrderDetailPage`. Held: mill 404; trader redirected to parent. After Send: mill = Selling 1:1; trader hop stays older chrome with **For {buyer} · your selling order** (`traderSellingHop`). Buyer is not a party (404). Completeness `2026-10-31-trader-mill-hop-selling-order`. |
| **2. Supplier — qty / status / actions** | Implemented | Own items (`sourceItemId`), own status, mill Confirm / Dispatch / Settle. Trader on hop is the **buyer** (Cancel/Edit leftover). Parent has **no** Confirm / Send quote (`showSendQuoteOnDeskFace` false with mill desks). |
| **2. Supplier — dispatches / notes** | Partial | Mill hop has own shipments + Notes. Mill UI uses Selling 1:1 **Dispatches**. Trader hop is older chrome (shipments after Timeline) — keep; do not apply Buying 1:1. Notes are hop-scoped. |
| **3. Coordination — mapping** | Partial | Create-time `claimParentItemId` + read-time `matchParentItemId` (`sourceItemId` first). Unique `productId` fallback still exists. Parent amend is `deleteMany` + create → hop `sourceItemId` SET NULL, then rematch by productId/name (duplicate SKU risk). |
| **3. Coordination — amend** | Partial | `passBuyerAmendToMills`: qty/add/remove; `amended_removed` on **hop**. Hold blocks pass (parent already rewritten). Photo / no-productId adds skipped. |
| **3. Coordination — mill pass / partial dispatch** | Partial | Confirm / line qty / can’t-supply / restore / dispatch pass after Send, not while Hold. Settle **does** pass even if Hold. Mill `editShipment` **does not** call `passMillDispatchToParent`. Quote stays hop-local (by design). |
| **3. Coordination — progress reconcile** | Partial | `allReleasedSubsetsComplete` + heal on get/list. One mill Settled → parent Settled; two+ with one open → Part shipped. **FG-007:** mill Final &lt; already-copied shipped leaves parent extra (`syncManageParentFromMillSettle` rewrites line qty, not shipment rows). |
| **4. Notes — independent / selective Forward** | Partial | After Place, `addNote` is hop-only. Forward: trader only; Direct/trio/buyer rejected. UI Forward on every un-forwarded Notes row (including **On confirm** / **On dispatch** / **On settle**). API `loadForwardSource` only `noted` + place (`NOTE_NOT_FORWARDABLE`). |
| **4. Private vs shared** | Implemented | Company-only `OrderCompanyNote` (verified: other party count 0). Hop Notes: both sides, You = `bg-chat-out`. |
| **5. Privacy — identity until Send / mill isolation** | Partial | Soft-hide write+read on trail/chat; buyer `millDesks` empty when Reveal Off; mill `relatedOrders` empty; held hops hidden; list hides trader subset rows; Find mill `#` remaps to parent. **Leaks:** How many note copied to hop; trail `note` unscrubbed. Mills cannot see other mills (party on own hop only). |
| **5. Privacy — chat / PDF / media** | Partial | Chat body scrubbed. Notify hop parties only; mill `orderCreated` on Send. PDFs hop-scoped. Media rows have no shop names; originals keep EXIF (**Deferred**). |
| **6. Audit — parent vs hop** | Implemented | Integrity slice shipped. Send-up `mill_pass` on **hop**; mill confirm/qty pass `mill_pass` on **parent**; amend drop `amended_removed` on that order. Specs: `order.service.send-up.spec.ts`. |
| **7. Actions / permissions / lifecycle** | Implemented except G-001 / G-003 | Buyer never mill hop; mill never parent portal; no parent Confirm / Send quote. Parent Dispatch while mill desks exist is the remaining lifecycle hole. |

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | Desk + hops exist; leftover You lines, wait cue, parent Dispatch vs mill Dispatch, Place-note copy |
| Business rules | Gap | Settle-off-with-desks is locked; Dispatch-off-with-desks is **not**. FG-007 extra-after-settle |
| Workflows | Gap | Send → mill Confirm → parent firms. After Send, parent has no wait verb. Mill LR edit diverges |
| Edge cases | Gap | Mixed trader-owned + mill desks; duplicate SKU after amend; Hold + buyer amend stale hop |
| Permissions | OK | Buyer never mill hop; mill never parent portal; Forward trader-only |
| User states | Gap | Held / sent / declined mill cards OK. After Send requested parent = empty dock |
| Notifications | OK | Hop-scoped; mill notify on Send |
| Error handling | OK | Existing toasts / `NOTE_NOT_FORWARDABLE` / Hold twice |
| Scalability | OK | N mill cards on one parent; hops stay separate Orders |
| Mobile interactions | Gap | BM-07: dock clearance only when 1:1 or dock has a verb. After Send, no bar — not clipped, but empty |
| First glance (BM-11) | Gap | 390px parent `#IU3U`: mill cards are the job; two party rows + empty bottom after Send compete |
| Units (order / dispatch / Rate per) | N/A | No ₹/qty string change in the chrome slice. Pass-through keeps parent **order** unit |
| Accessibility | OK | Mill `#` is a link after Send; Send labelled; Hold in ⋯ |
| Platform consistency | OK | Reuse desk + hop page. Do not copy 1:1 chrome |

---

## Gaps

### G-001 — After Send the parent has no wait job

| Field | Content |
|-------|---------|
| Gap | `orderActionDock` returns `none` when no Send all / Confirm. `orderTicketWaitingCue` returns null for I-handle. `traderDeskNextAction` / `orderDetailNextCue` are unused on `OrderDetailPage`. |
| Why it matters | Tabs are already hidden. Empty bottom + mill StatusPill only is easy to read as a dead ticket. |
| Impact if ignored | Trader hunts Confirm on the parent (there is none) or thinks Send failed. |
| Recommendation | Surface mill wait on mill cards (already have StatusPill) **and** a quiet ticket cue from `traderDeskNextAction` (Waiting on {shop} to confirm). Do **not** add Selling 1:1 always-on Chat dock. |
| Priority | Required before implementation |

### G-002 — Trader-owned lines vanish when mill desks exist

| Field | Content |
|-------|---------|
| Gap | `showOrderParentItemsList` is all-or-nothing. From-pack remaining mill + trader SKUs share one Manage parent. Lines not in any mill `itemIds` never render. |
| Why it matters | Mixed I-handle is a shipped Place path. Those SKUs still exist on the Order. |
| Impact if ignored | Trader cannot Send / see / dispatch their own lines on the same ticket. |
| Recommendation | Keep mill cards for mill `itemIds`. Render leftover parent lines as one **You** group (same line chrome), not a second aggregate Designs dump of mill SKUs. |
| Priority | Required before implementation |

### G-003 — Parent Dispatch while mill desks exist

| Field | Content |
|-------|---------|
| Gap | `canSettle` is false when `millDesks.length > 0`. Fulfill dock still offers **Dispatch** if remaining qty (`orderActionDock` `openForDispatch`). Pass-through shipments are qty-only (no mill LR). |
| Why it matters | Mills ship on hop tickets. A parent LR is a second dispatch with no mill bill. |
| Impact if ignored | Buyer ticket shows a nameless Dispatch plus mill-passed qty; totals double-count or diverge. |
| Recommendation | Same rule as Settle: **no parent Dispatch** while mill desks exist, **unless** leftover You lines (G-002) still need a trader LR. Mill hop remains the mill ship path. |
| Priority | Required before implementation |

### G-004 — How many note is copied onto mill hops

| Field | Content |
|-------|---------|
| Gap | `spawnHandleUpstreams` passes `note: dto.note` (and voice / photos) into mill `create`. Later `addNote` is hop-only (correct). Completeness `2026-10-30-order-ticket-chrome` **rejected** auto-copy. |
| Why it matters | Soft-hide: mill must not receive the buyer’s ticket note unless the trader Forwards it. |
| Impact if ignored | After Send, mill living card / hop Notes can show buyer Place text as the trader. |
| Recommendation | Create mill hops with empty ticket note. Trader Forward remains the only copy path. |
| Priority | Required before implementation |

### G-005 — Mill dispatch edit does not reach the parent

| Field | Content |
|-------|---------|
| Gap | `dispatch` → `passMillDispatchToParent`. `editShipment` never does. Parent shipments stay at first copy. |
| Why it matters | Partial dispatch is a live ticket. Mill pencil is the mill’s LR truth. |
| Impact if ignored | Parent progress / buyer chat stay on the old qty. |
| Recommendation | After mill `editShipment`, rewrite the mapped parent shipment (or replace the pass-through copy). Same `sourceItemId` match. Soft-hide: still no mill shop on the parent card. |
| Priority | Required before implementation |

### G-006 — FG-007 mill Settle extra on parent

| Field | Content |
|-------|---------|
| Gap | `syncManageParentFromMillSettle` sets parent qty := mill live quantity. Does not trim already-copied parent shipments. Final &lt; shipped → parent extra. Gap matrix still Partial / unit-only. |
| Why it matters | Parent Total / `N of M sent` become invented leftover. |
| Impact if ignored | Buyer sees extra on a mill-closed line. |
| Recommendation | When mill Settles, rewrite mapped parent qty **and** align parent shipment qty to mill Final (not only the live mill line). Add a service spec (not helpers only). |
| Priority | Required before implementation |

### G-007 — Notes Forward UI vs API

| Field | Content |
|-------|---------|
| Gap | Card shows Forward on confirm / dispatch / settle sheet notes (`canForward && !row.forwarded`). `loadForwardSource` only allows `noted` and place. API `NOTE_NOT_FORWARDABLE`. |
| Why it matters | Trader taps Forward and gets a toast. Two truths. |
| Impact if ignored | They think I-handle notes are broken. |
| Recommendation | Either forward those trail rows (as trader, hop-scoped) **or** hide Forward unless the API allows it. Prefer hide until a later notes slice — do not invent a third note type. |
| Priority | Required before implementation |

### G-008 — Amend rematch can swap duplicate SKUs

| Field | Content |
|-------|---------|
| Gap | Parent amend recreates items; hop `sourceItemId` nulls. `passBuyerAmendToMills` uses `claimParentItemId` (productId/name). Docs say no first-match after mapping exists. |
| Why it matters | Two of the same mill design on one ticket is a real pack case. |
| Impact if ignored | Qty/remove land on the wrong hop line; audit `orderItemId` lies. |
| Recommendation | Restamp hop mapping from the new parent ids in one pass (stable productId+name order, or carry mapping through amend instead of delete-all). Keep `matchParentItemId` sourceItemId-first. |
| Priority | Required before implementation |

---

## Approved scope for this slice

What may be implemented / journey-tested **after** this review (only if a later slice is approved). **This documentation turn implements none of it.**

- I-handle **parent** only: leftover You lines; wait cue from existing `traderDeskNextAction`; parent Dispatch off while mill desks exist (exception: leftover You lines).  
- Stop copying Place note/voice/photos onto mill hops.  
- Hide Forward when the API cannot forward (G-007).  
- Mill `editShipment` pass-through + FG-007 parent extra (existing Order / OrderShipment — no new tables).  
- Amend pass restamp `sourceItemId` without duplicate-SKU swap.  
- Tests: API for G-004–G-008; functional mill Confirm/Dispatch/Settle on the hop; parent after-Send wait cue; leftover You lines.  
- Trader-eye (BM-11) on parent + mill hop at phone width.

## Explicitly deferred / rejected

- Selling 1:1 / Buying 1:1 restyle on I-handle (stacked Buyer, always-on Chat dock, Timeline header-only, Dispatches heading copy) — **Rejected** (keep today’s I-handle layout except the Required gaps).  
- Direct / trio behaviour — **Rejected** (no change).  
- Parallel order hierarchy or merging hops into one DB order — **Rejected**.  
- Generic Related orders box; listing mill hops on Orders — **Rejected**.  
- Parent mill-card Can’t-supply switch — **Deferred**.  
- Mill hop **Send quote** dock button — **Deferred** (Confirm is the mill job).  
- Whole-order Hold — already **Later** (`2026-09-07`).  
- EXIF strip on original media — **Deferred**.  
- OrderAudit report UI / export — **Deferred** (integrity slice).  

**Per-item recommendation**

| Item | Recommendation |
|------|----------------|
| Parent ticket (buyer / progress / designs / mill cards / dispatches / notes) | **Proceed** — Required G-001–G-004, G-007 only |
| Supplier hop independent pages | **Defer** chrome; hops are shipped. Add mill Confirm/Dispatch functional coverage with the parent slice |
| Coordination | **Proceed** — G-005, G-006, G-008 |
| Notes Forward / Place copy | **Proceed** — G-004, G-007 |
| Privacy | **Proceed** only G-004; remaining residue **Defer** |
| Audit ownership | **Defer** — already verified; no ticket UI |

---

## Exact files involved

**Parent / hop UI**

- `apps/web/src/features/orders/OrderDetailPage.tsx` — mill cards, dock, Shipments, Notes, leftover-lines hole; `oneToOneTicket` must stay false here  
- `apps/web/src/features/orders/iHandleDesk.ts` — `showOrderParentItemsList`, `orderActionDock`, `traderDeskNextAction`, `isIHandleSellingParent`, `isTraderMillHop`  
- `apps/web/src/features/orders/orderTicketChrome.ts` — wait cue skip, Forward gate, 1:1 gates  
- `apps/web/src/features/orders/OrderTicketNotes.tsx`  
- `apps/web/src/features/orders/orderPartyLines.ts`  

**API / mapping / pass-through / audit**

- `apps/api/src/orders/order.service.ts` — `spawnHandleUpstreams` note copy; `amend` / `passBuyerAmendToMills`; `sendUp`; `dispatch` / `editShipment`; `passMillLinesToParent`; `passMillDispatchToParent`; `syncManageParentFromMillSettle`; `forwardNote`; `buildMillDesks`; `canSettle`  
- `apps/api/src/orders/i-handle-desk.ts` — `claimParentItemId`, `matchParentItemId`, `shouldPassThrough`, `allReleasedSubsetsComplete`  
- `apps/api/src/orders/i-handle-soft-hide.ts`  
- `apps/api/src/orders/order-audit.service.ts`  

**Privacy adjacent**

- `apps/api/src/conversation/message.service.ts`, `thread.service.ts`, `reference-resolver.ts`  
- `apps/web/src/features/chats/orderCardCopy.ts`  
- `apps/web/src/features/orders/orderForm.ts`, `packingSlip.ts`  

**Lock / tests (do not change this turn)**

- `docs/features/orders.md`  
- `apps/e2e/tests/functional/orders.i-handle-desk.journey.spec.ts`  
- `apps/api/src/orders/order.service.send-up.spec.ts`, `order.service.spec.ts`, `i-handle-desk.spec.ts`  
- `apps/web/src/features/orders/iHandleDesk.spec.ts`, `orderTicketChrome.spec.ts`  

---

## Implementation sequence

Recorded for a **later** slice. Not run in this documentation turn.

1. Lock `orders.md`: parent Dispatch off with mill desks (You-line exception); leftover You group; after-Send wait cue; mill hops created with empty ticket note; Forward only when API allows.  
2. Parent UI: leftover You lines; wire `traderDeskNextAction` as quiet cue; hide parent Dispatch when mill desks and no leftover remaining.  
3. API: stop Place-note copy; hide or honour Forward; `editShipment` pass-through; FG-007 shipment align; amend mapping restamp.  
4. Tests: API specs for step 3; functional mill Confirm/Dispatch/Settle on hop; parent after-Send cue; leftover You lines; mill hop 404 for buyer if not already asserted.  
5. Trader-eye BM-11: parent (held + after Send) and mill hop at phone width. Do not restyle Selling / Buying / Direct.

No Prisma schema / lifecycle status change expected. G-005 / G-006 rewrite existing `OrderShipment` rows.

---

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (I-handle ticket slice only; Selling / Buying / Direct unchanged)  
This turn: documentation only — no code, schema, or tests.  
