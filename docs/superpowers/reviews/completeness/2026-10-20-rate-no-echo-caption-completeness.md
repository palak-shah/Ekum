# Feature Completeness Review — Rate field, no echo caption

**Date:** 2026-10-20  
**Module / ask:** Do not repeat the rate as a ₹ label under the textbox (`₹ 2000` then `₹2,000`).  
**Anchors:** `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The field is the rate. A second formatted line is noise. |
| UX Designer | ₹ already prefixes the input. Echo caption fails BM-11 (second title). Keep only the range error (*High rate must be at least the low rate*). |
| Solution Architect | `RateRangeFields` — one condition. Helper `rateRangeCaption` can stay for tests / range text; UI does not echo ₹. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Field; no second live-format line on contains / MOQ.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — same Rate row, quieter.  
4. **Naming matches the app?** Rate. Not a caption.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Echo gone; invalid range still warns |
| Business rules | N/A | |
| Workflows | OK | New collection, member sheet |
| Edge cases | OK | Empty still quiet |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Danger line for inverted range |
| Scalability | N/A | |
| Mobile interactions | OK | Less chrome |
| First glance (BM-11) | OK | One caption: the field |
| Accessibility | OK | Error text remains |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Hide the formatted ₹ echo under Rate (one rate and range).  
- Keep the inverted-range error.  
- Docs + unit.

## Explicitly deferred / rejected

- Formatting thousands inside the textbox.

---

## Decision

**Proceed.**
