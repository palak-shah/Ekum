# Orders Lifecycle Test Plan

**Date:** 2026-11-04  
**Module / ask:** Executable test plan for every audit scenario A–M and listed explicit assertions.  
**Anchors:** `2026-11-04-orders-state-and-waiting-map.md`, `docs/features/orders.md`, `apps/api/src/orders/*`, `apps/web/src/features/orders/*`, `apps/e2e/tests/functional/orders*`  
**Disposition:** Proceed (investigation + test plan only — **no** behaviour change)

> Investigation and testing only. Proposed tests below are **not** implemented in this pass. Baseline results (§8) are from running **existing** suites as-is. Do not treat baseline failures as fixed.

---

## 0. How to read this plan

| Column | Meaning |
|--------|---------|
| **Existing** | Coverage today (Yes / Partial / No / Contradicted) |
| **Layer** | Recommended: Unit (Vitest web helpers) · API (Vitest OrderService) · E2E (Playwright `@functional`) |
| **File** | Exact path to extend or create |
| **P0–P3** | Execution priority (§7) |

**Wait verb lock:** released mill = **confirm** (not accept). List stays generic `Waiting: supplier`.

**Held is not a status:** hop stays `requested`; `upstreamReleasedAt == null` = held.

---

## 1. Scenario matrix (A–M) — coverage at a glance

| ID | Scenario | Types touched | Existing | Gap severity | Primary layer to add |
|----|----------|---------------|----------|--------------|----------------------|
| A | Bilateral Place | Buying/Selling 1:1 | Partial | Med | API + E2E wait asserts |
| B | Supplier Confirm | 1:1 | Partial | Med | API `confirmedRate` stamp |
| C | Supplier qty before/after Confirm | 1:1 · mill hop | Yes / Partial | Low | API pre-confirm `setLineQuantity` reject |
| D | Buyer amend before/after Confirm | 1:1 · Manage | Partial | **High** | API reject after Confirm + UI Edit gate |
| E | Direct Place | Direct | Partial | Med | E2E mill Selling + waits |
| F | I-handle one mill | Manage · mill hop | Yes | Low | Mill-side held GET/list |
| G | I-handle multi mill | Manage · N hops | Partial | Med | Plural waits + Send all cue |
| H | Send / release | Mill hop | Yes | Low | Status stays `requested` assert |
| I | Mill confirm + pass-through | Mill · parent | Partial | Med | API parent line roll-up unit |
| J | You fulfilment child | You hop · parent | Yes | Med | Parent You wait strings |
| K | Mixed Place | Direct + Manage (+You) | Partial | Med | Parallel lifecycle E2E |
| L | Partial then later dispatch | 1:1 · hops | Yes | Low | List Needs you Dispatch |
| M | Decline / cancel / hold / resume | All | Partial | **High** | Cancel/Decline status + millDecline `sourceItemId` |

---

## 2. Explicit assertion matrix

| # | Assertion | Existing | Contradicted by code/test? | Recommend |
|---|-----------|----------|----------------------------|-----------|
| 1 | Buyer qty edit stops after supplier Confirm | **No** | Untested | API amend reject + E2E Edit hidden |
| 2 | Supplier qty edit allowed after Confirm | **Yes** | — | Keep; add settled reject |
| 3 | Rate → `OrderItem.rate`; first Confirm stamps `confirmedRate` | **Partial** | Stamp untested | API assert stamp + no overwrite |
| 4 | No live waiting-for-rates | **Partial** | Dead `nextOrderAction` still tested | Guard UI; quarantine dead-copy tests |
| 5 | Held mill invisible until Send | **Yes** (API) | E2E weak on mill actor | E2E mill list/GET held → absent/404 |
| 6 | Released mill waiting-to-**confirm** until Confirm | **Yes** (web/E2E) | — | Add `not.toMatch(/accept/i)`; clear after Confirm |
| 7 | Buy/Sell + shipment progress only after supplier Confirm | **No** | E2E shows progress while `waiting to confirm` | Product decision then Unit/E2E gate |
| 8 | Buy = hop rate; Sell = parent via `sourceItemId` | **Partial** | `buildMillDesks` untested | API/unit `buildMillDesks` + dup SKU |
| 9 | Progress uses actual shipment qty | **Yes** | — | Keep |
| 10 | You child operated on own ticket | **Partial** | API allows parent dispatch of You lines | Align product; API or web gate |
| 11 | Buyer cannot access hidden You / held mill hops | **Yes** (E2E You) | Held mill buyer GET thin | API buyer GET held hop 404 |
| 12 | Parent cannot dispatch mill-mapped lines | **Yes** | — | Add mixed mill+You dispatch call |
| 13 | No duplicate/contradictory waits | **Partial** | List vs detail intentional drift | Assert single dock wait; document list vs detail |
| 14 | `millDecline` maps by exact `sourceItemId` | **No / Contradicted** | Test asserts `productId` match | Fix product first; then API dup-SKU |

