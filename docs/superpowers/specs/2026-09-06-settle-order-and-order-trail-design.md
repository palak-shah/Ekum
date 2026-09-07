# Settle order + order audit trail

**Date:** 2026-09-06  
**Status:** Approved for implementation  
**Anchors:** `docs/features/orders.md`, order timeline, living chat cards  
**Related:** part-ship / dispatch; prior ask for notes on every status change  
**Supersedes (lifecycle end):** buyer **Mark delivered** as the normal close path

## Problem

After **Part shipped**, the seller can only dispatch more. There is no way to stop shipping and close on what already left. **Mark delivered** puts the close on the buyer and does not rewrite quantities to what actually shipped. The order timeline is mostly derived milestones — weak for repeated edits, settle, and “who / when / note” per step.

## Decision

1. **Seller-only Settle order** — stops remaining ship when qty mismatched (part shipped); closes on what already shipped.  
2. **On Settle, line quantities become what was shipped** (authoritative qty = shipped).  
3. **Full dispatch** (nothing left to ship) **completes** as **`dispatched`** — no buyer Mark delivered; **not** auto-`settled`.  
4. **`settled`** only when the seller uses **Settle** (mismatch). Both `dispatched` and `settled` are order complete. Timeline **Settled** only on the settle path.  
5. **Separate append-only order audit trail** drives the Order detail Timeline (not only derived status fields). Living chat cards still update in place for the trade thread.

### Explicitly not in this slice

- Buyer Settle  
- Keep Mark delivered as the happy path (removed / retired for new tickets)  
- Full rewrite of returns (returns attach after **dispatched** or **settled**)  
- Voice/text notes on every action (same `NoteVoiceField` pattern; wire on Settle + trail rows in the same wave if small, else follow-up)

---

## §1 Lifecycle

| Situation | Seller action | Result |
|-----------|---------------|--------|
| Part shipped (remaining &gt; 0) | **Dispatch more** | Another shipment; may stay part shipped or complete |
| Part shipped | **Settle order** | Qty → shipped; remaining cancelled; status → **`settled`** (Timeline **Settled**) |
| Dispatch leaves remaining = 0 | (automatic) | Status → **`dispatched`** (complete; Timeline **Dispatched** only) |
| Before any ship | Confirm / quote / cancel / decline | Unchanged |

**Partial ship meaning:** asked qty vs shipped qty differ (less **or** more than asked on a line — more only if product rules allow; default settle caps at shipped, never invents unshipped stock).

**Settle sheet:** per shippable line, final qty defaults to **already shipped**; seller may only set final qty **≤ shipped** for this slice (won’t ship the rest — not “claim more arrived”). Confirm → write quantities, close.

**Status rollup**

| Status | Meaning |
|--------|---------|
| `requested` / `confirmed` / `part_shipped` / `declined` / `cancelled` | As today; part ship is its own main status |
| **`dispatched`** | Full ship done — **order complete**. Return window starts. |
| **`settled`** | Seller closed a **mismatch** via Settle — **order complete**. Qty = shipped. |
| `delivered` | Legacy; lists treat as completed |

**Recommendation:** on full last dispatch set **`dispatched`** (no Settled trail). On Settle set **`settled`**.

---

## §2 Quantities on Settle

- For each confirmed/shippable line: **`quantity` := shipped quantity** (sum of shipment lines).  
- If shipped = 0 on a confirmed line and seller settles: treat as **won’t supply** (line declined or qty 0 — prefer qty 0 + clear trail detail).  
- `requestedQuantity` stays the original ask (audit of what was asked).  
- Totals / chat card copy use post-settle quantities.  
- No further dispatch after `dispatched` or `settled`.

---

## §3 Chat

- Living order card: full ship → `order_dispatched` (“Dispatched · complete”); Settle → `order_settled` (“Settled · 80 of 100”).  
- Notify the buyer (same living-card announce path as quote fix).  
- Preserve `metadata.quoted` and quote voice fields across upserts.

---

## §4 Separate order audit trail (Timeline source of truth)

### Model

Append-only **`OrderTrailEvent`** (name flexible in impl):

| Field | Purpose |
|-------|---------|
| `orderId` | Parent |
| `type` | e.g. `requested`, `updated`, `quoted`, `confirmed`, `part_shipped`, `dispatched`, `settled`, `cancelled`, `declined`, … |
| `at` | When |
| `actorCompanyId` / `actorUserId` | Who |
| `summary` | Short trader line (optional) |
| `detail` | e.g. offered vs asked, “Closed on 80 of 100” |
| `note` / `noteVoiceMediaId` … | Optional note on that step |
| `payload` | Json snapshot if needed (qty changes) |

### Timeline UI

- Order detail **Timeline** reads **trail events** (chronological), not only `buildOrderTimelineSteps` from status columns.  
- Each row: **label · date · who** (your team → staff name; other shop → **business name** only).  
- Optional note / voice under the row.  
- Backfill: on migrate, synthesize trail rows from existing order timestamps (`createdAt`, `quotedAt`, `confirmedAt`, shipments, `closedAt`, …) so old tickets still show a timeline.

### Why separate

- Survives repeated edits, multiple shipments, settle.  
- Holds per-step notes without overwriting `Order.note`.  
- Chat living card stays one row; **audit trail** is the full history on the order page.

---

## §5 Platform consistency

- Kit sheets + full-width primary CTA; Settle is destructive-ish → confirm on sheet, not a silent tap.  
- Copy: **Settle order**, **Part shipped**, **Settled** — no Seller/Buyer on chat body.  
- Completed lists / attention: treat `settled` (+ legacy `delivered`) as completed.  
- BM-07: Settle sheet above bottom nav must not clip lines.

---

## §6 Tests (when implementing)

- Unit: settle qty math; timeline from trail; full dispatch → `dispatched`  
- API: settle while part shipped; reject settle when nothing shipped / wrong actor; trail rows written; chat announce  
- Functional: part ship → Settle → timeline Settled + qty; full dispatch → `dispatched` without buyer deliver  

## Docs to update when shipping

- `docs/features/orders.md` — status table, settle, trail, retire Mark delivered for new path  
- Gap matrix  

## Open points (resolve in plan if needed)

1. Exact enum string: `settled` vs `completed` — **prefer `settled`** (matches CTA).  
2. Returns window start: `settledAt` instead of `deliveredAt`.  
3. Whether legacy `delivered` tickets are backfilled to trail only or also status-aliased in UI filters.
