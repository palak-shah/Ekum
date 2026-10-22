# Feature Completeness Review — Edit order How many chrome

**Date:** 2026-10-21  
**Module / ask:** Edit order / Edit inquiry sheet matches Place How many: group by unit, no per-line Sets, conversion + billing in the sticky footer.  
**Anchors:** `docs/features/orders.md`, `2026-10-20-how-many-unit-groups-completeness`, `2026-10-20-order-sheet-density-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Buyer edit is the same count job as Place. Soft-remove + Undo stays (not saved until Save). Conversion and ₹ belong once at the bottom, not on the row. |
| UX Designer | Reuse How many line chrome: name wrap, 48px thumb, foam − n +, × beside the name, group titles only when mixed. Sticky footer = unit rows + ₹ (when every remaining line is billable) + Save. Note / Transporter stay in the scroll. No Same for all this slice (edit is a short existing list). |
| Solution Architect | No API change. Extract `AmendOrderSheet`; reuse `HowManyGroupedLines`, `QtyStepper`, `howManyOrderFooterSummary`. Quote / dispatch / confirm stay as they are (G-003). |

---

## Platform consistency (required)

1. **Existing patterns?** How many / builder grouping + footer. Kit Sheet sticky footer. Soft-remove Undo already on amend.  
2. **Duplicates another feature?** No — same count sheet, later in the ticket.  
3. **Should reuse an existing workflow?** Amend POST unchanged.  
4. **Naming matches the app?** Edit order / Edit inquiry; Sets / Mtrs; Save changes.

**Philosophy conflict?** No — one job per line, conversion at the footer.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Qty / remove / Undo / transporter / note / Save unchanged |
| Business rules | OK | Empty amend still rejected; ₹ only when every remaining line has a rate |
| Workflows | OK | Same taps; Save in sticky footer |
| Edge cases | OK | Mixed units; mixed pack size; last line not removable; inquiry title |
| Permissions | N/A | Existing amend window |
| User states | OK | Inquiry uses the same sheet |
| Notifications | N/A | |
| Error handling | OK | In-sheet InlineNotice |
| Scalability | OK | Client restack |
| Mobile interactions | OK | BM-07: Sheet footer clears last line |
| First glance (BM-11) | OK | Name + pill; footer holds units and ₹ |
| Accessibility | OK | Stepper aria-label uses count noun |
| Platform consistency | OK | Shared How many pieces |

---

## Gaps

### G-001 — Quote / dispatch / confirm

| Field | Content |
|-------|---------|
| Gap | Other action sheets still Qty columns, not grouped How many chrome. |
| Why it matters | Place / Edit now match; tickets still differ. |
| Impact if ignored | Confirm / Dispatch look roomier. |
| Recommendation | Out of scope. User asked Edit order only. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Edit order and Edit inquiry only.
- How many line chrome + unit groups + sticky footer (unit family rows + ₹ when billable + Save).
- Soft-remove × / Undo unchanged in meaning.
- Quote, dispatch, settle, mill Change out of scope.

## Explicitly deferred / rejected

- Same for all on Edit — shipped in `2026-10-21-edit-order-same-for-all-completeness`.
- Collapsing the ticket Note to How many idle **Add note**.
- Restacking quote / dispatch / confirm.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units on the amend sheet; no new journey (chrome).
