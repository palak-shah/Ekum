# Feature Completeness Review — Ticket Total billed ₹ + Missing rates

**Date:** 2026-10-21  
**Module / ask:** `#633L` Total hid Sets ₹ because one set line had no rate (all-or-nothing). Supplier must still see billed qty+₹, and a highlighted cue that some designs are not in that ₹ (no rate, or set with no pcs-in-set).  
**Anchors:** `docs/features/orders.md`, `2026-10-21-ticket-unit-bill-totals-completeness`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | ₹ is what we can bill. Qty still counts every remaining line. A blank Sets ₹ looks like “don’t count those designs.” Show the billed amount and shout what is missing. |
| UX Designer | Same Total rows. Tangerine **+Missing rates** (and/or **+No pcs in a set**) sits under the billed ₹ like leftover extra. Toggle: tap lights those lines; tap off. No design-name list. |
| Solution Architect | Sum `lineBillAmount` per family (skip nulls). Mixed All = billed sum. Cue toggles a tangerine ring on uncounted rows (`ticketLineSkipReason`). How many footer unchanged. |

---

## Platform consistency

1. **Existing patterns?** Ticket mill-bill; tangerine = leftover (Balance).  
2. **Duplicates?** No.  
3. **Reuse?** `lineBillAmount`, `howManySetContentsMissing` rule (pack size).  
4. **Naming?** Missing rates / No pcs in a set.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Billed ₹ + cue |
| Business rules | OK | Declined out; uncounted stay in qty |
| Workflows | N/A | |
| Edge cases | OK | Rate and pack both missing |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | One extra line |
| First glance (BM-11) | OK | Cue under Total, tangerine |
| Accessibility | OK | Cue is text |
| Platform consistency | OK | |

---

## Approved scope

- Per-unit ₹ = sum of billable lines in that family (not all-or-nothing).
- Mixed **All** when any ₹ exists.
- Highlighted cue when remaining lines are uncounted: **+Missing rates** and/or **+No pcs in a set**, right-aligned under the billed ₹.
- Cue is a toggle (`aria-pressed`): on = tangerine ring on those lines.

## Explicitly deferred

- Naming each uncounted design.
- How many / Edit footer.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
