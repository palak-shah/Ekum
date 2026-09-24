# Feature Completeness Review — Dispatch tabular sheet + packing PDF

**Date:** 2026-09-21  
**Module / ask:** Dispatch sheet as a scan list (pending lines, all on, tap off this LR). Shareable packing PDF of a **saved** shipment.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, Raise a return sheet  
**Disposition:** Proceed

> Same job as today (split LR). Chrome matches **Raise a return**. Can’t supply stays on the order page. Restore declined lines only via **Send quote**.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | This truck vs later. Untick ≠ decline. Untick ≠ Settle. PDF is the packing list of what actually left. |
| UX Designer | Return-style rows: accent when on, compact qty when on, trailing This LR / Later. Tally `This LR · n designs · pcs`. No native checkbox, no Select all, no Can’t supply on the sheet. Sticky footer LR + Confirm; BM-07 padding. |
| Solution Architect | Payload still `DispatchDto` — omit off lines. PDF after save from shipment row; scrub mill names for buyers when reveal off. |

---

## Platform consistency (required)

1. **Existing patterns?** Raise a return (row `aria-pressed`, accent, compact qty). Quote Can’t supply stays on order, not this sheet.  
2. **Duplicates another feature?** No — Settle remains close leftover.  
3. **Should reuse an existing workflow?** Yes — existing `POST /orders/:id/dispatch`.  
4. **Naming matches the app?** **This LR** / **Later** / **Confirm dispatch**. Not Square off / Tick all / Seller.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | On/off + qty; PDF of saved LR |
| Business rules | OK | Off lines omitted; declined not on sheet |
| Workflows | OK | Quote restore Can’t supply; Dispatch later LR |
| Edge cases | OK | Confirm disabled if nothing on; qty 1…pending |
| Permissions | OK | Seller dispatch; buyer may reprint if they can see the order |
| User states | OK | Default all on |
| Notifications | N/A | Existing dispatch events |
| Error handling | OK | In-sheet InlineNotice |
| Scalability | OK | Pending-only list |
| Mobile interactions | OK | Sheet footer clearance BM-07; share PDF |
| Accessibility | OK | aria-pressed, qty labels |
| Platform consistency | OK | Return sheet |

---

## Gaps

None Required.

### G-001 — PDF generator

| Field | Content |
|-------|---------|
| Gap | No PDF library in repo |
| Why it matters | Traders share a file, not Print |
| Impact if ignored | Desktop-only print |
| Recommendation | Printable slip page + Share/download; client print-to-PDF / share |
| Priority | Required this slice (share/print of saved shipment). Fancy layout Later. |

---

## Approved scope for this slice

- Dispatch sheet: pending lines only; default on; tap off; compact qty; tally; public note+voice; LR footer.  
- Shipments: **PDF** on each saved row; optional prompt after Confirm.  
- Docs + units + existing `@orders` dispatch journey still Confirm dispatch.

## Explicitly deferred / rejected

- Can’t supply / fully shipped on the sheet.  
- Native checkboxes, Select all, qty 0 skip, two lists, Square off, internal note, draft PDF.  
- Server-generated PDF file store.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
