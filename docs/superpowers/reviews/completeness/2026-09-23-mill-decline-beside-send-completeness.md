# Feature Completeness Review — Decline beside mill Send

**Date:** 2026-09-23  
**Module / ask:** Per-supplier Decline next to **Send to {shop}** on the I-handle mill card.  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Trader can Send one mill and skip another. Today Decline is only the whole buyer ticket (More actions). They need “not this shop” without killing the order. |
| UX Designer | Same compact row: **Send** (primary) · **Decline** (secondary). Confirm sheet — no accidental drop. After decline the card stays, marked Declined. |
| Solution Architect | New `POST /orders/:id/mill-decline`. Only held hops (`upstreamReleasedAt` null, still Requested). Decline that hop + matching parent lines. No mill notify (they never got Send). Last open mill/lines → decline parent like today. |

---

## Platform consistency (required)

1. **Existing patterns?** Mill card CTA + kit confirm sheet (Clear chat / Decline order).  
2. **Duplicates?** No. Hold is after Send. Order Decline is the whole ticket.  
3. **Reuse?** Same trail + line `declined` as quote Can’t supply.  
4. **Naming?** **Decline** (not Cancel / Hold). Confirm: **Decline {shop}?**

**Philosophy conflict?** No — one job on the mill card (send or drop that shop).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Decline one held mill |
| Business rules | OK | Only before Send; other mills stay |
| Workflows | OK | Confirm → toast; card stays Declined |
| Edge cases | OK | Last mill / all lines declined → parent declined |
| Permissions | OK | Trader on Manage parent only |
| User states | OK | Buyer never saw the hop |
| Notifications | OK | No mill ping |
| Error handling | OK | Toast |
| Scalability | OK | One hop |
| Mobile interactions | OK | Two compact buttons, no extra sticky bar |
| Accessibility | OK | Confirm title names the shop |
| Platform consistency | OK | Beside Send as asked |

---

## Approved scope for this slice

- Held mill card: **Decline** beside **Send**  
- Confirm sheet; hop + those parent lines declined  
- Soft-hide: trail may name the mill on the trader desk; buyer trail scrubbed  
- Last remaining open work declined → parent declined  

## Explicitly deferred / rejected

- Undo decline / resurrect hop  
- Decline after Send (use Hold / mill’s own decline)  
- Decline on the lone non-desk **Send** (still **Decline order**)  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
