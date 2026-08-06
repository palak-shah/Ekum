# Home Needs You Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reshape Home into day-one → Aaj line → metric strip → action-only NEEDS YOU rows → Followed; remove the Home notification feed; add returns list for Review return.

**Architecture:** Client-composed attention from existing order/access/thread APIs plus new `GET /returns`. Granular verbs live in `orderAttention.ts` / `homeAttention.ts`. Notifications stay behind the shell bell only.

**Tech stack:** NestJS + Prisma, `@ekum/domain-types`, React Query Home page.

## File map

| File | Responsibility |
|------|----------------|
| `packages/domain-types/src/orders.ts` | `listReturnsQuerySchema`, `ReturnView.counterpart` |
| `apps/api/src/orders/return.service.ts` | `list()`, richer return includes |
| `apps/api/src/orders/return.controller.ts` | `GET /returns` before `:id` |
| `apps/api/src/orders/order.serializer.ts` | Serialize counterpart on returns |
| `apps/web/src/features/orders/orderAttention.ts` | Dispatch in `matchesNeeds`; seller rate vs confirm helpers |
| `apps/web/src/features/home/homeAttention.ts` | Build typed Needs rows + Aaj/metric counts |
| `apps/web/src/features/home/HomePage.tsx` | New layout; drop Addressed feed |

## Tasks

1. Domain + API returns list with counterpart
2. Attention helpers (orders + returns + request rows)
3. HomePage UI (Aaj, metrics, Needs rows, Followed; no notification feed)
4. Rebuild domain-types; smoke typecheck / unit tests for attention helpers

## Verification

- Seller `confirmed` appears as Dispatch on Home
- Seller `requested` without rates → Send rate; with rates → Confirm order
- Home has no “Addressed to you”
- Metric strip: Orders / Requests / Returns
- `GET /v1/returns` returns cursor page for party
