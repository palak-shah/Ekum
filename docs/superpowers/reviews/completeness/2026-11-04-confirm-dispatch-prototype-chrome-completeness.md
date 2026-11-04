# Feature Completeness Review — Confirm / Dispatch prototype chrome + extra wash

**Date:** 2026-11-04  
**Module / ask:** Ticket extra wash; Confirm + Dispatch sheet rows like prototype; shared Notes composer on Confirm/Dispatch/Settle; ticket Dispatches card list like prototype (keep PDF/Edit). Manual order no. chrome unchanged. Personal note stays on Confirm (no company-only hint copy — understood).  
**Anchors:** `docs/features/orders.md`, Accept/Dispatch/Dispatches prototypes, `OrderDetailPage`, `OrderLineFacts`, `NoteAttachField`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One job per sheet: Confirm = lock supply; Dispatch = This LR qty; Dispatches card = what went out. Extra wash makes over-ship scannable. |
| UX Designer | Asked cue quieter than Sets/−n+/₹. Shared note = ticket Notes composer (Add note). Personal quiet, no “company only” hint. Dispatches: name · N sets; PDF/Edit stay. |
| Solution Architect | Chrome-only; reuse QtyStepper, NoteAttachField composer, formatOrderQty, decideLines/dispatch payloads. |

---

## Platform consistency (required)

1. **Existing patterns?** Tick squares, How many steppers, ticket Notes composer, kit fields.  
2. **Duplicates?** No — replaces Ordered·Shipped·This LR / no-Asked Confirm with prototype language.  
3. **Reuse?** NoteAttachField composer; orderRateText / formatOrderQty.  
4. **Naming?** Confirm (not Accept); Dispatches; Send dispatch.  
5. **Units?** Design line · order qty for Asked / shipped-of-ordered / This LR / Dispatches card qty; Rate per on Confirm rate label and Dispatch cue ₹.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Personal company-only behaviour unchanged |
| Workflows | OK | |
| Edge cases | OK | Remaining-0 tick → This LR 1; over wash |
| Permissions | OK | Personal posting company only |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | Sheet scroll; BM-07 docks unchanged |
| First glance (BM-11) | OK | Asked quiet; Manual as now; notes idle |
| Units | OK | Named above |
| Accessibility | OK | Tick aria; labels on steppers |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Extra: `orderLineBalanceRowClass` over → `bg-warning-soft`
- Confirm: title Confirm order; Asked cue; unit noun −n+ · ₹ per; Confirm N of M; ticks; Manual as today; Personal without company-only hint; shared note composer
- Dispatch sheet: progress cue + This LR stepper; title Dispatch to {shop}; Send dispatch; shared note composer
- Settle: shared note composer only (line strip unchanged)
- Ticket Dispatches card: LR · transporter · date; name + formatOrderQty; keep PDF/Edit

## Explicitly deferred / rejected

- Show metres to buyer
- Settle Ordered · Shipped · Final redesign
- Accept wording on Confirm

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
