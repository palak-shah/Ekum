# Feature Completeness Review — Cheap Orders Needs you count

**Date:** 2026-10-04  
**Module / ask:** `GET /orders/needs-you-count` must not walk the full order list graph every 30s from AppShell.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Badge count semantics stay identical to the Orders **Needs you** filter; only the query path changes.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Bottom-nav Orders badge must match Needs you rows. Traders feel API lag on every tab while the heavy count runs. |
| UX Designer | No UI change — same badge number, quieter backend. |
| Solution Architect | Stop paging `list()` with full `ORDER_RELATIONS` over all history. Load only open-status party orders once, enrich like list, then `matchesOrderNeedsYou`. Chat unread N+1 deferred. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — same `matchesOrderNeedsYou` + samples count add in controller.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Reuse Needs you predicate; do not invent a second badge rule.  
4. **Naming matches the app?** Needs you (existing).

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same count semantics |
| Business rules | OK | Open statuses only; terminal orders never Needs you |
| Workflows | OK | Badge poll unchanged client-side except visibility pause |
| Edge cases | OK | Cap + still correct for normal desks |
| Permissions | OK | Party filter unchanged |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | Gap→fix | Unbounded list walk |
| Mobile interactions | N/A | |
| First glance (BM-11) | OK | Faster shell |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Full list walk for badge

| Field | Content |
|-------|---------|
| Gap | `needsYouCount` pages `list(limit:100)` until exhausted with full order graphs |
| Why it matters | AppShell polls every 30s on every screen |
| Impact if ignored | Whole app feels slow under seed / real desks |
| Recommendation | Open-status findMany + existing enrichment + `matchesOrderNeedsYou` |
| Priority | Required before implementation |

### G-002 — Chat unread N+1

| Field | Content |
|-------|---------|
| Gap | `/threads/unread-count` counts per thread |
| Why it matters | Secondary shell poll |
| Impact if ignored | Still some chatter |
| Recommendation | Deferred — grouped SQL later |
| Priority | Future improvement |

---

## Approved scope for this slice

- Rewrite `OrderService.needsYouCount` without full historical `list()` walk
- Keep controller sum with samples `needsYouCount`
- Unit coverage that count path does not call `list`

## Explicitly deferred / rejected

- Chat unread aggregation rewrite
- WebSocket badge push

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
