# Feature Completeness Review — Send quote Dispatch chrome

**Date:** 2026-10-08  
**Module / ask:** Send quote line list should match Dispatch / Confirm card look-and-feel (not a DESIGN · QTY · RATE table).  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same seller job language across Confirm / Quote / Dispatch — cards, not a spreadsheet. Quote still edits qty + rate and Can’t supply. |
| UX Designer | Dispatch card: wash · thumb · name · facts · trailing numbers. Quote: same card; trailing **Qty** + **Rate**; **Can’t supply** switch (full colour); mute stack when declined. Keep Same for all + summary. |
| Solution Architect | UI-only rebuild of quote sheet rows; payloads unchanged. |

---

## Platform consistency

1. **Existing patterns?** Match Dispatch / Confirm `OrderLineStack` cards.  
2. **Duplicates?** No — unifies Quote chrome with siblings.  
3. **Reuse?** `OrderLineStack`, `OrderLineFacts`, `CantSupplySwitch`, compact qty/rate inputs.  
4. **Naming?** Send quote · Can’t supply · Same for all · Qty · Rate.

**Philosophy conflict?** No.

---

## Approved scope

- Completeness + `orders.md` + gap matrix.  
- Rebuild Send quote item list to Dispatch-style cards.  
- Keep mill “From” rate as quiet cue when desks apply.  
- Units for sheet item helpers if needed; no API change.

## Explicitly deferred

- Removing Send quote / merging into Confirm.

## Sign-off

Required gaps closed or deferred: Yes  
Ready for implementation: Yes  
