# Feature Completeness Review — Direct Link / mixed order routing

**Date:** 2026-10-28  
**Module / ask:** Direct Link (TradeLane) + mixed checkout routing + stable item mapping + qty/price history + mill→parent pass-through + confidentiality  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/settings.md`, `docs/superpowers/specs/2026-09-02-tradelane-design.md`, `docs/superpowers/specs/2026-09-08-unified-main-linked-lots-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Live code was inspected before this review. The audit report (`Pasted markdown(5).md`) is not in the repo; findings were re-verified against `TradeLane`, `Order` / `OrderItem`, `createFromPack`, `matchParentItemId`, `setLineQuantity` / `setLineSupply`, `TradeLaneService.update`, and notification listeners.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Direct Link is the existing `TradeLane` (trader × mill × buyer), not a second relationship table. First-pair default stays **You + group Off**. A trader may **create** a path before the first order by picking a connected mill and a connected buyer. Mixed checkout: one Place; Direct-linked mills become Direct supplier tickets (trader stays facilitator); remaining mill lines stay one Manage parent + Send-held hops. Do not explode I-handle mills into N Directs. Open tickets are never silently rerouted when Your paths changes. No payments. No mandatory accept/reject on operational qty changes. Auto-repost is **not** in this slice — audience is unresolved. |
| UX Designer | Keep **Your paths** (not a new Direct Link app). Create is list **＋** → mill + buyer pickers (`ConnectionPicker`) → defaults shown **ticked and locked**. Everyday Place stays one How many / Place. Buyer still lands on the first ticket (Manage parent if any, else first Direct). I-handle desk language unchanged for trader-managed lines. Qty chat: living card, before → after, no second order card. |
| Solution Architect | Extend `OrderService.createFromPack` (and hop/take-control paths). Add `OrderItem.sourceItemId` (nullable self-FK) + unambiguous backfill. Persist `TradeLane.behaviors` JSON (`directOrder`, `autoRepost`) with defaults on. Qty/price history in `OrderTrailEvent.payload`; `confirmedQuantity` / `confirmedRate` snapshots only so Restore / settlement do not rewind to the original ask. Reveal On from Your paths must **not** create a trio before Send (order-page mill-reveal already waits). Notify facilitator on Direct create/status. |

---

## Platform consistency (required)

1. **Existing patterns?** Your paths, TradeLane ticket/reveal, from-pack Manage parent, mill hops, living order cards, ConnectionPicker, ListSearchRow ＋. Yes.  
2. **Duplicates another feature?** No new DirectLink table, no second order module, no payment rails.  
3. **Should reuse an existing workflow?** Yes: `createFromPack` + existing Direct `tradeMode` / `facilitatorCompanyId` + mill hops. Batch stays for non-pack multi-seller.  
4. **Naming matches the app?** **Your paths** · mill · buyer · Buyer talks to · Share a group. Not Seller/Buyer on chat card body. “Direct Link” is the relationship idea, not a new screen title.  
5. **Units?** No ₹/qty **display** unit change. Qty history is the same order-unit number already on the line (pack vs design already snapshotted on the item).

**Philosophy conflict?** Yes, vs the 2026-09-08 lock “curated Place is **always** one Manage parent + mill lots; ticket mill = mill named on that main.” Agreed product now: ticket mill + Direct routing policy = **Direct supplier orders** for those mills; I-handle mills stay on the main. That is a **documented redesign** of Place routing only — I-handle desk, Send-hold, and soft-hide stay. Disposition is **Proceed** after locking docs (this review + `orders.md`).

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Mixed Place, mapping, history, create-path, reveal-before-Send, mill→parent, facilitator notify |
| Business rules | OK | Lane ≠ order; future-only path edits; one item one branch; photo + duplicate SKU mapping |
| Workflows | OK | One checkout; Direct and Manage can coexist; take-control / Send / settle kept |
| Edge cases | OK | All-Direct, all-Handle, trader-owned + mills, photo lines, amend rematch, historical unmapped |
| Permissions | OK | Create path: both ends must be active connections; trading on |
| User states | OK | Empty Your paths still true until first pair **or** create |
| Notifications | OK | Facilitator on Direct; qty before/after; no mill↔parent notify loop |
| Error handling | OK | Hop failures stay on `failures[]`; Direct mill fail does not drop Manage parent |
| Scalability | OK | Per-checkout mill group; no N+1 beyond existing from-pack |
| Mobile interactions | OK | Your paths ＋ sheet; list ＋ is 40×40; sheet CTA full-width; no new sticky dock on tickets |
| First glance (BM-11) | OK | Create sheet: mill, buyer, locked ticks, Create. Path cards keep ticket + group first; locked defaults quiet |
| Units (order / dispatch / Rate per) | N/A | Numbers only; no unit string change |
| Accessibility | OK | Locked ticks are not native checkboxes that look tappable; disabled + On label |
| Platform consistency | OK | After routing redesign lock |

---

## Gaps

### G-001 — Curated Place always-Manage vs mixed Direct

| Field | Content |
|-------|---------|
| Gap | Shipped lock (`orders.md`, unified-main spec): from-pack always one Manage parent + hops. Agreed: Direct-linked mills become Direct tickets; rest stay Manage. |
| Why it matters | One Place with mill A Direct and mill B I-handle cannot be both “always main+lots” and “Direct for A”. |
| Impact if ignored | Implementers keep mill-on-main for ticket=mill and never ship mixed routing. |
| Recommendation | Redesign Place routing in docs, then extend `createFromPack`. Live flip of an **open** Manage ticket stays on that main (no silent explode). |
| Priority | Required before implementation |

