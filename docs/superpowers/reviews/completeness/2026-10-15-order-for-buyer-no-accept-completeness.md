# Feature Completeness Review — Order for buyer: no Accept

**Date:** 2026-10-15  
**Module / ask:** Seller-logged own-catalog tickets auto-confirm; no buyer Accept. Buyer Decline only. Mill hops: placed; buyer and seller Decline; mill Confirm unchanged.  
**Anchors:** `docs/features/orders.md`, `docs/features/chat.md`, Completeness `2026-09-29-order-for-buyer-mill-seller`  
**Disposition:** Proceed  

> Intentional redesign of the prior buyer-Accept model for seller-logged tickets.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Phone-agreed log should not force a second Accept. Buyer who does not want it Declines. Mill hops stay placer-placed; both parties may Decline. |
| UX Designer | Remove chat/dock Accept on logged tickets. Quiet View order. Buyer Decline on dock (and invite). Accept quote stays. |
| Solution Architect | Own-catalog create → `confirmed` + confirmed lines. `canAcceptLogged` false everywhere. Invite `used` = `usedAt` only. Invite “accept” opens ticket only. |

---

## Platform consistency (required)

1. **Existing patterns?** Order dock Decline/Cancel; mill Confirm after Send; living chat card.  
2. **Duplicates another feature?** No — removes Accept-logged; Accept quote unchanged.  
3. **Should reuse an existing workflow?** Yes — buyer `cancel`, seller `decline`.  
4. **Naming matches the app?** Decline (not Reject); no Seller/Buyer on chat body.

**Philosophy conflict?** No — fewer taps for an already-agreed ticket.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Auto-confirm own; no Accept CTA |
| Business rules | OK | Logger no Confirm; mill Confirm after Send |
| Workflows | OK | Invite View + Decline |
| Edge cases | OK | Invite not “used” solely because confirmed |
| Permissions | OK | Buyer cancel; seller decline |
| User states | OK | Confirmed → Dispatch for logger |
| Notifications | OK | Existing orderCreated / status |
| Error handling | OK | Legacy `/accept` clear error |
| Scalability | N/A | |
| Mobile interactions | OK | Dock chrome unchanged height |
| First glance (BM-11) | OK | No loud Accept on logged card |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Own-catalog Order for buyer → auto-confirm; no Accept; buyer Decline (cancel).  
- `canAcceptLogged` false (API + chat resolver).  
- Off-app invite: View order + Decline; usedAt-only.  
- Docs + unit tests.

## Explicitly deferred / rejected

- Auto-confirm mill Manage/Direct parents.  
- Accept quote changes.  
- Chat-card Decline is in: buyer’s newest order card when someone else logged the ticket (requested or confirmed). Supplier Confirm stays on View order.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
