# Feature Completeness Review — Complaint Resolve UI

**Date:** 2026-10-09  
**Module / ask:** Open complaints need a Resolve control (API `POST /complaints/:id/resolve` already exists).  
**Anchors:** `docs/features/chat.md`, `docs/features/orders.md`, complaint.service  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Either party can close an open/responded complaint; rare action must stay easy from the living card. |
| UX Designer | **Resolve** on chat complaint card footer (with Send to supplier when shown). Order detail: quiet open-complaint rows + Resolve when this ticket is attached. |
| Solution Architect | Expose complaint `status` on MessageReference; call existing resolve endpoint; invalidate complaints + thread. |

---

## Platform consistency

1. **Existing patterns?** ChatTradeCard actionRow / secondaryAction; kit Button.  
2. **Duplicates?** No — API existed without UI.  
3. **Reuse?** ComplaintService.resolve.  
4. **Naming?** Resolve (matches status **Resolved**).

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Either party; already-resolved → conflict |
| Workflows | OK | Chat card + order detail when attached |
| Edge cases | OK | Hide Resolve when resolved |
| Permissions | OK | loadForParty |
| User states | OK | Open / responded |
| Notifications | N/A | |
| Error handling | OK | Toast on failure |
| Scalability | OK | |
| Mobile interactions | OK | Card footer |
| First glance (BM-11) | OK | Resolve quiet beside escalate |
| Accessibility | OK | Button labels |
| Platform consistency | OK | |

---

## Approved scope

- Complaint MessageReference includes `status`.  
- Chat complaint card: **Resolve** when open/responded.  
- Order detail: list open complaints for this order + **Resolve**.  
- Docs + unit tests.

## Explicitly deferred

- Respond UI on card (against party still uses existing respond API / future sheet).  
- Server filter `?orderId=` on list (client filter OK this slice).

## Sign-off

Required gaps closed: Yes  
Ready for implementation: Yes
