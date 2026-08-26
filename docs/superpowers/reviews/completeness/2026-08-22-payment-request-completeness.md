# Feature Completeness Review — Payment request on an order

**Date:** 2026-08-22  
**Module / ask:** Ask for payment from an order (honour system; no gateway)  
**Anchors:** `docs/features/orders.md`, `docs/features/chat.md`, TextileOS US-11-03 (cut down)  
**Disposition:** Proceed

> One ask on a ticket. Not invoices, aging, or commission.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | After the goods are agreed, the seller needs a formal “please pay ₹X” that does not get lost in chat. |
| UX Designer | Order detail CTA **Ask for payment** + kit sheet. Living card in the trade thread. Buyer **Paid** / seller **Mark received**. No Seller/Buyer on the card body. |
| Solution Architect | `PaymentRequest` on the order. One `open` at a time. Reuse trade thread + order notify type. |

---

## Platform consistency (required)

1. **Existing patterns?** Order detail CTAs, kit Sheet + footer button, living order cards.  
2. **Duplicates?** No — quotes are rates, not money asked.  
3. **Reuse?** Same thread as the order; same honour verbs as deliver.  
4. **Naming?** **Ask for payment** · **Paid** · **Mark received**. Not invoice / UPI collect / settlement.

**Philosophy conflict?** No — opt-in ask, no payment processor.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Create / seen / paid / received |
| Business rules | OK | Seller asks; buyer or seller can close as paid |
| Workflows | OK | After confirmed (or later) |
| Edge cases | OK | One open; amount required |
| Permissions | OK | Parties of the order only |
| User states | OK | Open vs paid |
| Notifications | OK | `order` type to the other party |
| Error handling | OK | Sheet + toast |
| Scalability | OK | Per-order rows |
| Mobile interactions | OK | Sheet footer; detail CTAs above nav |
| Accessibility | OK | Button names |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Gateway / GST invoice

| Field | Content |
|-------|---------|
| Gap | No UPI QR product, PDF, or GST bill |
| Recommendation | Out — text instructions only |
| Priority | Future improvement |

### G-002 — Commission markup

| Field | Content |
|-------|---------|
| Gap | Direct 5% was going to reuse this |
| Recommendation | Out — commission Later |
| Priority | Future improvement |

---

## Approved scope

- Seller **Ask for payment** on confirmed / dispatched / delivered tickets.
- Amount, optional note, optional pay-how text.
- Living `payment_card` in the trade thread.
- Buyer **Paid**; seller **Mark received**; optional **Seen**.
- Order detail lists asks.

## Explicitly deferred / rejected

- Payment gateway, GST invoice, multi-bill aging, commission %  
- Facilitator asking on a Direct ticket they do not sell  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
