# Feature Completeness Review — How many Order-only footer

**Date:** 2026-10-09  
**Module / ask:** When opening How many from **Order**, drop Share and Ask rates. Job is Place Order for me, or **Order for buyer** as a quiet switch that opens the buyer picker. Ask-for-rates dock keeps its own sheet job.  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`, `docs/features/explore.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Order path = qty → place (me) or place (buyer). Share lives on selection dock / ⋯. Ask rates is a separate dock verb with its own sheet job. |
| UX Designer | Reuse **Can’t supply** switch language for Order for buyer (not a native checkbox). Place Order full-width on the right/primary. Switch on → open buyer sheet; off → Place for me. |
| Solution Architect | `sheetJob: 'order' \| 'ask'`. Order footer: transporter + optional switch + Place. Ask footer: Ask rates only. Remove How many Share. |

---

## Platform consistency (required)

1. **Existing patterns?** CantSupplySwitch; OrderForBuyerSheet; shop dock Ask vs Order.  
2. **Duplicates?** No — removes overlapping Share/Ask from Order sheet.  
3. **Reuse?** Yes — OrderForBuyerSheet unchanged.  
4. **Naming?** Order for buyer; Place Order; Ask for rates (ask job only).

**Philosophy conflict?** No — fewer taps on Order; Share/Ask stay on their verbs.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | buyer-only own catalog → switch/open buyer only |
| Workflows | OK | Shop Ask sets sheetJob ask |
| Edge cases | OK | Close buyer sheet without done → switch off |
| Permissions | OK | canOrderForBuyer unchanged |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | Single primary CTA |
| First glance (BM-11) | OK | One place verb loud |
| Accessibility | OK | role=switch |
| Platform consistency | OK | Switch not native checkbox |

---

## Gaps

None Required.

---

## Approved scope

- How many `sheetJob` order \| ask  
- Order: no Share, no Ask; Place Order + Order for buyer switch → buyer sheet  
- Ask: Ask rates only  
- Wire shop / design set / product Ask vs Order openers  
- Docs + units  

## Explicitly deferred

- Inline buyer pick without sheet  
- Clearing selection on Message (unchanged)  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