### G-002 — `matchParentItemId` first-match `productId`

| Field | Content |
|-------|---------|
| Gap | Hop ↔ parent matching is first `productId`. Duplicate SKUs and photo lines (`productId` null) cannot map. Amend `deleteMany` would orphan FKs. |
| Why it matters | Supplier 2 confirm/qty must not rewrite Supplier 3. Photos have no productId. |
| Impact if ignored | Wrong parent line updates; silent no-op on photos. |
| Recommendation | `OrderItem.sourceItemId` nullable self-FK. Create-time 1:1 claim. Historical backfill only when productId is unique on **both** hop and parent. Fallback match only when unique. |
| Priority | Required before implementation |

### G-003 — Confirm/qty history and Restore

| Field | Content |
|-------|---------|
| Gap | `requestedQuantity` is kept; live `quantity`/`rate` overwrite. Trail `payload` unused. Restore Can’t supply rewinds to the **ask**, not last confirm. |
| Why it matters | Shortage after confirm must not look like the mill never committed. |
| Impact if ignored | Settlement and Restore lie. |
| Recommendation | Trail payload `{ orderItemId, field, before, after }`. Snapshot `confirmedQuantity` / `confirmedRate` on first confirm (and not on later operational qty). Restore uses confirmed snapshot when present. |
| Priority | Required before implementation |

### G-004 — Reveal On from Your paths creates trio before Send

| Field | Content |
|-------|---------|
| Gap | `TradeLaneService.update` calls `ensureTradeLaneGroup` when `reveal=true`. Order-page `millReveal` already waits for Send. |
| Why it matters | Send-hold: mill must not join the buyer before Send. |
| Impact if ignored | Trio exists while hop is Waiting. |
| Recommendation | Your paths PATCH persists `reveal` only. Group still created on Send / mill-reveal **after** release. |
| Priority | Required before implementation |

### G-005 — Facilitator not notified on Direct events

| Field | Content |
|-------|---------|
| Gap | `orderCreated` / `orderStatusChanged` notify seller or counterparty only; `facilitatorCompanyId` is unused in listeners. |
| Why it matters | Trader is in the Direct loop (Shared / Take control) but gets no bell. |
| Impact if ignored | Trader learns only if they watch Orders. |
| Recommendation | Notify facilitator when distinct from actor/seller/buyer. |
| Priority | Required before implementation |

### G-006 — Mill operational updates not fully passed to parent

| Field | Content |
|-------|---------|
| Gap | Confirm/dispatch/settle pass through after Send. Qty, Can’t supply, decline, and rate after lock are mill-only. Mapping is productId. FG-007 settle is under-tested. |
| Why it matters | Buyer Manage ticket can show stale qty after mill shortage. |
| Impact if ignored | Two truths on parent vs hop. |
| Recommendation | Pass mapped line qty/rate/decline/supply after Send. Parent qty := mill live qty (after mill settle, that is Final). Do not trim parent shipments in this slice if Final &lt; shipped — record discrepancy; FG-007 extra-after-settle remains a known settlement risk, not a payment change. |
| Priority | Required before implementation |

### G-007 — Auto-repost audience

| Field | Content |
|-------|---------|
| Gap | Persist `behaviors.autoRepost=false` (field kept). Do **not** implement repost: Followers vs this one buyer is unresolved. Reposting to all trader followers would overshare. API/UI must not report auto-repost as On. |
| Why it matters | Collection audience is Followers / Selected / Connection — a lane is one buyer. |
| Impact if ignored | Invented leak of mill identity/catalog. |
| Recommendation | Stage 6 **Later**. Decision needed: Selected audience = that buyer only, vs a dedicated lane feed, vs manual Repost only. |
| Priority | Future improvement |

---

## Approved scope for this slice

What may be implemented / journey-tested after this review (only if disposition is **Proceed**):

- Docs: mixed Place routing; Your paths create; qty history; mapping; future-only lane edits.
- Reveal-before-Send fix on TradeLane PATCH.
- Facilitator notifications on Direct create/status.
- `sourceItemId` + unambiguous backfill; hop/confirm/dispatch/amend/take-control/mill desks use it.
- Trail payload + confirmed snapshots; Restore must not rewind to ask when a confirm exists.
- Mill→parent pass-through for confirm, decline, qty, rate, Can’t supply (mapped lines only). Qty chat before → after; living card.
- `createFromPack` mixed routing by lane ticket + `behaviors.directOrder` (default on). Direct mills → Direct orders (facilitator = pack owner). Other mill lines + trader-owned → one Manage parent + hops. Item appears once.
- POST `/trade-lanes` create from two active connections; persist behaviors; UI ticked/locked.
- Tests listed in the implementation brief (API first).

## Explicitly deferred / rejected

- Auto-repost of mill collections (G-007) — persist `autoRepost: false`; `LANE_AUTOREPOST_AVAILABLE` keeps the view off until Stage 6.
- Editable Direct-order / auto-repost toggles.
- Payment collection, commission, refunds.
- New `DirectLink` table.
- Mandatory buyer accept/reject on operational qty/shortage.
- Silently rerouting **open** orders when Your paths / ticket changes.
- Exploding an open Manage ticket into N Directs on live flip (live flip stays on main; next Place follows the lane).
- Rewriting I-handle desk, Send-hold, or packing-list UX.
- Guessing historical photo / duplicate-SKU mappings.
- Production migrations or deploys.

## Sign-off

Required gaps closed or deferred in writing: Yes (G-007 Later; FG-007 extra-after-settle not expanded into payment/settlement rewrite)  
Ready for implementation / `@functional` journeys: Yes
