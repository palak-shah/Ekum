# I-handle trader desk (simple)

**Date:** 2026-09-07  
**Status:** Approved for implementation  
**Anchors:** `docs/features/orders.md`, TradeLane I handle + reveal Off  
**Mock:** [2026-09-07-trader-desk-simple-mock.html](./2026-09-07-trader-desk-simple-mock.html)  
**Completeness:** [2026-09-07-trader-i-handle-desk-completeness.md](../reviews/completeness/2026-09-07-trader-i-handle-desk-completeness.md)  
**TradeLane:** This desk **is** reveal Off (two 1:1s). Reveal On (trio) is [TradeLane](./2026-09-02-tradelane-design.md) + Completeness 2026-09-07-tradelane-reveal-on — same Me ticket, different chat.  
**Supersedes (trader chrome):** Linked portal mock [2026-09-07-trader-linked-order-mock.html](./2026-09-07-trader-linked-order-mock.html) — not the desk

## Problem

Multi-supplier I handle already creates one buyer ticket + one mill hop per owner. The trader’s Orders list shows every hop as a peer row. They lose the trip.

## Decision

**One desk:** buyer ticket `#A1B2C3` (Meena). Mill hops are **subsets**. After Send, the mill # sits beside the shop name. Surat chat uses that #; tap opens `#A1B2C3`. No Linked portal. No Coming/Going on the glass.

Meena sees only `#A1B2C3` — **no Related orders box**. Mills see only their subset after Send — **no Related** link to the buyer ticket.

## Desk

| Surface | Trader sees |
|---------|-------------|
| Orders list (incl. Find) | **Only** `#A1B2C3`. Role **Trading** (not You sell). Mill shop names after the # (`Surat + Jaipur`). Filter **Type → Trading** (or Find `trading` / `linked`). Find by mill name or mill `#` still opens this row — never a mill subset row. |
| `#A1B2C3` | Lines **grouped by mill**. Qty + rate with column headers **Qty** / **Rate** before Send. **Send to {shop}** until sent. Then shop + `#D4E5F6` + **Sent**. Page face: **Send quote** only after a mill has quoted (pass rates to Meena). Quoting without asking the mill sits under **Take over** with Open chat · Decline · Ask for payment · Dispatch · Settle · View. **No** Confirm. After mill quotes: **From {shop}** / **To {buyer}** rates. Send quote prefills from mill. After Meena accepts, mill ticket gets Dispatch / Ask for payment; trader still only via Take over. Not Direct-path Take over. |
| Needs you | Lights **Meena’s** row (e.g. Surat quoted). Detail cue: **Send to {mill}** → wait for mill rates → **Send quote to Meena** — not bilateral “quote, confirm lines, or decline”. Status stays **Requested** until Meena accepts. |
| Timeline | Whole trip, tagged Meena / Surat / Jaipur. |

## From / To rates (trader only)

When a mill has quoted, the desk shows a **header once** — **From {mill}** | **To {buyer}** — then **only rates** on each design line (no repeated sentences). Send quote sheet uses the same column idea: From rate · your offer fields. Prefill from mill rates. Mill and buyer never see this pair.


## Chat

**Desk default = reveal Off:** 1:1 Meena, 1:1 each mill after Send.

**Reveal On** (per mill × buyer lane): same desk / ticket with Me; after Send, living cards in the **trio** are the **mill subset** only (`Part of #{main}`), not the Manage parent ticket. One group per mill (never mill A + mill B together). Switch on each mill card: **{Mill} and {Buyer} can see each other**. Flip Off stops new cards to the group; group stays. Mill joins the trio only after **Send**.

Trader mill order card: `{shop} lot · #{subset} · part of #{main}`. Tap → `#A1B2C3` (scroll to that mill). Mill viewer still opens the subset ticket.

## Pass-through (after Send)

| Event | Default |
|-------|---------|
| Mill **quote** | **Held** until trader **Send quote to Meena** |
| Meena **accepts quote** | Parent confirmed; released mill hops with rates become **confirmed** so the mill can dispatch |
| Mill confirm / dispatch | → Meena ticket + her chat living card |
| Meena qty edit | → that mill subset |
| Mill can’t supply a line | Surat card cue (`1 confirmed · 1 can’t supply`). Meena lines **do not** shrink until trader quotes / declines her |

## Hold (dispute) — rare

Once-in-years. **Never** a banner, pill, or page button.

After Send, mill card has the same quiet **⋯** as other order chrome. Last items: **Hold {shop}** / **Resume {shop}**. No Hold on the card face.

If held: muted one word under the shop name (`Held`) — **trader only**. Resume only in **⋯**. Timeline can log it on `#A1B2C3` for the trader. Do not cue Needs you for Hold.

**Meena and the mill do not see Hold.** No chat line, no status on their tickets, no notification. They still talk to the trader as usual. The trader tells them in chat if they should know. Pass simply stops until Resume.

Stops pass on **that** subset only. Take over = existing quote / decline / cancel while held. Not Direct-path **Take over**.

Whole-order freeze: **Later**.

## Settle (this slice)

Subsets **dispatch** on their own tickets (mill is seller) — full ship → **`dispatched`** (complete). **Settle** only when qty mismatched. When a mill **Settles**, matching lines on `#A1B2C3` rewrite to shipped qty.

**Parent closes only when every released mill subset is done** (`settled` / `dispatched` / …):
- **One supplier** (e.g. Ahmedabad Loom `#3G9F` only) → that Settle → `#VDXX` **Settled** (Completed). Surat does **not** Settle.
- **Two+ suppliers** and only one Settles → matching lines on `#VDXX` / Meena rewrite to shipped qty; other lines stay open. Status stays **Part shipped** until the remaining subsets finish. Surat still does **not** Settle mill-driven lots — no “Your move” on the parent for those.
- Stuck parents (mill Settled earlier) heal to Settled on order open / list.

Trader **Settle order** on the Manage parent is only for bilateral-style fulfillment (no mill desks). Mill desks close the parent by pass-through.

## Out of scope

- Linked / Coming / Going chrome  
- Mill page as trader home  
- Your paths / ticket=`mill` (Direct counterpart)  
- Whole-order Hold  
- Inventory  
- Soft-hide: end buyer must not see *other* hop mill names as Related chrome (trio parties use business names in the group)  
- Upstream mill names on the **parent** Timeline or trade chat when reveal Off (chain soft-hide — Approach A)  
