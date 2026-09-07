# Design — I-handle parent ticket: no upstream names (Approach A)

**Date:** 2026-09-07  
**Status:** Approved (Approach A)

## Problem

Mill confirm/dispatch pass-through wrote `{mill shop} confirmed/dispatched` onto the **buyer↔trader** order trail and chat. End buyers (e.g. Meena) saw upstream shops (e.g. Ahmedabad Loom). That breaks soft-hide / “Meena sees trader only” and is catastrophic when chains continue (Meena may herself be a trader to the next hop).

## Rule

On every **Manage** parent ticket (and its trade chat):

- **Never** store or return upstream supplier/mill **names** (or other upstream identity) in trail `summary`/`detail`, chat body, or `actorLabel`.
- Upstream identity lives only on **subset tickets** and **trader-only** mill desks (already gated).
- Applies at **every hop** in the chain — not a special Meena/Ravi case.

## Approach A (chosen)

1. **Write** pass-through events with buyer-safe copy only (`Confirmed` / `Part shipped` / `Dispatched` + design counts / LR). Actor company on parent trail = **parent seller** (trader at that hop), never the mill.
2. **Do not** put mill names in parent trail payload for dual view.
3. **Read scrub** for end buyer (and any viewer who is not the parent seller): rewrite legacy rows whose summary/detail contains known upstream shop names; drop/replace `actorLabel` mill names on living cards.
4. Trader context remains on **mill cards + mill tickets**.

## Non-goals

- TradeLane reveal On (group) — separate.
- Renaming mills in mill-ticket trails (those parties already know each other).
