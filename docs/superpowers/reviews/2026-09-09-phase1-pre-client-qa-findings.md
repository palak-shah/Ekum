# Phase 1 pre-client QA — findings

**Date:** 2026-09-09  
**Playbook:** `docs/superpowers/specs/2026-09-09-phase1-pre-client-qa-design.md`

## Gate 0 — Green machine

| Track | Result |
|-------|--------|
| API units | **479 passed** |
| Web units | **376 passed** |
| `@smoke` | **2 passed** |
| `@functional` | **53 passed** |

Fixed during Gate 0 (stale mocks/assertions vs product):
- API: TradeLane / collectionViewGrant / productRelistGrant / return.create include + OrderService stub
- Web: homeAttention `remainingQuantity`; CatalogShareSheet ApiError mock
- Earlier e2e: collections Selection path; fulfillment no Mark delivered

**Gate 0: PASS**

## Gate 0.5 — Error hygiene

| # | Action | Text / change | Class | Status |
|---|--------|----------------|-------|--------|
| 1 | Pack order fallback still treated `DIRECT_PACK` | Dead code — API no longer throws it | A (latent) | **Fixed** — fallback only `NOT_CURATED` |
| 2 | Surface walk Meena/Ravi/Kavita | No stray toasts/alerts on real routes | — | **Pass** (`phase1.chaos.noise.spec.ts`) |
| 3 | Abandon filter / New chat / select / Back | No stray noise | — | **Pass** (`phase1.chaos.deeper.spec.ts`) |
| 4 | Staff Amit surface walk | No stray noise | — | **Pass** |
| 5 | Guest share `/s/:token` landing | No crash toast; CTA present | — | **Pass** |

## Gate 1 — Persona chaos

| Pass | Result |
|------|--------|
| Naive open of core surfaces (buyer/seller/mill) | **Pass** |
| Deeper chaos (abandon sheets, Back mid-select, Clear) | **Pass** |
| Guest / share link / staff capped | **Pass** (share landing + Amit walk; uploads cap already in `team.cap.spec`) |

Automation cannot fully replace a human double-tapping every desk control — residual risk listed under Gate 3.

## Gate 2 — UX/UI bar (mobile Pixel 7)

| Check | Result |
|-------|--------|
| BM-07 album + selection floater (scroll main to end) | **Pass** — last design clears floater |
| Viewport | Playwright `devices['Pixel 7']` (all e2e) |

Residual UX (not automated blockers): copy tone, one-job judgment, TradeLane Mills Take-over chrome under real load — recommend a short human pass on live URL after deploy.

## Gate 3 — Ship decision

**Blockers found in this pass: 0**

### Ship URL: **GO**, with known limits

Safe to demo / share client URL after deploy, provided:

1. Deploy includes Gate 0 green build (units + smoke + functional).
2. Client note (short):
   - Seeded demo accounts (Meena / Ravi / Kavita) — not their real GST data.
   - Trading features need **Trading** on in settings where relevant.
   - Full dispatch closes as **Dispatched** (no buyer Mark delivered).
   - Staff caps (e.g. no uploads) are intentional.
3. Optional human 30‑min pass on the live URL: one Manage desk Send + Take over, one curated multi-supplier order, one share link on a phone.

### Automation added this pass

- `apps/e2e/tests/functional/phase1.chaos.noise.spec.ts`
- `apps/e2e/tests/functional/phase1.chaos.deeper.spec.ts`
- Dead `DIRECT_PACK` fallback removed from `packOrderSource.ts`
