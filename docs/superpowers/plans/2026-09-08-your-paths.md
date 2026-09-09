# Your paths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Your paths + ticket Me/mill (future from desk; live flip while Requested); place reads TradeLane; strip Publish path.

**Architecture:** Extend existing `TradeLane` row. Settings list/patch API. Server resolves path from lane (else handle for middle-hop). Web: `/settings/paths` under You; order ticket switch; remove Publish radios.

**Tech stack:** Nest + Prisma, React Router, kit Sheet/ListSearchRow, Vitest + Playwright `@functional`.

**Completeness:** [2026-09-08-your-paths-completeness.md](../reviews/completeness/2026-09-08-your-paths-completeness.md) — Proceed.

---

## File map

| File | Responsibility |
|------|----------------|
| `packages/domain-types/src/orders.ts` (or settings) | TradeLane view + list/patch DTOs |
| `apps/api/src/orders/trade-lane.service.ts` (or settings) | list/patch for trader |
| `apps/api/src/orders/order.service.ts` | upsert ticket; place resolve; live ticket flip |
| `apps/web/src/features/settings/YourPathsPage.tsx` | UI |
| `apps/web/src/features/settings/MorePage.tsx` | Link |
| `apps/web/src/app/router.tsx` | Route |
| `PublishAudienceFields.tsx` | Remove path radios |
| Docs: settings.md, orders.md, tradelane, gap matrix | Lock shipped |

---

### Task 1: Domain + API TradeLane list/patch

- [ ] DTOs + `GET` list + `PATCH` ticket/reveal (trading only; future-only)
- [ ] `upsertTradeLane` accepts `ticket`
- [ ] Units: patch ticket; list empty

### Task 2: Place resolves lane

- [ ] create / from-pack / batch middle-hop: lane ticket → Manage/Direct; no lane → handle
- [ ] Units for resolve helper

### Task 3: Live ticket flip

- [ ] POST order ticket flip; Manage↔Direct under Take-over gate; single mill
- [ ] Order view exposes `canFlipTicket` + current ticket for pair

### Task 4: Web Your paths + order + Publish

- [ ] Page + More link + route
- [ ] Order “This order is with” when canFlipTicket
- [ ] Strip Publish path; share sheet if cheap
- [ ] `@functional` + docs

---

## Verify

- Units: lane patch; place resolve; ticket flip gate  
- `@functional`: hop creates lane → Your paths edit ticket/reveal → next order follows  
- Regression: reveal Off desk; Publish has no path radios  
