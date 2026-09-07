# Settle order + order trail — Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Seller can Settle part-shipped orders (qty = shipped → `settled`); full dispatch completes to `settled`; Order detail Timeline reads append-only `OrderTrailEvent`.

**Architecture:** Write trail events on lifecycle actions; expose `trail` on order detail; settle endpoint rewrites line qty to shipped totals; dispatch with remaining 0 sets `settled` (not `dispatched`/`delivered`).

**Tech Stack:** Prisma, NestJS orders module, `@ekum/domain-types`, React OrderDetailPage.

**Spec:** `docs/superpowers/specs/2026-09-06-settle-order-and-order-trail-design.md`

## Global Constraints

- Seller-only Settle; qty := shipped; `requestedQuantity` preserved  
- Status `settled`; lists treat `settled` + legacy `delivered` as completed  
- Who on trail: staff for own company, business name for counterpart  
- Living chat card + notify on settle / full complete  
- No buyer Mark delivered for new path  

## Tasks

### Task 1: Domain types
- [x] Add `OrderStatus.Settled`, filter aliases, `OrderChatEvent.OrderSettled`
- [x] `OrderTrailEventType` + view types; `settleOrderSchema` (optional note)
- [x] Unit: enum values / settle schema

### Task 2: Prisma + migration
- [x] `OrderTrailEvent` model; `Order.settledAt` (optional, for returns window)
- [x] SQL migration; backfill script/helper from existing timestamps

### Task 3: API trail + settle + dispatch complete
- [x] `OrderTrailService.append` + synthesize on get if empty
- [x] Emit trail on create/quote/confirm/amend/dispatch/settle/cancel/decline
- [x] `POST /orders/:id/settle`; dispatch → settled when remaining 0
- [x] Hide/block deliver for non-legacy; tests

### Task 4: Web
- [x] Timeline from `order.trail`
- [x] Part shipped: Settle order sheet + Dispatch more
- [x] Hide Mark delivered when status is settled or new path
- [x] Filters/attention: settled = completed
- [x] Units + smoke where needed

### Task 5: Docs
- [x] `orders.md`, gap matrix, mark spec Approved
