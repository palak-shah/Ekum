# Feature Completeness Review — Direct Shared: seller CTAs only after Handle myself

**Date:** 2026-09-20  
**Module / ask:** On a **Shared** Direct ticket, the sharer must not see mill seller tools (Confirm / decline, Confirm all, Decline order, Send quote). Those belong to the design owner until the sharer taps **Handle myself** (take control) and becomes the seller on a Manage ticket.  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Direct = mill is the seller. Sharer watches / can take the hop. Confirming Meena while Ahmedabad still owns the ticket is the wrong job. |
| UX Designer | Shared screen: Open chat / Handle myself / View shop. After Handle myself: existing I-handle desk (mill Send; Confirm still off while mill lots sit on the desk). |
| Solution Architect | `direction === selling` is true for any non-buyer, including facilitator. Gate seller CTAs on `sellerCompanyId === actor`. |

---

## Platform consistency (required)

1. **Existing patterns?** Handle myself already `canTakeControl`. I-handle Confirm-off-with-mills stays.  
2. **Duplicates?** No.  
3. **Reuse?** Same Button stack.  
4. **Naming?** Handle myself unchanged.

**Philosophy conflict?** No — this *fixes* Direct vs I-handle.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Sharer ≠ seller → no confirm/quote/decline/dispatch |
| Business rules | OK | Mill on Direct still sells; after takeControl trader sells |
| Workflows | OK | Handle myself → Manage parent |
| Edge cases | OK | True mill viewer still sees seller tools |
| Permissions | OK | API takeControl unchanged |
| User states | OK | Requested + no mill quote |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Fewer stacked CTAs (BM-07) |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None required this slice.

---

## Approved scope

- Seller face/More-actions CTAs only when the viewer is `sellerCompanyId`.
- Docs: Shared Direct does not confirm; **Handle myself** first.

## Explicitly deferred

- Changing I-handle “Confirm off until mill Send”.
- Hiding Open chat on Shared (buyer↔mill thread).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
Date: 2026-09-20  
