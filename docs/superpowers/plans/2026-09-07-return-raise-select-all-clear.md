# Raise return Select all / Clear — Implementation Plan

> **For agentic workers:** Execute task-by-task with TDD.

**Goal:** Sheet-local Select all / Clear on Raise a return (Approach A).

**Tech:** React OrderDetailPage + pure helper + Vitest + `orders.md`

## Task 1: Pure helpers + unit tests

**Files:** `apps/web/src/features/orders/returnRaiseSelect.ts`, `returnRaiseSelect.spec.ts`

- `selectAllReturnLines(items)` → selected map all true + qty = ordered
- `clearReturnLines(items)` → selected map all false (keep qty map unchanged caller-side)
- `allReturnLinesSelected(items, selected)` → boolean

## Task 2: Wire OrderDetailPage sheet chrome

**Files:** `OrderDetailPage.tsx`

- Count row: `{n} of {N} selected` + Select all / Clear
- Drop “leave all on…” hint
- Wire handlers; Select all disabled when all on

## Task 3: Docs + gap matrix

**Files:** `docs/features/orders.md`, `docs/superpowers/reviews/feature-gap-matrix.md`

## Verification

`pnpm --filter @ekum/web exec vitest run src/features/orders/returnRaiseSelect.spec.ts`
