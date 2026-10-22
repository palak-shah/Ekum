# Feature Completeness Review — Dispatch remainder inset · hide 0

**Date:** 2026-10-21  
**Module / ask:** The signed leftover/extra on Dispatch is too far right and too high. Leave space from the card corner. Do not show **0**.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-dispatch-remainder-name-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | 0 is “nothing to notice”. Only leftover (−) and extra (+) earn a number. |
| UX Designer | Inset from the card corner (`mt` + `mr`). Same 16px tangerine number. Extra wash unchanged. |
| Solution Architect | Same `orderLineBalance` math. Hide when value is 0. |

---

## Platform consistency (required)

1. **Existing patterns?** Trailing on the name; quiet chrome when there is nothing to do.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same Dispatch sheet.  
4. **Naming matches the app?** No “Balance” label; signed − / + only.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Live with This LR; 0 hidden |
| Business rules | OK | |
| Workflows | OK | |
| Edge cases | OK | Exact match after This LR shows no number |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Number not in the rounded corner |
| First glance (BM-11) | OK | Quiet when even; leftover/extra still scan |
| Accessibility | OK | Remainder omitted when 0 |
| Platform consistency | OK | Ticket still shows Balance 0 |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Hide Dispatch name-row remainder when after-This-LR is 0.  
- Inset from the top-right of the card.  
- Docs + units.

## Explicitly deferred / rejected

- Changing ticket Balance 0.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units.
