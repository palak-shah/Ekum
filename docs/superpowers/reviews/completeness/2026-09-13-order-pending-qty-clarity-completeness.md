# Feature Completeness Review — Order pending qty clarity

**Date:** 2026-09-13  
**Module / ask:** After partial dispatch, rename “left” → “pending”, highlight remaining; Settle sheet shows Dispatched vs Pending clearly.  
**Anchors:** `docs/features/orders.md`, OrderDetailPage dispatch/settle  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders miss soft “left” after part ship. Pending must read loud; Settle must show what went out vs what won’t. |
| UX Designer | Accent + semibold pending nums; Settle two columns Dispatched \| Pending — scan like Chats/Explore, not muted prose. |
| Solution Architect | Copy/UI only on existing `shippedQuantity` / `remainingQuantity`; shared hint component. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — OrderDetail sheets, h-12 thumbs, StatusPill part shipped.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same Dispatch / Settle path.  
4. **Naming matches the app?** **pending** (plain trader word); no Seller/Buyer jargon on lines.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Labels + highlight only |
| Business rules | OK | Unchanged |
| Workflows | OK | |
| Edge cases | OK | pending 0 → no accent needed |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Sheet clearance unchanged |
| Accessibility | OK | Text contrast via accent |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope

- Rename left → pending on detail / dispatch / settle  
- Highlight pending when remaining &gt; 0  
- Settle: Dispatched \| Pending columns + clearer intro copy  
- Docs + unit + `@orders` e2e  

## Explicitly deferred

- API field renames  
- Chat card qty copy  

## Sign-off

Proceed — implement approved scope only.
