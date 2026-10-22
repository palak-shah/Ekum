# Feature Completeness Review — How many Same for all seed · ticket Total · transporter name

**Date:** 2026-10-22  
**Module / ask:** Same for all must open with the qty the trader just typed (not empty). Ticket Total skips declined. Transporter empty field names itself. Place still scrolls to the living chat card.  
**Anchors:** `docs/features/orders.md`, How many sheet, `2026-10-08-buyer-transporter`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same for all is “use this count on every line.” Opening blank after they typed 12 on a line is a trap. Declined designs are not on the mill bill. Transporter must still read after the label scrolls. |
| UX Designer | Chip still opens the existing Same for all editor (QtyStepper + Apply). Seed last typed line qty, else remembered shared qty. Apply still stamps all. Transporter placeholder **Transporter · optional** even when the Field label is present. |
| Solution Architect | Presentation + filter. `ticketTotalSummary` skips `lineStatus === 'declined'`. Place paths already have `navigateToOrderChat`; keep using `livingMessageId`. |

---

## Platform consistency (required)

1. **Existing patterns?** How many Same for all editor; ticket Total; kit placeholder that names the field.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same chip / Apply.  
4. **Naming matches the app?** Same for all · Transporter · optional · Total.  
5. **Units?** Qty is order unit. Declined lines drop out of qty and ₹. No invented Bill ₹.

**Philosophy conflict?** No.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Seed; Apply stamps all; declined out of Total |
| Business rules | OK | Remembered qty still fallback |
| Workflows | OK | How many, Amend, Order builder |
| Edge cases | OK | Mixed units hide Same for all (unchanged) |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Auto-focus stepper; BM-07 sticky Place unchanged |
| First glance (BM-11) | OK | Chip opens with the number they expect |
| Units (order / dispatch / Rate per) | OK | Order qty; declined omitted |
| Accessibility | OK | aria-label Same quantity for all designs |
| Platform consistency | OK | No native checkbox |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Same for all seeds last typed qty (else shared/remembered) on How many, Amend, Order builder.  
- `ticketTotalSummary` / ticket Total skip declined qty and ₹.  
- Transporter placeholder always **Transporter · optional**.  
- Place success stays `navigateToOrderChat` with `livingMessageId`.  
- Units; How many / ticket specs.

## Explicitly deferred / rejected

- Per-line How many Note unbox (spec-locked).  
- Confirm ticks labeled Later (Dispatch-only language).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
