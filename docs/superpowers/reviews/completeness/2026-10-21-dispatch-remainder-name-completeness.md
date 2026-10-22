# Feature Completeness Review — Dispatch remainder at the name · no Balance column

**Date:** 2026-10-21  
**Module / ask:** ChatGPT Dispatch row: drop the word **Balance**. Put the signed leftover/extra (**−23** / **+5** / **0**) at the right of the name, next to Price · Bill, a little bigger. That number must recompute as **This LR** changes. No yellow/tangerine ring on the − n + stepper.  
**Anchors:** `docs/features/orders.md`, How many trailing-on-name, `2026-10-21-dispatch-lr-scroll-editor-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The Dispatch job is still “how many on this LR”. Remaining vs extra is a scan of the name row, not a fourth strip column. |
| UX Designer | Hairline **Ordered · Shipped · This LR** (− n +). Signed remainder is trailing on the name (16px), Price · Bill stay quiet under the name. 0 green; − remaining and + extra tangerine. Extra may use a quiet tangerine wash (not a ring on the stepper). |
| Solution Architect | Same `orderLineFactsWithThisLr` / `orderLineBalance` math. Presentation only. Ticket keep Ordered · Shipped · Balance. |

---

## Platform consistency (required)

1. **Existing patterns?** How many `trailing` on the name row; compact fact hairline; `QtyStepper`.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same Dispatch sheet.  
4. **Naming matches the app?** This LR · no “Balance” label on Dispatch.

**Philosophy conflict?** No — fewer strip words, leftover where the eye already is.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Remainder folds This LR the same as today’s Balance preview |
| Business rules | OK | Over-ship unclamped |
| Workflows | OK | Remaining-0 still start off |
| Edge cases | OK | Off line This LR 0 → remainder = remaining; tick + type updates live |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | No stepper ring; 16px number tap-target is display only |
| First glance (BM-11) | OK | Name · remainder; strip is Ordered / Shipped / This LR |
| Accessibility | OK | Remainder `aria-label` leftover/extra after this LR |
| Platform consistency | OK | Ticket still has Balance in the strip |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Dispatch strip: Ordered · Shipped · **This LR** (− n +). No Balance column. No tangerine ring on the stepper.  
- Signed remainder (−N / +N / 0) at the **right of the name**, 16px, live as This LR changes. − / + tangerine; 0 green; extra may use a quiet wash (not a border).  
- Docs + units.

## Explicitly deferred / rejected

- Changing ticket/Confirm Balance column. Native checkboxes.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units; existing fulfillment still finds `order-dispatch-line-qty`.
