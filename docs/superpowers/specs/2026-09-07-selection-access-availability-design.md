# Selection availability = access only

**Date:** 2026-09-07  
**Status:** Shipped  
**Surface:** Your selection re-check; `GET /explore/products/:id`; open trade without Connection  
**Anchors:** [explore.md](../../features/explore.md), [orders.md](../../features/orders.md), selection workspace

## Problem

Selection marks some album-picked designs **No longer available** after logout or reopen even when access did not change. Root cause: availability used Explore product detail, which required a standalone market post (`postedToMarketAt`) / connection / chat share — not “still visible in an openable album.”

Inventory is not managed; only **access** may fade a row.

## Rule (locked)

**Accessible ⇒ orderable.** How the trader found the design (Explore feed vs inside a collection) does not change the rule.

Unavailable only when access is gone, e.g.:

- Archived / draft / hide → **Archived** / **Not published**
- Audience / live window / block / no remaining open path → **No longer available**

Selection surviving logout with unchanged access must stay available.

## Approach

Expand server **product access** (not client workarounds):

1. `GET /explore/products/:id` unlocks when Published and any of: owner, connection, market post + product audience, product chat share, **or member of a published live collection the viewer can open with products visible**.
2. Trade without Connection (`TradeAccess`) uses the same membership path — album members stay orderable when the pack is still open to the buyer.

## Out of scope

- Inventory / stock
- Own-business order rule (unchanged)
- Storing `sourceCollectionId` on Selection entries

## Verification

- API unit: product in Everyone album, no `postedToMarketAt` → productDetail OK; trade discoverable without Connection
- Selection continues to call explore product GET (no client rule fork)
