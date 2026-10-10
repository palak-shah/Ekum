# Feature Completeness Review — Buyer transporter

**Date:** 2026-10-08  
**Module / ask:** Buyer types preferred transporter at place (free text + history typeahead + remember). Persist on `Order.transporter`. Dispatch prefills for the seller; seller may edit.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Busy traders reuse the same transporters. Capture preference at place (optional), surface quietly on the ticket, and seed Dispatch so the seller does not retype. |
| UX Designer | One quiet **Transporter** field on How many footer, Photo order, Edit order, and Dispatch. Typeahead from device MRU (newest first, ~20). Prefill last-used per shop when known. Blank is fine. |
| Solution Architect | Existing `Order.transporter` column — no migration. Optional on create / batch / from-pack / amend / create-for-buyer. `OrderView.transporter` always. Shipment still copies on dispatch. History = `localStorage` only. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit `Field` + `TextInput`; same optional chrome language as Dispatch Transporter today. History mirrors qty-each remember keys.  
2. **Duplicates?** No — buyer preference vs shipment transporter already on schema; this wires place → order → dispatch seed.  
3. **Reuse?** Shared `TransporterField` + `transporterMemory` across place/amend/dispatch.  
4. **Naming?** **Transporter** (plain); Optional placeholder.

**Philosophy conflict?** No — optional, quiet, one field, decisions at the moment they matter (place + dispatch).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Type + history + persist + prefill |
| Business rules | OK | Optional; multi-shop one value; last-used key `multi` when mixed |
| Workflows | OK | How many · Photo · Amend · Dispatch |
| Edge cases | OK | Empty OK; seller override on dispatch |
| Permissions | OK | Buyer writes at place/amend; seller at dispatch |
| User states | OK | Quiet detail line when set and not yet shipped |
| Notifications | N/A | No new push |
| Error handling | OK | Trim; ignore storage failures |
| Scalability | OK | Cap ~20 MRU client-side |
| Mobile / BM-07 | OK | Field in sheet footers already cleared |
| First glance (BM-11) | OK | Quiet optional; suggestions only when focused + matches |
| Accessibility | OK | Input + listbox suggestions |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Completeness + `orders.md` + gap matrix.  
- Optional `transporter` on create / batch / from-pack / create-for-buyer / amend DTOs; write in order service.  
- `OrderView.transporter` from order always.  
- `transporterMemory` + `TransporterField`; How many / Photo / Amend / Dispatch.  
- Dispatch open seeds `order.transporter`; remember on confirm.  
- Quiet detail when set and not shipped.

## Explicitly deferred / rejected

- Server-side transporter directory / GST party picker.  
- Per-leg transporter on LR rows.

## Sign-off

Required gaps closed or deferred: Yes  
Ready for implementation: Yes  