---

## 3. Scenario walkthroughs (executable specs)

Each step lists: **initial** → **actor** → **API/action** → **DB** → **parent/child** → **lists** → **wait/Needs-you** → **detail controls** → **result**.  
**Existing** / **Missing** / **Propose** close each scenario.

### A. Buyer places bilateral order

| Step | Initial | Actor | Action | DB status / lineStatus | Parent/child | Buying / Selling | Wait / Needs-you | Detail controls | Result |
|------|---------|-------|--------|------------------------|--------------|------------------|------------------|-----------------|--------|
| A1 | None | Buyer | `POST /orders` create | Order `requested`; lines `open` | One bilateral | Buyer Buying; supplier Selling | Buyer: `Waiting: supplier` (list/detail TBD); seller: `Needs you Confirm` | Buyer: Cancel · Edit; seller: Decline · Confirm | Ticket exists both sides |
| A2 | After A1 | — | GET lists | unchanged | — | Same | List seller glance Confirm | — | Needs-you count includes seller |

**Existing:** API create snapshots (`order.service.spec.ts`); E2E place via helpers; list Needs Confirm (`orders.list-actions`, `orders.chrome`); web `tradeListGlance` / `tradeNeedsYouLabel`.  
**Missing:** Assert lines start `open` + status `requested`; buyer `Waiting: supplier` immediately after Place (chrome currently expects ticket wait count 0 on fresh buyer ticket — document product).  
**Propose:**
- **API** extend `apps/api/src/orders/order.service.spec.ts` — create asserts `status===requested`, items `lineStatus===open`.
- **E2E** extend `apps/e2e/tests/functional/orders.chrome.journey.spec.ts` or new `orders.lifecycle-bilateral.journey.spec.ts` — after Place, seller list `Confirm`; pin product decision on buyer wait at Place.

---

### B. Supplier confirms

| Step | Initial | Actor | Action | DB | Parent/child | Lists | Wait | Detail | Result |
|------|---------|-------|--------|-----|--------------|-------|------|--------|--------|
| B1 | A1 | Seller | `confirm` / `decideLines` | → `confirmed`; kept lines → `confirmed`; stamps `confirmedRate`/`confirmedQuantity` on first lock | Same | Seller Needs Confirm clears; buyer may stay Waiting: supplier until Dispatch flip | Seller dock → Dispatch when remaining | Confirmed ticket |

**Existing:** API state machine + decideLines; E2E Confirm sheet (`orders.chrome`); fulfillment confirm paths.  
**Missing:** `confirmedRate` stamp; Needs-you clear assert; all-declined → `declined`.  
**Propose:**
- **API** `order.service.spec.ts` decideLines: assert `confirmedRate`/`confirmedQuantity`; second confirm does not overwrite; all declined → `declined`.
- **E2E** after Confirm, seller list no longer Needs Confirm; buyer progress rules per assertion 7.

---

### C. Supplier changes qty before / after Confirm

| Step | Initial | Actor | Action | DB | Notes |
|------|---------|-------|--------|-----|-------|
| C1 before | `requested` open | Seller | Confirm sheet qty/rate via `decideLines` | line qty/rate updated; then confirmed | Allowed |
| C2 after | `confirmed`+ | Seller | `setLineQuantity` | qty ≥ shipped; may reopen `part_shipped` | Buyer forbidden |
| C3 before abuse | `requested` | Seller | `setLineQuantity` | Reject “Use Confirm…” | Untested |

