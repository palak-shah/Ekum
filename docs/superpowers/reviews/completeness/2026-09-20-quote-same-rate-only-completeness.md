# Feature Completeness Review — Quote Same for all (rate only)

**Date:** 2026-09-20  
**Module / ask:** Send quote / mill Send: keep bulk fill for **rates only**. Replace the always-on **Rate all** field (prefilled 0) with the existing **Same for all** chip → Apply pattern. No bulk quantity.  
**Anchors:** `docs/features/orders.md`, HowManyEach Same for all, Completeness 2026-09-08-rate-all-quote  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Qty already comes from the buyer’s ask; overwriting every line is the wrong default. Rate is the missing number — one Apply fills open lines. |
| UX Designer | Match How many each: quiet chip, editor with Apply/Cancel. Rate uses a compact ₹ field, not a qty stepper (±10). Empty until Apply — never a 0 “Rate all” form. |
| Solution Architect | Reuse `SameForAllEditor` chrome + `ratesWithSharedValue` on Apply. Same control on mill held Send. Client-only. |

---

## Platform consistency (required)

1. **Existing patterns?** Same for all chip + editor (HowManyEach / order builder).  
2. **Duplicates?** Replaces Rate all field, not a second bulk path.  
3. **Should reuse?** Yes — kit editor; rate input instead of QtyStepper.  
4. **Naming?** Chip **Same for all** (with · ₹n after apply). Not Qty all.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Apply writes rate to open (not Can’t supply) lines |
| Business rules | OK | Qty stays per line; empty Apply does nothing |
| Workflows | OK | Send quote + mill held Send |
| Edge cases | OK | 1 open design → no chip; 0 not shown as applied |
| Permissions | N/A | |
| User states | OK | Line edit after Apply still allowed |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Chip not a second form |
| Mobile interactions | OK | Enter/Done → Apply (form submit) |
| Accessibility | OK | aria-label Same rate for all designs |
| Platform consistency | OK | |

---

## Gaps

None required. Qty bulk explicitly rejected this slice.

---

## Approved scope for this slice

- 2+ supplyable designs: **Same for all** chip; editor is rate + Apply / Cancel.
- Apply fills open line rates only.
- Mill held Send: same.
- Docs + unit tests.

## Explicitly deferred / rejected

- Bulk quantity on quote.
- QtyStepper for rupees.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (unit; quote path already in journeys)  
Reviewers (roles): Product + UX + Architecture (agent)  
Date: 2026-09-20  
