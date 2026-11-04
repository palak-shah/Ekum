# Feature Completeness Review — I-handle desk trade summary + You fulfilment card

**Date:** 2026-11-03  
**Module / ask:** I-handle Selling Manage parent — compact trade summary + mill/You fulfilment cards; You operate stays on the existing You Selling hop (**desk over hop**).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-11-02-mixed-you-selling-hop-completeness`, `2026-11-02-trader-ihandle-completeness`, `2026-11-03-slice-d-amend-rematch-completeness`, client prototype `Ekum Order Page Prototype (Copy).html`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

**Architecture lock (approved):** Keep `youFulfilmentOrderId` as the only Order for Confirm / qty·rate / Dispatch / Settle on leftover You lines. Manage parent shows a You fulfilment **card** (desk surface). All You operations navigate to that hop. Never call parent Confirm/Dispatch for hop-mapped lines. Preserve Slice D parent item ids + `sourceItemId`.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One Trading desk for the whole trip. Mill cards + one You card. Trader opens You hop to act. Overall wait must not hide You work when mills are done (or vice versa). Settled You card stays visible while parent still shows the trip. |
| UX Designer | Prototype `viaSum` / `viaCards` at **390px**. Trade summary quiet. Mill and You share card hierarchy; You identity = label **You** + foam (no mill avatar). Sticky title unchanged; dock unchanged. |
| Solution Architect | Verified: seller Manage GET already returns `youFulfilmentOrderId` (id only). No `youFulfilment.status`. Wait cue wires `traderDeskNextAction` but that helper is **mills-only**. Parent dispatch/confirm guards already refuse mapped lines. No schema needed — extend GET shape + desk UI. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — mill desk cards, You hop link, Selling 1:1 on hop, soft-hide pass-through.  
2. **Duplicates another feature?** No if desk-over-hop. Yes if parent re-implements Confirm/Dispatch.  
3. **Should reuse an existing workflow?** Yes — hop operate + pass-through; Slice D mapping.  
4. **Naming?** You / shop names; **Through you**; Goods go plain path language.  
5. **Units?** N/A — chrome only; no ₹ / Rate per string invent.

**Philosophy conflict?** No under desk-over-hop. Parent-level You operate or hop retirement → **Reject**.

---

## Verified current behaviour (code, not assumption)

| Concern | Verified state |
|---------|----------------|
| You hop Order | `spawnTraderOwnedFulfilmentHop`; silent-release; buyer GET 404; excluded from `millDesks` / Related mills |
| GET field | `youFulfilmentOrderId: string \| null` for **seller** on Manage parent only (`order.service.ts` ~1248–1283). **No** status object today |
| Parent You UI | `order-you-items` when `millDesks.length > 0 && leftoverYouItems.length > 0`; title `You`; seller `#` → hop; with hop = read-only line facts; legacy no-hop = `renderFulfillLine` (Slice B) |
| Mill UI | Inline cards on `OrderDetailPage` (~2187+); held Send/Decline; after Send `#` + StatusPill |
| Trade summary | **Absent** — no You sell to / You buy from / Goods go |
| Wait cue | `orderTicketWaitingCue` → `traderDeskNextAction` for I-handle selling parent when no mill still held. `traderDeskNextAction` ignores You hop — returns null when mills finished even if You still open |
| Parent dock | `orderActionDock`: no Confirm with mill desks; Dispatch blocked while any mill desk (`millDeskBlocksParentDispatch`) |
| Parent dispatch API | Refuses hop-mapped item ids (mill + You) |
| Soft-hide | Pass-through / trail scrub mill names for buyer; mill desks buyer-gated by reveal |
| Slice D | Amend update-in-place + prefer `sourceItemId` — must remain |

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | Summary + You card parity + wait cue You |
| Business rules | OK | Hop-only operate; guards stay |
| Workflows | Gap | Desk overview incomplete |
| Edge cases | OK | Legacy no hop; settled You remains on desk |
| Permissions | Gap | Buyer must not get mill names via new summary |
| User states | Gap | Wait cue mills-only |
| Notifications | N/A | |
| Error handling | OK | Hop sheets unchanged |
| Scalability | OK | One extra status select on GET |
| Mobile (BM-07) | OK | No new sticky dock |
| First glance (BM-11) | Gap | You card too quiet vs mills |
| Units | N/A | |
| Accessibility | Gap | You open path must be clear (link + status) |
| Platform consistency | OK | if Proceed desk-over-hop |

