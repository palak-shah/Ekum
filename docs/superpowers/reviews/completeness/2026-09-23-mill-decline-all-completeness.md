# Feature Completeness Review — Decline all waiting mills

**Date:** 2026-09-23  
**Module / ask:** **Send all** and **Decline all** as a pair above mill cards.  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Two+ waiting mills: send them all or drop them all. Per-card Send / Decline stay for one shop. |
| UX Designer | Same compact row as mill cards: **Send all** · **Decline all**. Confirm before Decline all. |
| Solution Architect | `POST mill-decline` without `upstreamOrderId` drops every held hop (same omit rule as send-up). Last remaining lines → parent declined. |

---

## Platform consistency (required)

1. **Existing patterns?** Mill card Send · Decline; Send all already on the desk.  
2. **Duplicates?** No — not the buyer-ticket Decline order.  
3. **Reuse?** mill-decline + confirm sheet.  
4. **Naming?** **Decline all**. After one shop Decline, the pair is the remaining waiting mills.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Pair when 2+ held |
| Business rules | OK | Only held / Requested hops |
| Workflows | OK | Confirm all; toast |
| Edge cases | OK | All remaining declined → parent declined |
| Permissions | OK | Trader Manage parent |
| User states | OK | Mills never got Send |
| Notifications | OK | No mill ping |
| Error handling | OK | Toast |
| Scalability | OK | Loop held hops |
| Mobile interactions | OK | Chip row, no extra sticky bar |
| Accessibility | OK | Confirm names “all waiting mills” |
| Platform consistency | OK | Beside Send all |

---

## Approved scope for this slice

- **Send all** and **Decline all** when 2+ mills are still waiting.  
- Confirm before Decline all.  
- Omit `upstreamOrderId` = every held hop.  
- Per-card Send / Decline unchanged.  

## Explicitly deferred / rejected

- Decline all when only one mill is waiting  
- Undo  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
