# Feature Completeness Review — Settle sheet Dispatch chrome

**Date:** 2026-10-21  
**Module / ask:** Match Dispatch product-row chrome on the existing Settle sheet. Keep a separate Settle button and sheet.  
**Anchors:** `docs/features/orders.md`, `2026-09-07-dispatch-complete-vs-settle-completeness`, `2026-10-21-dispatch-remainder-name-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same row scan as Dispatch (Ordered · Shipped · editor + −N/+N). Job stays “close leftover, no new LR.” Folding Settle into Dispatch would mix send vs write-off. |
| UX Designer | Separate sheet. No checkbox. Compact Final (0…shipped), not − n +. Remainder on the name. Grouped leftover in the sticky footer, not a pending card. |
| Solution Architect | Display preview only. Clamp / payload / `POST /orders/:id/settle` unchanged. Do not edit Dispatch files. |

---

## Platform consistency (required)

1. **Existing patterns?** `OrderLineStack` + `OrderLineFactStrip` editor 3-col + tangerine remainder; footer qty like Dispatch This LR.  
2. **Duplicates another feature?** No — chrome reuse, not a second dispatch.  
3. **Should reuse an existing workflow?** Keep Settle as the mismatch close path.  
4. **Naming matches the app?** Settle order · Final · Won’t ship. No Seller/Buyer.

**Philosophy conflict?** No. One job per screen: Dispatch sends; Settle closes leftover.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Final 0 ≤ qty ≤ shipped; leftover live |
| Business rules | OK | No new LR; status still `settled` |
| Workflows | OK | Dock Settle stays beside Dispatch more |
| Edge cases | OK | Extra (+N) when Final > Ordered; hide 0 remainder |
| Permissions | OK | Seller-only part-shipped |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | InlineNotice in footer |
| Scalability | N/A | |
| Mobile interactions | OK | Footer tally + CTA; sheet clears last row (BM-07) |
| First glance (BM-11) | OK | Rows scan like Dispatch without This LR / Confirm dispatch |
| Accessibility | OK | Final labelled; remainder aria when shown |
| Platform consistency | OK | Separate CTA; sibling preview, not Dispatch imports |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Keep separate Settle dock button + sheet.  
- Rows: name + Price/Bill; Ordered · Shipped · Final; signed leftover/extra on the name; pale-green only when exact 0.  
- Footer: grouped leftover (order unit) + Settle order. Drop pending card.  
- Docs + units. No Dispatch / API / lifecycle change.

## Explicitly deferred / rejected

- Folding Settle into the Dispatch sheet.  
- QtyStepper on Final (Final may be 0).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units + existing settle journey testids.
