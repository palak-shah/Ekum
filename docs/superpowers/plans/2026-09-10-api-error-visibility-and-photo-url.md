# API error visibility + Photo Order URL — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Absolute media URLs for Photo Order, trader-friendly validation copy, and structured client console logs for API failures.

**Architecture:** Harden local media `PUBLIC_MEDIA_BASE_URL` at the storage/config boundary; keep Zod custom messages + existing validation pipe; add a small `logApiFailure` helper in the web `apiClient` that prints one structured object and skips auth-refresh 401 noise.

**Tech Stack:** NestJS API, Zod/`@ekum/domain-types`, Vite React web, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-10-api-error-visibility-and-photo-url-design.md`

## Global Constraints

- Traders see friendly `message` only (no Zod jargon in toasts).
- Do not change `ErrorEnvelope` shape.
- No Sentry / toast Details panel in this slice.
- Commit only if the user asks.

---

## File map

| File | Responsibility |
|------|----------------|
| `apps/api/src/media/storage/public-media-base.ts` (new) | Validate/normalize absolute media base URL |
| `apps/api/src/media/storage/storage.provider.ts` | Use helper when constructing LocalStorageDriver |
| `apps/api/src/media/storage/public-media-base.spec.ts` (new) | Unit tests for absolute URL rule |
| `packages/domain-types/src/orders.ts` | Custom message for invalid photo image URLs |
| `apps/api/src/common/pipes/zod-validation.pipe.ts` | Already friendly (Part C) — verify |
| `apps/web/src/lib/apiErrorLog.ts` (new) | Build + log structured API failure |
| `apps/web/src/lib/apiErrorLog.spec.ts` (new) | Unit tests for log payload / 401 skip |
| `apps/web/src/lib/apiClient.ts` | Call logger; keep friendly message remap |
| `docs/docker.md` or beta note | One-line ops reminder for `PUBLIC_MEDIA_BASE_URL` if missing |

---

### Task 1: Absolute `PUBLIC_MEDIA_BASE_URL` helper (API)

**Files:**
- Create: `apps/api/src/media/storage/public-media-base.ts`
- Create: `apps/api/src/media/storage/public-media-base.spec.ts`
- Modify: `apps/api/src/media/storage/storage.provider.ts`

- [x] **Step 1: Failing tests** — assert `assertPublicMediaBaseUrl('https://beta.ekum.app/media')` returns trimmed base without trailing slash issues; assert `/media` and `''` throw with a clear ops message.
- [x] **Step 2: Implement** `assertPublicMediaBaseUrl(raw: string): string` — require `http:`/`https:` absolute URL via `new URL(...)`; strip trailing `/`.
- [x] **Step 3: Wire** `storage.provider.ts` LocalStorageDriver path through the helper (boot fails loud if misconfigured).
- [x] **Step 4: Run** `pnpm --filter @ekum/api exec vitest run src/media/storage/public-media-base.spec.ts`

### Task 2: Trader copy for invalid image URL

**Files:**
- Modify: `packages/domain-types/src/orders.ts`
- Optionally add/adjust a small domain or pipe test

- [x] **Step 1:** Change `images: z.array(z.string().url())` to use custom error map / `.url({ message: 'Photo isn’t ready yet. Remove it and add it again.' })` (Zod 3 API as used in repo).
- [x] **Step 2:** Confirm `userFacingValidationMessage` will surface this sentence (length ≥ 12, not Required/Expected).
- [x] **Step 3:** Run existing `zod-validation.pipe.spec.ts` + any orders schema test if present.

### Task 3: Structured client API error log

**Files:**
- Create: `apps/web/src/lib/apiErrorLog.ts`
- Create: `apps/web/src/lib/apiErrorLog.spec.ts`
- Modify: `apps/web/src/lib/apiClient.ts`

- [x] **Step 1: Failing tests** — `buildApiErrorLog({...})` shape; `shouldLogApiError({ statusCode: 401, willRetry: true })` → false; other 400 → true.
- [x] **Step 2: Implement** helper + `logApiError` calling `console.error`.
- [x] **Step 3: Wire** `apiClient` `parseError` / `execute` so every surfaced failure logs once; skip the 401 that triggers refresh retry (log only if refresh fails / final error).
- [x] **Step 4: Run** `pnpm --filter @ekum/web exec vitest run src/lib/apiErrorLog.spec.ts`

### Task 4: Part C verify + docs status

- [x] Confirm validation pipe + apiClient opaque remap still present.
- [x] Mark design spec **Status: Approved**.
- [x] Add a one-line beta ops note under the design Rollout or `docs/docker.md` that beta must use `PUBLIC_MEDIA_BASE_URL=https://beta.ekum.app/media`.

### Task 5: Verification

- [x] `pnpm --filter @ekum/api exec vitest run src/media/storage/public-media-base.spec.ts src/common/pipes/zod-validation.pipe.spec.ts`
- [x] `pnpm --filter @ekum/web exec vitest run src/lib/apiErrorLog.spec.ts`
- [x] Report: code ready; beta still needs env check + deploy (user-run).