---

## Proposed 390px layout (trader, I-handle Selling Manage parent)

Scroll order inside phone column (`max-w-md`):

1. **Sticky** `Order #…` (unchanged).  
2. **Party block** (buyer · supplier cues as today) + wait cue under it.  
3. **`order-trade-summary` card** (new):  
   - You sell to · `{buyer}` · pill **Through you**  
   - You buy from · mill shop names (seller only; omit row if no mills)  
   - Goods go · default **`Supplier → your godown → {buyer}`** for I-handle soft-hide; optional straight `Supplier → {buyer}` only if a verified reveal/auto flag already exists on desks — do not invent a new lane field this slice.  
4. **Mill fulfilment cards** (existing body; optional shared shell extract).  
5. **You fulfilment card** when leftover You lines **or** `youFulfilmentOrderId` / `youFulfilment`:  
   - Identity: title **You**, foam header (no mill avatar).  
   - Designs from `leftoverYouItems`.  
   - StatusPill from hop status when hop exists (including **settled** / **dispatched** — card stays).  
   - Clear open: `#` / chevron (and optional navigate-only CTA) → `/orders/{youFulfilmentOrderId}`.  
   - Never parent Confirm/Dispatch buttons that POST parent APIs.  
6. Notes · Timeline · Dispatches (qty-only soft-hide) below.  
7. **Dock unchanged** (Send all while held; no parent Dispatch while mill desks).

Buyer parent: no mill names in trade summary; no You hop id/link; mill cards only when reveal allows (existing).

Buying / Direct / Selling 1:1 / mill hop pages: **unchanged**.

---

## Proposed API (no schema)

Extend Manage **seller** GET only:

```ts
youFulfilmentOrderId?: string | null; // keep
youFulfilment?: { id: string; status: string } | null; // new, seller-only
```

- Load with existing `findYouFulfilmentOrderId` path (select `id, status`).  
- Buyer / non-Manage / hops: omit or null.  
- Soft-hide: do not put mill shop names on buyer payloads for trade summary — either compute summary client-side from `millDesks` (already buyer-filtered) **or** omit buy-from row when `millDesks` empty for buyer.

No migration, no backfill, no new tables.

---

## Proposed UI / helpers

| Piece | Approach |
|-------|----------|
| Trade summary | New small component or Card block; `data-testid="order-trade-summary"` |
| Shared shell | Optional `FulfilmentDeskCard` — header slot + body; mill vs You variants |
| Wait cue | Extend `traderDeskNextAction` (+ `orderTicketWaitingCue`) with `youFulfilment?: { status }` — e.g. after mills quiet, `Your move: Confirm your lots` / `Waiting on You to dispatch` using **You** not a mill name |
| Settled You | Keep rendering You card when leftover lines exist or hop id present even if hop settled |

---

## Privacy analysis

| Actor | Rule |
|-------|------|
| Trader (seller on Manage) | May see mill shop names on summary + mill cards |
| Buyer | Soft-hide: no mill shop names on trade summary; no `youFulfilment` / hop id; mill desks only per reveal |
| Mill | Never opens Manage parent as party |

Do not weaken parent dispatch/confirm API guards.

---

## Gaps

### G-001 — No trade summary on I-handle parent

| Field | Content |
|-------|---------|
| Gap | Prototype summary (You sell to / buy from / Goods go) not shipped. |
| Why it matters | Trader loses trip orientation on one screen. |
| Impact if ignored | Relies on party block alone; Goods go path invisible. |
| Recommendation | Add `order-trade-summary` for I-handle Selling Manage (seller); buyer-safe variant. |
| Priority | Required before implementation |

### G-002 — You card weaker than mill cards; no hop status on parent

