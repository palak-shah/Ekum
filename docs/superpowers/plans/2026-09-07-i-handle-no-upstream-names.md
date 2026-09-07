# Plan — I-handle no upstream names on parent ticket

**Date:** 2026-09-07  
**Spec:** `docs/superpowers/specs/2026-09-07-i-handle-no-upstream-names-design.md`

## Files

| File | Role |
|------|------|
| `apps/api/src/orders/order.service.ts` | Buyer-safe pass-through trail/chat writes; actor = parent seller |
| `apps/api/src/orders/order-trail.service.ts` | Scrub summaries for end-buyer viewers |
| `apps/api/src/orders/i-handle-soft-hide.ts` (new) | Pure helpers: scrub text containing mill names; buyer-safe labels |
| Conversation message serialize / get | Scrub order_card body + actorLabel for Manage end buyer |
| Specs + `docs/features/orders.md` | Lock rule + tests |

## Tasks

1. **TDD helpers** — `scrubUpstreamNames(text, millNames)` / `buyerSafePassThroughSummary(type)`  
2. **Writes** — `passMillLinesToParent` / `passMillDispatchToParent`  
3. **Trail read** — pass upstream names into `listForViewer`; scrub when viewer is buyer  
4. **Chat read** — sanitize living cards for buyer  
5. **Docs**