**Existing:** decideLines qty; `order.set-line-quantity.spec.ts`; E2E fulfillment 50→45; `OrderLineFulfillExpand`.  
**Missing:** C3 reject; mill→parent qty pass unit (stubbed).  
**Propose:** **API** `order.set-line-quantity.spec.ts` — reject when status `requested`; **API** mill pass qty after Confirm (un-stub `passMillLinesToParent` or dedicated).

---

### D. Buyer amends qty before / after Confirm

| Step | Initial | Actor | Action | DB | Lists / detail |
|------|---------|-------|--------|-----|----------------|
| D1 before | `requested`, all open, no seller msg | Buyer | `amend` | qty/lines update; Manage syncs hops by `sourceItemId` | Edit visible |
| D2 after Confirm | `confirmed` | Buyer | `amend` | **Reject** | Edit must be off |
| D3 after seller msg | `requested` but seller messaged | Buyer | `amend` | **Reject** (`buyerCanAmend` false) | Edit off |

**Existing:** D1 API + E2E slice-d (note: slice-d **failed baseline** — `accessTokenFromPage`); chrome Edit visible on requested.  
**Missing:** D2, D3 entirely.  
**Propose (P0):**
- **API** `order.service.spec.ts` — amend on confirmed → 4xx; amend after seller note → 4xx.
- **Unit** `orderActionDock` / OrderDetailPage — `canAmend` false when confirmed.
- **E2E** after Confirm, buyer dock has no Edit (or Edit disabled); amend API 4xx.

---

### E. Buyer places Direct order

| Step | Initial | Actor | Action | DB | Parent/child | Lists | Wait | Detail | Result |
|------|---------|-------|--------|-----|--------------|-------|------|--------|--------|
| E1 | Direct Link + Share | Buyer | Place | `tradeMode=direct` `requested`; **no** hold | None | Buyer Buying; mill Selling **immediately**; trader Shared | Buyer Waiting: supplier; mill Needs Confirm | Mill Confirm; **no** Send | Trio chat |

**Existing:** API Direct create; E2E `orders.tradelane-reveal`, `orders.one-trio` (baseline: tradelane-reveal **failed** on “Order goes to…” copy).  
**Missing:** Mill Selling visibility; wait strings; facilitator no Send (partially asserted via `canSendUp`).  
**Propose:** **E2E** after Direct Place: mill Selling lists ticket; no Send; mill Needs Confirm; buyer Waiting: supplier.

---

### F. I-handle one mill (held → Send → confirm wait)

| Step | Initial | Actor | Action | DB | Parent/child | Lists | Wait | Detail | Result |
|------|---------|-------|--------|-----|--------------|-------|------|--------|--------|
| F1 | Place handle | Buyer | create manage | Parent `manage` `requested`; hop `requested` + `upstreamReleasedAt` null | Parent + held hop | Buyer → parent; trader Trading; mill **cannot** list hop | List: Needs Forward; detail: Send on card; ticket wait silent while held | Mill card Send · Decline | Held |
| F2 | F1 | Trader | `sendUp` | Hop still `requested`; `upstreamReleasedAt` set | Released | Mill Selling shows hop | Parent: `Waiting on {mill} to confirm`; card `Buying # · waiting to confirm`; hop dock `Waiting for {mill} to confirm` | No parent Dispatch | Mill can Confirm |

**Existing:** Strong — API send-up + hold; web iHandleDesk; E2E `orders.i-handle-desk.journey` (**passed** baseline).  
**Missing:** Mill actor held list/GET; exact mill name in wait regex; Status stays requested after Send.  
**Propose:** **API** assert hop status unchanged on sendUp; **E2E** as mill: held GET 404 / not in Selling; after Send visible.

---

### G. I-handle multiple mills

| Step | Initial | Actor | Action | DB | Wait / controls |
|------|---------|-------|--------|-----|-----------------|
| G1 | Multi mill Place | System | spawn N held hops | Parent + N held | `Your move: Send mill lots` / Send all; per-card Send |
| G2 | Partial Send | Trader | `sendUp` one id | One released | Remaining Needs Forward; released enter confirm wait; plural `Waiting on mills to confirm` when 2+ released requested |