| Field | Content |
|-------|---------|
| Gap | You card is a quiet list + `#` only; no StatusPill; wait cue ignores You. |
| Why it matters | Outstanding You Confirm/Dispatch can look “done” when mills finish. |
| Impact if ignored | Missed Your move; settled You may disappear from mental model. |
| Recommendation | Parity card + `youFulfilment.status` + wait cue; keep card when hop settled. |
| Priority | Required before implementation |

### G-003 — Parent Confirm/Dispatch for You or mill-mapped lines

| Field | Content |
|-------|---------|
| Gap | Ask would conflict with hop lifecycle + API mapped-line refuse. |
| Why it matters | Double LRs / dual paths (mixed-hop G-003). |
| Impact if ignored | Broken roll-up / Slice D mapping trust. |
| Recommendation | **Reject** — navigate to hop only. |
| Priority | Reject / Redesign |

### G-004 — Retire You hop / schema / backfill

| Field | Content |
|-------|---------|
| Gap | Would undo shipped mixed You hop + Slice D amend rules. |
| Recommendation | **Reject**. |
| Priority | Reject / Redesign |

---

## Exact files to change (after approval)

| File | Change |
|------|--------|
| `docs/features/orders.md` | Lock desk-over-hop summary + You card + wait cue |
| `docs/superpowers/reviews/feature-gap-matrix.md` | Point to this Completeness |
| `packages/domain-types/src/orders.ts` | `youFulfilment?: { id; status } \| null` |
| `apps/api/src/orders/order.service.ts` | Seller Manage GET attach status; buyer omit |
| `apps/web/src/features/orders/OrderDetailPage.tsx` | Summary + You card parity |
| `apps/web/src/features/orders/iHandleDesk.ts` (+ spec) | Wait cue You; optional summary helpers |
| New (optional) `FulfilmentDeskCard.tsx` / `OrderTradeSummary.tsx` | Shared chrome |
| Soft-hide / serializer only if mill names leak on buyer GET | Verify; scrub if needed |
| Tests: unit desk helpers; API GET shape; e2e mixed Place desk → open You → Confirm/Dispatch; Buying/Direct smoke |

---

## Test plan

**Unit**

- Trade summary rows for seller; buyer omits mill buy-from.  
- You card visibility: leftover and/or hop; remains when hop settled.  
- `traderDeskNextAction`: mills pending wins; then You confirm/dispatch; quiet when both done.  
- Dock still blocks parent Dispatch with mill desks.

**API**

- Seller Manage mixed: `youFulfilmentOrderId` + `youFulfilment.status`.  
- Buyer GET: no `youFulfilment` / no hop id.  
- Direct / 1:1 / mill hop: field absent.

**Functional (`@functional` @orders)**

- Mixed Place → parent shows summary + mill + You → open You → Confirm/Dispatch → parent roll-up.  
- Mill Send path unchanged.  
- Settled You card still visible on parent while mills open (or after).  
- Soft-hide: buyer does not see mill names on summary.  
- Smoke: Buying 1:1, Direct unchanged.

**Trader-eye (BM-11)**  
390px: one scroll job; You vs mill identity clear; no parent Confirm for You lines.

---

## Approved scope for this slice

- Completeness (this doc).  
- After approval: lock `orders.md` + gap matrix; API `youFulfilment`; trade summary; You/mill card parity; wait cue; tests above.  
- Desk-over-hop only.

## Explicit dispositions

| Decision | Disposition |
|----------|-------------|
| Desk-over-hop UI (summary + mill/You cards + navigate to hop) | **Proceed** |
| Wait cue includes You hop | **Proceed** |
| Optional seller-only `youFulfilment { id, status }` on Manage GET | **Proceed** |
| Parent Confirm/Dispatch for hop-mapped (You or mill) lines | **Reject** |
| Retire You Selling hop | **Reject** |
| Schema / migration / legacy You backfill | **Reject** |
| Buying / Direct / Selling 1:1 chrome changes | **Reject** |
| Deploy | **Reject** |

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: **Yes — after product approval of this review** (no code until then)
