# Remove Profile “When buyers order…” — design

**Date:** 2026-09-08  
**Status:** Approved (conversation)  
**Anchors:** [settings.md](../../features/settings.md), [orders.md](../../features/orders.md), [TradeLane](./2026-09-02-tradelane-design.md), Your paths Completeness  
**Completeness:** `docs/superpowers/reviews/completeness/2026-09-08-remove-profile-order-path-completeness.md`

## Problem

Profile **When buyers order from what I share** looks like a master Direct / I handle switch, but new TradeLane pairs always start **Me + no group**. The control lies and splits path IA from **Your paths**.

## Product promise

1. **Remove** that Profile control (and its “default for every forward…” copy).  
2. Keep buy / sell / trade toggles on Profile.  
3. **Your paths** remains the only path UI (Me / mill · See each other per mill · buyer).  
4. **New pair** stays **Me + See each other Off** — no company-wide default.  
5. Existing lanes unchanged.  
6. `tradeDefaults.orderPathPreference` may remain in settings API for residual readers; Profile stops writing it. Residual resolvers prefer **handle** when unset.

## Out of scope

- Your paths top “New buyers” default line (option C — rejected for now).  
**Out of scope (remove-profile design):** Column drop for `Collection.orderPathPreference` — see purge-collection-order-path (writes/reads stopped; column remains).  
- Changing live place / send path resolution beyond Prefer handle when unset.

## Tests

- Profile no longer shows When buyers order.  
- Your paths + new pair Me unchanged (existing e2e).  
- Unit: unset `orderPathPreference` ⇒ handle where resolver is updated.