**Existing:** from-pack multi E2E D1/D3 (**passed**); web Send all dock.  
**Missing:** Exact `Send mill lots` / plural confirm wait strings.  
**Propose:** **Unit** `iHandleDesk.spec.ts` for plural strings; **E2E** after releasing 2 mills assert `Waiting on mills to confirm`.

---

### H. Trader Send / release

| Step | Initial | Actor | Action | DB | Result |
|------|---------|-------|--------|-----|--------|
| H1 | Held hop | Trader | `sendUp` (± qty/rate patch) | Release flag; optional line patch; status **unchanged** `requested` | Mill notified/listable; trail “You sent…” |

**Existing:** API send-up notify + patch; E2E Send click.  
**Missing:** Explicit status-stays-requested; Send with edited qty/rate end-to-end.  
**Propose:** **API** already nearly there — add `expect(status).toBe('requested')`; **E2E** change qty on held card then Send → mill sees new qty.

---

### I. Mill confirms / qty / can’t supply

| Step | Initial | Actor | Action | DB | Parent/child | Wait shift |
|------|---------|-------|--------|-----|--------------|------------|
| I1 | Released hop `requested` | Mill | `confirm` / `decideLines` | Hop → `confirmed`; lines confirmed | Pass-through parent mapped lines via `sourceItemId` | Parent → dispatch wait or You cue |
| I2 | Confirmed hop | Mill | `setLineSupply` / qty | Hop + parent mapped | — | |
| I3 | Open line | Mill | Can’t supply | Line declined/zero path | Parent mapped open updated | |

**Existing:** E2E slice-c / mixed-you-hop API mill confirm+dispatch; pass roll-up specs.  
**Missing:** Unit parent rate/qty/lineStatus after mill confirm; mill UI Confirm sheet; can’t-supply mill.  
**Propose:** **API** un-stub pass on mill confirm; **E2E** mill login → Confirm sheet on hop → parent card wait flips to dispatch.

---

### J. You fulfilment child

| Step | Initial | Actor | Action | DB | Visibility | Wait | Operate on |
|------|---------|-------|--------|-----|------------|------|------------|
| J1 | Leftover trader SKUs | Place | `spawnTraderOwnedFulfilmentHop` | You hop silent-released bilateral-shaped | Buyer GET **404**; mill never lists | Parent: `Your move: Confirm your lots` | You hop Confirm |
| J2 | You `requested` | Trader | Confirm/Dispatch on **You hop id** | You + parent line roll-up | — | → `Waiting on You to dispatch` then clear | Not parent Dispatch for leftover (product) |
| J3 | Mixed open mill + You out | — | — | Parent heal `part_shipped` not full Dispatched | — | — | |

