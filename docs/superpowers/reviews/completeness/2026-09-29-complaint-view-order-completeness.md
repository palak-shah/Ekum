# Feature Completeness Review — Complaint card View order

**Date:** 2026-09-29  
**Module / ask:** Complaint card must not offer View designs. If an order is attached, **View order →**.  
**Anchors:** `docs/features/chat.md`, `docs/features/orders.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The attached unit is the ticket, not a design set. Photos stay on the card; open the order to trade. |
| UX Designer | Same **View order →** as payment / order cards. Tap thumbs still PhotoViewer. No designs set page. |
| Solution Architect | `orderId` on complaint reference + message snapshot. Thread `onOpenOrder(orderId)`. Drop complaint from `designsPath`. |

## Platform consistency

1. **Existing patterns?** Yes — View order on order/payment cards.  
2. **Duplicates?** No — removes the wrong CTA.  
3. **Reuse?** `onOpenOrder`.  
4. **Naming?** View order.

**Philosophy conflict?** No.

## Checklist

OK / N/A. No extra chrome. No order attached → no CTA.

## Approved scope

- Never **View designs** on a complaint.  
- Attached order → **View order →**.

## Sign-off

Required gaps closed: Yes  
Ready: Yes  
