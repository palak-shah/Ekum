# Feature Completeness Review — Rate all (quote UX simplify)

**Date:** 2026-09-08  
**Module / ask:** Replace Same rate for all / Each design chips with one top **Rate all** field; always show per-line Rate inputs.  
**Anchors:** `docs/features/orders.md`, Completeness 2026-09-07-same-rate-for-all-quote  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Chip mode was confusing; bulk fill still needed for wholesale. |
| UX Designer | One optional field + always editable lines — fewer concepts, matches “clutter-free”. |
| Solution Architect | Client-only; keep `ratesWithSharedValue`; drop `QuoteRateMode`. |

---

## Platform consistency (required)

1. **Existing patterns?** Field + TextInput; no new chip mode. HowManyEach qty chips stay as-is (different job).  
2. **Duplicates?** Replaces prior same-rate chrome.  
3. **Reuse?** Same helper for bulk fill.  
4. **Naming?** **Rate all** (plain).

**Philosophy conflict?** No — simplifies toward one job, fewer taps for same rate.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Rate all fills open lines; line edits stay |
| Business rules | OK | Can’t supply excluded from bulk fill |
| Workflows | OK | Send quote + mill held desk |
| Edge cases | OK | One design → no Rate all |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Sheet / card; BM-07 N/A (no new sticky) |
| Accessibility | OK | aria-label Rate all + per line |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Remove Same rate / Each design chips and mode state.
- 2+ supplyable designs: top **Rate all** fills every open line rate on change.
- Always Design \| Qty \| Rate with editable rate per open line.
- Mill held desk: same pattern.
- Docs + unit helper unchanged (or mode type removed).

## Explicitly deferred / rejected

- Changing HowManyEach Same for all qty chips.
- API changes.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (unit + docs; existing quote journeys cover path)
