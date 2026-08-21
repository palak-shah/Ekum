# Forward → Direct attribution — design

**Date:** 2026-08-20  
**Status:** Implemented  
**Product path:** This is the **open path** (buyer↔supplier; forwarder **Shared**). UI copy: [2026-08-21-open-toll-trade-simplicity-design.md](./2026-08-21-open-toll-trade-simplicity-design.md).  
**Anchors:** [2026-08-20-trader-dual-trade-slice-b-design.md](./2026-08-20-trader-dual-trade-slice-b-design.md), [orders.md](../../features/orders.md)

## Problem

Slice B API supports Direct + facilitator, but chat Share / Forward never stamps `facilitatorCompanyId` on place, so the forwarder cannot see the order or get notifications.

## Goals

- Order from a **chat-forwarded** album/design → batch with `facilitatorCompanyId` → `tradeMode: direct`.
- Facilitator is **informed**: Orders list/detail + **notifications** on create and status changes.
- Take control unchanged when `canTakeControl`.

## Non-goals

- Auto-join facilitator to buyer↔supplier chat
- Attribution after cold Explore visit (no chat context)
- Managed-buyers / settings ladder

## Design

1. Chat card open → `/collections/:id?facilitator=<senderCompanyId>` (products likewise), only when sender ≠ viewer and ≠ catalog owner.
2. Collection / product Order flows pass `facilitatorCompanyId` into `useShortlistOrderFlow` / batch.
3. Curated pack (`collectionId` / from-pack) stays Manage.
4. Extend `OrderCreated` / `OrderStatusChanged` events with optional `facilitatorCompanyId`; notification listeners also notify that company (plain “Order you shared …” copy).

## Success

Live: share → order → facilitator GET order + notification row.
