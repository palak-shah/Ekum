# Feature Completeness Review — Dispatch sheet row chrome

**Date:** 2026-10-21  
**Module / ask:** Dispatch rows are cluttered (This LR beside the name + Qty·Price·Bill·Ship·Balance). ChatGPT direction: three quiet facts. Signed − / + balance must scan.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-order-dispatch-ui-refinement-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The Dispatch job is “how many on this LR”. Price/Bill belong on the ticket. Remaining and extra must read as signed numbers, not only a green wash. |
| UX Designer | Tick · 48px thumb · name (no SKU). Under the name: ticket hairline strip. **Ordered {n}** is the caption; **Shipped {n}** sits on the value row with **This LR** (editor) and **Balance**. Same label/value type as other order sheets. −N and +N amber; 0 green on this sheet. Row wash unchanged. |
| Solution Architect | Presentation only. Same `lineDispatchQty` / payload. Preview still uses `orderLineFactsWithThisLr` for the signed balance. |

---

## Platform consistency (required)

1. **Existing patterns?** CheckIcon ticks, compact sheet number, kit Sheet. Ticket keeps Qty · Price · Bill · Ship · Balance.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same Dispatch sheet.  
4. **Naming matches the app?** Ordered · Shipped · This LR · Balance. No SKU on the row.

**Philosophy conflict?** No — fewer facts, same job.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | This LR still the typed qty |
| Business rules | OK | Over-ship unclamped |
| Workflows | OK | Remaining-0 still start off |
| Edge cases | OK | Off line: empty This LR; already = prior; balance = remaining |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | Hairline Ordered · This LR · Balance under the name; Shipped on the value row |
| First glance (BM-11) | OK | Name, then Ordered / This LR / Balance hairline strip; Shipped aligned with the box; ± amber, 0 green |
| Accessibility | OK | Input aria-label stays This LR quantity |
| Platform consistency | OK | Ticket money strip unchanged |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Dispatch row: ticket hairline strip — Ordered {n} label · Shipped value · This LR · Balance. No SKU.  
- − and + Balance numbers amber on ticket and Dispatch (`open` and `over`). 0 stays ink. Row wash unchanged.  
- Docs + units.

## Explicitly deferred / rejected

- Native checkboxes; putting transport in the scroll body.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units; existing fulfillment still finds `order-dispatch-line-qty`.