**Existing:** Strong E2E mixed-you-hop (**passed**); web You card cues.  
**Missing:** Exact parent wait strings; API vs web on “You lines on parent dispatch” (contradiction — see §2 #10).  
**Propose:** **E2E/Unit** assert Confirm your lots / Waiting on You to dispatch; **Completeness** before changing API allow parent You dispatch.

---

### K. Mixed Place

| Step | Initial | Actor | Action | Records | Lifecycles |
|------|---------|-------|--------|---------|------------|
| K1 | Sheet1 Direct + Sheet2 Manage | Buyer | Place | N Direct + 1 Manage + hops (+ optional You) | Parallel: Direct mill Confirm **without** Send; Manage Send on hops only |
| K2 | After K1 | Mill Direct / Trader | Confirm / Send | Independent | Direct never under Manage Send |

**Existing:** Place-time API + E2E tradelane (baseline fail) / one-trio.  
**Missing:** Parallel lifecycle after Place.  
**Propose:** **E2E** `orders.mixed-place.lifecycle.spec.ts` — Direct mill confirms while Manage still held; then Send I-handle hop; assert Direct never shows Send.

---

### L. Partial then later dispatch

| Step | Initial | Actor | Action | DB | Wait |
|------|---------|-------|--------|-----|------|
| L1 | Confirmed remaining | Seller/mill/You | `dispatch` partial | → `part_shipped` | Needs you Dispatch / Waiting on mill to dispatch |
| L2 | part_shipped | Same | Dispatch more | → `dispatched` when remainder 0 | Clears |
| L3 | shipped+remaining | Seller | `settle` | → `settled` | Needs Settle clears |

**Existing:** Strong API + E2E fulfillment (2 baseline fails unrelated to core roll-up).  
**Missing:** List Needs you Dispatch/Settle text; mill dispatch wait string.  
**Propose:** **E2E** list glance Dispatch/Settle; **Unit** `Waiting on {mill} to dispatch`.

---

### M. Decline / cancel / hold / resume

| Action | Actor | API | DB | Parent/child | Lists | Wait / detail |
|--------|-------|-----|-----|--------------|-------|---------------|
| Seller decline all | Seller | `decline` / decideLines all | → `declined` | — | Completed declined | No Confirm |
| Held millDecline | Trader | `millDecline` | Hop declined; parent opens by **`sourceItemId`** (desired) | Mapped opens only | — | Card gone / declined |
| Buyer cancel | Buyer | `cancel` | `requested`\|`confirmed` → `cancelled` | — | — | Chat Cancelled card |
| Pass Hold | Trader | `millPassHold` | `passHeldAt` set; status unchanged | — | — | Card `Buying # · Held` |
| Resume | Trader | clear hold | `passHeldAt` null | — | — | Wait resumes |

**Existing:** Hold/resume E2E (**passed**); millDecline API by **productId** (contradicts #14); cancel card API; line decline chrome.  
**Missing:** Whole-order Decline E2E; Cancel E2E; millDecline dup-SKU `sourceItemId`; `millPassHold` unit.  
**Propose (P0 for #14):** product Completeness → fix mapping → API test with two same `productId` different `sourceItemId`; **E2E** Cancel + Decline status.

---

## 4. Type × scenario coverage checklist

| Type | A | B | C | D | E | F | G | H | I | J | K | L | M |
|------|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Buying/Selling 1:1 | ● | ● | ● | ● | | | | | | | | ● | ● |
| Direct | | ○ | ○ | | ● | | | | ○ | | ● | ○ | ○ |
| I-handle Manage | | | ○ | ○ | | ● | ● | ● | ○ | ○ | ● | ○ | ● |
| Mill hops | | | ○ | | | ● | ● | ● | ● | | ● | ● | ● |
| You fulfilment | | | ○ | | | | | | | ● | ○ | ● | ○ |
| Mixed | | | | | | | | | | ○ | ● | ○ | ○ |

● = in-scope primary · ○ = secondary / extend when building primary

---

## 5. Existing coverage map (file index)

### API — `apps/api/src/orders/`

| File | Purpose | Scenarios |
|------|---------|-----------|
| `order.service.spec.ts` | Create, amend, quote, decideLines, confirm, dispatch, settle, cancel card, parent mill-dispatch reject, You on parent dispatch | A B C D L M (+#10/#12) |
| `order.service.send-up.spec.ts` | sendUp, held visibility, millDecline, audits | F H M (#5 #14) |
| `order.service.from-pack.spec.ts` | Manage/Direct/mixed/You spawn | E F G J K |
| `order.amend-stable-identity.spec.ts` | sourceItemId amend sync | D |
| `order.set-line-quantity.spec.ts` / `order.set-line-supply.spec.ts` | Seller qty after lock | C #2 |
| `order.pass-mill-shipment-roll-up.spec.ts` | Mill ship → parent | I L #9 |
| `order.serializer.spec.ts` | remaining, part_shipped heal, passHeld | L J |
| `i-handle-desk.spec.ts` / `orderHold.spec.ts` | Match/hide/pass rules | F J #5 #8 #11 |
| `order-events.spec.ts` | **Dead** rates nextOrderAction | #4 debt |
| `buy-for-buyer.service.spec.ts` | Direct/I-handle splits | E K |

### Web — `apps/web/src/features/orders/`

| File | Purpose | Scenarios |
|------|---------|-----------|
| `iHandleDesk.spec.ts` | Desk waits, Send all, You cues, Buy/Sell caption, confirm verb | F G H J #6 #8 #13 |
| `orderTicketChrome.spec.ts` | Ticket wait + progress | A L #9 #13 |
| `tradeListGlance.spec.ts` / `tradeNeedsYouLabel.spec.ts` / `tradeListProtocol.spec.ts` / `orderAttention.spec.ts` | List Needs-you / Waiting | A B F #4 |
| `decideLinesSheet.spec.ts` / `dispatchSheet.spec.ts` / `lineFulfillCard.spec.ts` | Confirm/Dispatch chrome | B C L |
| `AmendOrderSheet.spec.tsx` | Amend layout only | D (thin) |

### E2E — `apps/e2e/tests/functional/` (+ `orders.card` smoke)

| File | Tags | Scenarios |
|------|------|-----------|
| `orders.lifecycle.spec.ts` | `@functional @release @orders` | A B (quote path) |
| `orders.chrome.journey.spec.ts` | `@functional @release @orders` | A B C D L + Forward |
| `orders.fulfillment.journey.spec.ts` | `@functional @release @orders` | B C L #2 |
| `orders.i-handle-desk.journey.spec.ts` | `@functional @orders` | F H M hold #6 #13 |
| `orders.from-pack-multi.journey.spec.ts` | `@functional @orders @trader` | G H |
| `orders.mixed-you-hop.journey.spec.ts` / `.lifecycle.spec.ts` | `@functional @orders` | J I L #11 #12 |
| `orders.slice-c-mill-roll-up.lifecycle.spec.ts` | `@functional @orders` | I L G |
| `orders.slice-d-amend-identity.lifecycle.spec.ts` | `@functional @orders` | D |
| `orders.tradelane-reveal.journey.spec.ts` | `@functional @orders` | E K |
| `orders.one-trio.journey.spec.ts` | `@functional @orders @chat` | E K |
| `orders.list-actions.journey.spec.ts` | `@functional @orders` | Needs-you verbs |
| `orders.card.spec.ts` | `@smoke @regression @orders` | Chat card only — **not** lifecycle |

**Tag note:** No A–M lifecycle waits are `@smoke @regression`. Docker smoke greps `@smoke` only.

---

## 6. Proposed tests (do not implement in this pass)

### P0 — correctness / privacy / identity

| ID | Assertion/scenario | Layer | File | Spec title (proposed) |
|----|-------------------|-------|------|------------------------|
| T-P0-1 | #1 #D2 buyer amend after Confirm rejected | API | `order.service.spec.ts` | `rejects buyer amend after confirm` |
| T-P0-2 | #1 Edit gated in UI after Confirm | E2E | `orders.chrome.journey.spec.ts` | `buyer dock hides Edit after Confirm` |
| T-P0-3 | #3 first Confirm stamps `confirmedRate` | API | `order.service.spec.ts` | `decideLines stamps confirmedRate once` |
| T-P0-4 | #14 millDecline by `sourceItemId` (after product fix) | API | `order.service.send-up.spec.ts` | `millDecline declines only sourceItemId-matched parent lines` |
| T-P0-5 | #5 mill GET/list held hop | E2E | `orders.i-handle-desk.journey.spec.ts` | `mill cannot list or open held hop before Send` |
| T-P0-6 | #11 buyer GET held mill hop 404 | API | `order.service.send-up.spec.ts` | `buyer cannot get held mill hop` |
| T-P0-7 | M Cancel end-to-end status | E2E | new or chrome | `buyer cancel moves ticket to cancelled` |
| T-P0-8 | M whole-order Decline | E2E | chrome / fulfillment | `seller Decline all → declined` |

### P1 — wait honesty / Manage desk

| ID | Focus | Layer | File |
|----|-------|-------|------|
| T-P1-1 | #6 negative `/accept/i` on Manage waits | Unit | `iHandleDesk.spec.ts` |
| T-P1-2 | #6 wait clears after mill Confirm | E2E | i-handle + mill login |
| T-P1-3 | G plural `Waiting on mills to confirm` | Unit + E2E | iHandleDesk + from-pack |
| T-P1-4 | J `Confirm your lots` / `Waiting on You to dispatch` | Unit + E2E | iHandleDesk + mixed-you-hop |
| T-P1-5 | L list Needs you Dispatch / Settle | E2E | list-actions |
| T-P1-6 | #13 single `order-ticket-waiting` + document list vs detail | E2E | i-handle-desk |
| T-P1-7 | #4 OrderDetailPage never shows for rates | Unit/E2E | orderTicketChrome / i-handle |
| T-P1-8 | F/H hop status stays `requested` after Send | API | send-up.spec |

### P2 — money / progress / mapping

| ID | Focus | Layer | File |
|----|-------|-------|------|
| T-P2-1 | #7 product gate Buy/Sell+progress after mill Confirm | Unit then E2E | iHandleDesk + i-handle journey (may **change** current E2E that shows progress while waiting) |
| T-P2-2 | #8 `buildMillDesks` Buy/Sell + dup SKU | API | new `order.build-mill-desks.spec.ts` or service.spec |
| T-P2-3 | #9 mill card progress denominator | Unit | iHandleDesk |
| T-P2-4 | #10 You operate-only-on-child (product lock) | API | align or document exception in orders.md first |
| T-P2-5 | I mill confirm parent lineStatus/rate unit | API | pass-through unit |
| T-P2-6 | C3 setLineQuantity before Confirm rejects | API | set-line-quantity.spec |
| T-P2-7 | K parallel Direct confirm + Manage held | E2E | new mixed-place lifecycle |

### P3 — hygiene / regression track

| ID | Focus | Layer | File |
|----|-------|-------|------|
| T-P3-1 | Quarantine or rewrite `order-events` rates nextOrderAction tests | API | `order-events.spec.ts` |
| T-P3-2 | Add `@smoke @regression` thin path: Place → Confirm → Dispatch 1:1 | E2E | new or tag subset |
| T-P3-3 | `millPassHold` unit rejects before Send | API | new / send-up |
| T-P3-4 | Pill `Dispatched · complete` vs list `Dispatched` documented or unified | Unit | status helpers |
| T-P3-5 | Fix baseline flake/debt (§8) **as separate bugs** — not in this plan’s implement scope | — | — |

---

## 7. Prioritized execution sequence

1. **Stabilize baseline debt** (separate tickets; do not mix with new lifecycle asserts):  
   - API `send-up` mock `findFirst`  
   - E2E `accessTokenFromPage` import in slice-d  
   - E2E tradelane “Order goes to…” copy  
   - E2E fulfillment dock-after-dispatched / living-card quote path  
2. **P0 product locks** (#14 Completeness → code → T-P0-4; #1 amend gate; #3 stamp; privacy held mill).  
3. **P1 wait matrix** (confirm verb guards, You waits, plural mills, list Dispatch).  
4. **P2 money/progress** (#7 needs product call; #8 buildMillDesks; #10 You ticket).  
5. **P3** smoke tag + dead rates copy + hold unit.  
6. Re-run suites in §8 commands after each priority band; update this plan’s coverage columns.

**Suggested commands (when implementing later):**
```bash
pnpm --filter @ekum/api exec vitest run src/orders
pnpm --filter @ekum/web exec vitest run src/features/orders
pnpm --filter @ekum/e2e exec playwright test --grep @orders --workers=1
```

---

## 8. Baseline test results (2026-11-04 — existing only)

Investigation ran **existing** tests. **No code was modified** to make them pass.

### 8.1 API — `pnpm --filter @ekum/api exec vitest run src/orders`

| Metric | Result |
|--------|--------|
| Files | 40 passed · **1 failed** (41) |
| Tests | **307 passed · 1 failed** (308) |
| Duration | ~10.2s |

**Failure (do not fix in this pass):**
- `order.service.send-up.spec.ts` › `OrderService.sendUp > lets the handler Send when a mill hop is still waiting`  
- `TypeError: this.prisma.order.findFirst is not a function` at `OrderService.findYouFulfilment` (`order.service.ts` ~4797) via `get` after sendUp.  
- Likely incomplete Prisma mock after `findYouFulfilment` was added to `get`.

### 8.2 Web — lifecycle-related units

```
pnpm --filter @ekum/web exec vitest run \
  src/features/orders/iHandleDesk.spec.ts \
  src/features/orders/orderTicketChrome.spec.ts \
  src/features/orders/tradeListGlance.spec.ts \
  src/features/orders/tradeNeedsYouLabel.spec.ts \
  src/features/orders/tradeListProtocol.spec.ts \
  src/features/orders/orderAttention.spec.ts \
  src/features/orders/tradeListShipLine.spec.ts \
  src/features/orders/decideLinesSheet.spec.ts \
  src/features/orders/dispatchSheet.spec.ts \
  src/features/orders/lineFulfillCard.spec.ts
```

| Metric | Result |
|--------|--------|
| Files | **10 passed** |
| Tests | **105 passed** |
| Duration | ~12.5s |

### 8.3 E2E — key `@orders` lifecycle files

```
pnpm --filter @ekum/e2e exec playwright test \
  tests/functional/orders.lifecycle.spec.ts \
  tests/functional/orders.i-handle-desk.journey.spec.ts \
  tests/functional/orders.mixed-you-hop.lifecycle.spec.ts \
  tests/functional/orders.mixed-you-hop.journey.spec.ts \
  tests/functional/orders.slice-c-mill-roll-up.lifecycle.spec.ts \
  tests/functional/orders.slice-d-amend-identity.lifecycle.spec.ts \
  tests/functional/orders.fulfillment.journey.spec.ts \
  tests/functional/orders.from-pack-multi.journey.spec.ts \
  tests/functional/orders.tradelane-reveal.journey.spec.ts \
  tests/functional/orders.list-actions.journey.spec.ts \
  --workers=1
```

| Metric | Result |
|--------|--------|
| Tests | **24 passed · 8 failed** (32) |
| Duration | ~5.7m |
| Project | `chromium-mobile` |

**Passed (lifecycle-critical):** from-pack multi (3); i-handle desk (1); mixed-you-hop journey + lifecycle (7); slice-c (5); list-actions (2); most fulfillment (5 of 7).

**Failed (report only — no fixes):**

| Spec | Failure synopsis |
|------|------------------|
| `orders.fulfillment` › confirmed → dispatch closes as dispatched | Expected `order-action-dock` count 0; received 1 |
| `orders.fulfillment` › dispatch more… edit pulses Dispatch edited | (failed in run; see Playwright report) |
| `orders.lifecycle` › request → quote → accept → confirmed living card | Failed (~21s) |
| `orders.slice-d-amend-identity` (all 3) | `accessTokenFromPage is not a function` |
| `orders.tradelane-reveal` (both) | Missing text `/Order goes to Ahmedabad Loom Co/i` in How many helper |

---

## 9. Product decisions required before asserting (from audit + inventory)

Do **not** write green tests that encode the wrong model. Resolve via Completeness before T-P2-1 / T-P0-4 / T-P2-4:

1. **#7** — Should mill-card Buy≈/Sell and `order-mill-line-progress` hide until mill Confirm? Current E2E expects progress while `waiting to confirm`.  
2. **#14** — millDecline must use `sourceItemId` (platform rule) vs today’s `productId` + test that locks productId.  
3. **#10** — May API dispatch You leftover lines on the parent, or only on You hop? API test allows parent; web dock blocks when mill desks exist.  
4. **Buyer wait at Place** — chrome expects no `order-ticket-waiting` on fresh buyer ticket; audit wants `Waiting: supplier`. Align docs vs UI.

---

## 10. Sign-off

| Item | Status |
|------|--------|
| Scenarios A–M mapped | Yes |
| Explicit assertions 1–14 mapped | Yes |
| Existing vs missing named with files | Yes |
| Prioritized execution sequence | Yes (§7) |
| Baseline results separated from proposed | Yes (§8 vs §6) |
| Application behaviour changed | **No** |
| Defects fixed | **No** |

**Ready for implementation of new tests:** Yes, after P0 product decisions in §9 where marked.  
**Ready for behaviour fixes:** No — separate Completeness Proceed per defect.
