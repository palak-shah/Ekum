# Feature Completeness Review — Dispatch complete vs Settle mismatch

**Date:** 2026-09-07  
**Module / ask:** Full dispatch = order complete (`dispatched`). `settled` only when qty mismatched and seller **Settle**s; that is also complete. Settled shows on Timeline for that settle path only — not auto on full ship.  
**Anchors:** `docs/features/orders.md`, `docs/superpowers/specs/2026-09-06-settle-order-and-order-trail-design.md`  
**Disposition:** Redesign → Proceed (amend end-state model)

> Amends 2026-09-06 settle design: full ship no longer jumps to `settled`.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders say “dispatched” when the lot is done. Settle is the exception for short ship. |
| UX Designer | Status pill Dispatched = done; Settled only after Settle. Both under Completed. |
| Solution Architect | Full dispatch → `dispatched` + return window; no Settled trail/event. Settle path unchanged → `settled`. |

---

## Platform consistency (required)

1. **Existing patterns?** Same CTAs; Settle stays part-ship only.  
2. **Duplicates?** No.  
3. **Reuse?** Yes — existing statuses, clearer meaning.  
4. **Naming?** Dispatched / Settled plain language.

**Philosophy conflict?** Yes with prior “full ship → settled” — **Redesign** that rule; keep Settle for mismatch.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Flip full-dispatch status |
| Business rules | OK | Completed = dispatched \| settled \| delivered |
| Workflows | OK | Mark delivered stays legacy-only / hidden for new complete |
| Edge cases | OK | Part ship still confirmed until Settle or more dispatch |
| Permissions | OK | |
| User states | OK | Attention Completed includes dispatched |
| Notifications | OK | Chat “dispatched · complete” |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | N/A | |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Approved scope

- Full remaining=0 dispatch → status **`dispatched`** (return window, trail Dispatched only, chat complete — **no** Settled trail/status).
- Seller **Settle order** only while part-shipped → **`settled`** + Settled timeline (unchanged).
- Lists/filters **Completed** = `dispatched` | `settled` | `delivered` (+ terminal decline/cancel as today).
- Returns allowed after `dispatched` or `settled`.
- Docs amend settle design + `orders.md`.

## Explicitly deferred

- Migrating historical tickets that were settled on full ship
- Parent auto-complete when last mill hop dispatches (I-handle)

## Sign-off

Proceed on amended end states.
