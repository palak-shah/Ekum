# Feature Completeness Review — Dispatch LR + bill legs

**Date:** 2026-10-08  
**Module / ask:** Dispatch sheet: Transporter · Parcels, then N× (LR + Bill). Parcels = N → N rows; + adds a row and bumps parcels. Persist on shipment.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One dispatch often has several parcels, each with its own LR and bill. One LR field is not enough; parcels and the LR/bill list must stay in sync. |
| UX Designer | Transporter · Parcels on top; LR + Bill rows below. Default one row. Typing parcels grows/shrinks rows. Quiet + / ×. No CMS clutter. |
| Solution Architect | `OrderShipmentLeg` table; keep `lrNumber` denormalized from first non-empty leg for list labels. DTO `legs[]` + legacy `lrNumber` back-compat. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Field / TextInput, Dispatch sheet footer, prior-edit expand.  
2. **Duplicates another feature?** No — extends shipment metadata.  
3. **Should reuse an existing workflow?** Same Dispatch / edit shipment.  
4. **Naming?** LR number · Bill no · Parcels · + / ×.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Multi legs create/edit/display |
| Business rules | OK | All optional; parcelCount ↔ legs.length in UI |
| Workflows | OK | New dispatch + prior edit |
| Edge cases | OK | Legacy single lrNumber → one leg |
| Permissions | OK | Seller only (unchanged) |
| User states | OK | |
| Notifications | OK | Chat pulses unchanged |
| Error handling | OK | |
| Scalability | OK | Cap legs (e.g. 50) |
| Mobile interactions | OK | BM-07 footer |
| First glance (BM-11) | OK | One combo by default |
| Accessibility | OK | Labeled fields |
| Platform consistency | OK | |

---

## Gaps

### G-001 — No multi-LR / bill storage

| Field | Content |
|-------|---------|
| Gap | Single `lrNumber` on shipment |
| Recommendation | `OrderShipmentLeg` + migration backfill |
| Priority | Required before implementation |

---

## Approved scope

- Legs table + API + serializer.  
- Dispatch / prior-edit UI: parcels sync + +.  
- Shipments / packing slip show legs.  
- Docs + units.

## Explicitly deferred

- Billing-firm picker; per-leg transporter; forcing historical parcelCount rewrite.

## Sign-off

Required gaps closed or deferred: Yes  
Ready for implementation: Yes  
