# Feature Completeness Review — Orders: six statuses only

**Date:** 2026-09-30  
**Module / ask:** Orders must not offer other statuses. Filter follows **Pending** / **Completed**.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders think in Pending vs finished. Status pick is a slice inside that tab — not a second catalogue of return/sample words. |
| UX Designer | Select Status lists only the six: Requested / Confirmed / Part shipped (Pending); Dispatched / Settled / Cancelled (Completed). Type (Order / Trading / Sample / Return) stays separate. |
| Solution Architect | API still stores sample/return/declined tokens. List pills and detail keep those facts. Filter + Find suggestions drop Received / Approved / Resolved / Declined / Converted. Status facet stays inside the tab (does not bypass Pending/Completed). |

---

## Platform consistency (required)

1. **Existing patterns?** Same filter square + sheet as today; chips unchanged.  
2. **Duplicates another feature?** No. Type filter still covers Sample / Return.  
3. **Should reuse an existing workflow?** Yes — existing menu, not new chips.  
4. **Naming matches the app?** Short trader words (not “Dispatched · complete” in the menu).

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Six menu statuses; scoped by tab |
| Business rules | OK | Pending = open; Completed = finished. Declined tickets stay Completed via the chip, not a menu row |
| Workflows | OK | Switch tab clears a status that does not belong |
| Edge cases | OK | Legacy `delivered` URL still allowed; Received etc. ignored |
| Permissions | N/A | |
| User states | OK | Empty list unchanged |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Same menu; BM-07 unchanged |
| Accessibility | OK | Same menuitemradio |
| Platform consistency | OK | Kit filter menu |

---

## Approved scope for this slice

- Menu + Find suggestions: only the six statuses, split by Pending / Completed.
- Status filter applies **inside** the active tab (does not show all-matching rows across tabs).
- Docs + unit + functional: no Received / Approved / Resolved / Declined in Select Status.

## Explicitly deferred / rejected

- Remapping return/sample StatusPills to the six words (Raised / Received still on those rows).
- Removing `declined` from the API or Completed chip membership.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
