# Unified main order + linked mill lots — redesign

**Date:** 2026-09-08  
**Status:** Approved; **Proceed slice shipping** (pack Place always main+lots; buyer mill cards when ticket=mill)  
**Completeness:** Redesign `…-unified-main-linked-lots-completeness.md` · Proceed `…-unified-main-linked-lots-proceed.md`  
**Journey matrix:** `docs/superpowers/reviews/2026-09-08-multi-supplier-journey-matrix.md`  
**Supersedes for curated / multi-supplier Place:** “Direct = N independent buyer orders via batch” as the primary story

---

## Problem

Same curated pack (supplier A + B) today can become:

1. **I handle** — one main ticket with trader + mill lots (desk), or  
2. **Direct / batch** — two separate orders and two chats with no shared main.

Buyers expect one place → one order. Two suppliers → two mill chats is fine **only if** both stay under that main.

## Decision

**One Place shape always for trader-curated multi-supplier:**

```text
One main order (#MAIN)
  ├── Lot → Supplier A (#A)   linked
  └── Lot → Supplier B (#B)   linked
```

- List / Find: **one** row for the buyer (and for the trader).  
- Detail: **main + supplier cards** (same desk language as today’s trader I-handle desk).  
- Lots stay connected to the main (not orphan batch tickets).

**Trader choice is visibility / chat, not structure:**

| Mode (working names) | Buyer sees | Chats (default) |
|----------------------|------------|-----------------|
| **Private** (Me + reveal Off) | Main with **trader** only; mill names soft-hidden | Buyer↔trader; trader↔each mill |
| **Transparent** (ticket mill) | Buyer sees mill cards on main | Same desk; optional group |
| **Reveal On** | Mill **named on main order and** in trio chat (soft-hide off for that mill) | One group per mill after Send; subset card |

Default remains **Private** (I handle + no group). Transparent is opt-in (Your paths / order switches).

## What changes vs shipped

| Area | Today | Target |
|------|--------|--------|
| Curated pack Place | from-pack Manage **or** batch if Direct stamp | **Always** main + N linked lots |
| Direct meaning | Often N bilateral / batch orders | Mills **visible** on the shared main |
| TradeLane `ticket` | May flip who owns the buyer ticket | Prefer: counterpart still trader on main; mills shown or hidden |
| Reveal / trio | Opt-in; subset in group | Keep; still one group per mill; subset card |
| Batch API | Primary multi-supplier Direct path | **Not** primary for curated pack; keep for true multi-seller without one trader facilitator (Later / narrow) |

## Locked before implement

1. **Quote path when transparent:** **Trader still Send quote** on the main. Mills quote the trader on lots (same as today). Transparent = visibility, not skipping the middle. Buyer Accept quote stays on main.  
2. **Confirm / dispatch:** Mill fulfills lot; pass-through to main (already). Buyer actions stay on main where they do today.  

## Still open (narrow)

3. **Selection without pack stamp but one facilitator:** Same main+lots or still batch? Recommendation: main+lots when a single trader is in the loop.  
4. **Copy at Place confirm:** e.g. “One order · 2 suppliers” / mill preview — **Skipped for now** (2026-09-08). Revisit when Place confusion shows up in use.

**Live flip Me → mill (shipped 2026-09-09):** Stay on **one main** + linked lots. **Mills** = observe on that main card; buyer sees mill desks. See `docs/features/orders.md`.

## Out of scope

- Ask supplier (Slice B)  
- Agent  
- Reworking single-supplier Direct bilateral for non-curated one-mill shares (can stay Later)  
- Code in this Completeness pass

## Tests (when Proceed slice ships)

- F1: A+B curate → Place → one list row; two mill cards; Private soft-hide for buyer  
- F-transparent: same Place; buyer sees A + B on main  
- No batch confirm with two unlinked chats for curated pack  
- Reveal On × two mills → two groups; subset cards  

## Related

- I-handle desk: `2026-09-07-trader-i-handle-desk-design.md`  
- Trio subset: `2026-09-08-trio-subset-card-design.md`  
- TradeLane: `2026-09-02-tradelane-design.md` (update when implement)  
