# Feature Completeness Review — Confirm without a rate

**Date:** 2026-10-21  
**Module / ask:** Seller may Confirm even when a ticked line has no billing amount (rate empty). Qty still required.  
**Anchors:** `docs/features/orders.md`, `2026-10-08-confirm-lines-qty-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Locking supply (tick + qty) is the Confirm job. Rate is nice when they have it; missing bill is already a ticket state (empty Price / Bill, no Total ₹). Do not force Send quote just to lock. |
| UX Designer | Confirm enabled when ≥1 tick and every ticked line has qty ≥ 1. Empty Rate stays empty. Ticket already hides ₹ when any counted line is unbillable. |
| Solution Architect | Drop `RATE_REQUIRED` on `decideLines`. DTO rate already optional. Payload omits rate when blank. Invalid positive-only rate still rejected if they type 0. |

---

## Platform consistency (required)

1. **Existing patterns?** Ticket Total hides ₹ without a rate; How many Place works without a rate.  
2. **Duplicates another feature?** No — Send quote still the path to put rates in chat.  
3. **Should reuse an existing workflow?** Same Confirm sheet / `decideLines`.  
4. **Naming matches the app?** Confirm; Rate optional.

**Philosophy conflict?** No — Confirm locks supply; money when they have it.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Confirm with mixed billed / unbilled lines |
| Business rules | OK | Qty ≥ 1; existing rate kept if they don’t type a new one |
| Workflows | OK | Send quote still requires a rate per supplyable line |
| Edge cases | OK | All ticked, all blank rates → Confirmed, empty Bill/Total ₹ |
| Permissions | OK | Seller only (unchanged) |
| User states | OK | Inquiry still firms on confirm |
| Notifications | OK | Same lines-decided chat card |
| Error handling | OK | No RATE_REQUIRED toast |
| Scalability | N/A | |
| Mobile interactions | OK | CTA fills when qty is there |
| First glance (BM-11) | OK | Confirm is the job; empty Rate is quiet |
| Accessibility | OK | Confirm aria-label unchanged |
| Platform consistency | OK | Quote still needs rates |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Confirm CTA: qty on every ticked line; rate not required.  
- API `decideLines`: confirm with null rate; keep a typed rate when present.  
- Send quote still requires rate.  
- Docs + units.

## Explicitly deferred / rejected

- Allowing Send quote without a rate.  
- Inventing a “bill later” status.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units (API + web). Existing Confirm journey still covers the CTA.
