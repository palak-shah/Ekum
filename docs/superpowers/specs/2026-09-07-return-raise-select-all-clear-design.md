# Raise return — Select all / Clear

**Date:** 2026-09-07  
**Status:** Shipped 2026-09-07  
**Anchors:** `docs/features/orders.md` (Returns), raise-return sheet on Order detail  
**Related:** browse/chat multi-select copy (**Select all** / **Clear**)

## Problem

Raise a return opens with every supplyable line selected (full return). Returning one design of many means tapping **Skip** on every other row — slow on large tickets.

## Decision (Approach A)

Keep **all-on default**. Add sheet-local **Select all** and **Clear** next to the selection count — same link language as attach / staff pickers. Do **not** use page sticky `SelectAllFloat` inside the Sheet.

## Rules

| Rule | Detail |
|------|--------|
| Open | Every returnable line **on**; qty = ordered qty (unchanged) |
| Count row | Left: `{n} of {N} selected`. Right: **Select all** · **Clear** (accent text) |
| Select all | All returnable lines on; qty reset to ordered qty; **disabled** when already all on |
| Clear | All lines off (**Skip**); qty values kept but inputs stay disabled until re-selected |
| Row tap | Still toggles Return / Skip one line |
| Hint copy | Drop “leave all on for a full return” — default + Select all cover it |
| Submit | Unchanged: ≥1 selected line with qty &gt; 0 |
| Empty list | No Select all / Clear when there are no returnable lines |

## Platform consistency

- Copy: **Select all** / **Clear** (not “Clear all” / “Deselect”).
- Selection rows stay accent-border + Return/Skip — no native checkboxes.
- Sheet chrome only; no second sticky float competing with BM-07.

## Explicitly deferred

- Seller return decide sheet bulk actions  
- “Return raised” living chat card (separate ask)  
- Changing the all-on open default  

## Docs / tests when shipping

- `orders.md` — Raise return: Select all / Clear  
- Unit or light sheet test: Clear → 0 selected; Select all → N selected + qtys restored  
- Optional `@functional` smoke if an orders return journey already opens the sheet  

## Sign-off

Product chat: Approach **A** approved 2026-09-07.
