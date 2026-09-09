# Unified main + linked lots — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or implement task-by-task.

**Goal:** Curated pack Place always creates one main + linked lots; buyer sees mill cards when TradeLane ticket is mill (transparent).

**Architecture:** Keep `createFromPack` / Manage parent. Web stops routing Direct-stamped packs to batch. API `buildMillDesks` returns buyer-visible desks for `ticket=mill` lanes; OrderDetail read-only cards for buyer.

**Tech Stack:** NestJS, Prisma, React, Vitest

## Global Constraints

- Trader still Send quote on main; mills quote trader on lots.  
- Default Private = ticket me → buyer no mill desks.  
- No buyer Send / Hold / Reveal.

---

### Task 1: Pack Place always from-pack

**Files:** `apps/web/src/features/browse/packOrderSource.ts`, `packOrderSource.spec.ts`

- [ ] Change `collectionIdForPackOrder` to return pack id whenever `singleSourceCollectionId` is set (do not skip `sourcePath === 'direct'`).
- [ ] Update unit: Direct-stamped lines still return pack id.
- [ ] Keep `NOT_CURATED` fallback; `DIRECT_PACK` can remain harmless.

### Task 2: API buyer mill desks when transparent

**Files:** `order.service.ts`, new or extend `trade-lane.spec` / order unit if practical

- [ ] `buildMillDesks`: allow actor = buyer on Manage parent; filter desks to lanes with `ticket === 'mill'` (or enum Mill).
- [ ] Soft-hide `upstreamNamesToHide`: exclude seller names present on buyer-visible millDesks.
- [ ] Trader path unchanged (all non-cancelled ups).

### Task 3: Buyer read-only mill UI

**Files:** `OrderDetailPage.tsx`, optionally `iHandleDesk.ts` helper `isBuyerMillDeskView`

- [ ] When `isBuyer` and millDesks length: render cards without Send, qty/rate edit, Hold, Reveal.
- [ ] Show shop name, subset # when released, status, design count; optional From rates if millQuoted.

### Task 4: Docs + gap matrix

- [ ] `orders.md` Dual trade: curated Place always main+lots; transparent = buyer sees mills.  
- [ ] Update redesign status / proceed pointer.  
- [ ] Gap matrix: Works Partial / Unit for this slice.

### Task 5: Verify

- [ ] `pnpm --filter @ekum/web exec vitest run packOrderSource.spec.ts`  
- [ ] API unit for buildMillDesks if extracted; else smoke via existing from-pack + manual note.
