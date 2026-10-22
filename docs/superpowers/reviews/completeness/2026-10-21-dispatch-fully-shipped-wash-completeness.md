# Feature Completeness Review — Fully shipped green · leftover/extra without a number chip

**Date:** 2026-10-21  
**Module / ask:** Green highlight the row when the line is **fully shipped**. Tangerine leftover/extra on that green wash does not scan. Never put a background chip around the signed number.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-dispatch-remainder-inset-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Green means “this design is complete.” Leftover and extra are the exception — they must not sit on green. |
| UX Designer | `done` only → `bg-success-soft` (on or off). −N / +N are bare tangerine, no pill. Extra/leftover keep the selected foam/accent wash. |
| Solution Architect | Same `orderLineBalance` tones. Change `orderLineBalanceRowClass` so `over` is not green (ticket + Dispatch). |

---

## Platform consistency (required)

1. **Existing patterns?** Ticket already uses `orderLineBalanceRowClass`; Dispatch remainder is the name-row number.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same wash helper.  
4. **Naming matches the app?** Fully shipped, not “done/over”.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Over-ship still allowed; wash is presentation |
| Workflows | OK | Remaining-0 Dispatch still start off; off + remaining 0 is green |
| Edge cases | OK | Extra after This LR: no green, bare +N |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | |
| First glance (BM-11) | OK | Green = complete; tangerine number only when not complete |
| Accessibility | OK | Number has no extra chip |
| Platform consistency | OK | Ticket extra no longer green |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Row wash green only when Balance is exact 0 (fully shipped), including Dispatch lines that are off.  
- Remove the tangerine pill/chip around Dispatch leftover/extra.  
- Docs + units.

## Explicitly deferred / rejected

- Changing ticket Balance 0 in the strip.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units.
