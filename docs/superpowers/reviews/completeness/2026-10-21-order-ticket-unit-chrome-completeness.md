# Feature Completeness Review — Order ticket unit chrome

**Date:** 2026-10-21  
**Module / ask:** Order detail ticket mixed up Sets vs metres — mill rolls showed **per mtr** under every name and **10 mtrs** in Qty. Match How many: name only, group when mixed, unit family at the bottom of the items card.  
**Anchors:** `docs/features/orders.md`, `2026-10-20-how-many-unit-groups-completeness`, `2026-10-20-order-sheet-density-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Mill grey/rolls stay native metres (catalog snapshot). The miss is chrome: sold-as **per mtr** next to Qty **10 mtrs** looks like a second unit. Ticket is a record, not a count sheet — Qty keeps the noun (`10 mtrs` / `10 sets (= 40 pcs)`). Conversion and family total live once under the list. Billing card stays at the top. |
| UX Designer | Same restack as How many / Edit: mixed → **Sets** / **Mtrs** (`SectionHeader`); one unit → no heading. Name only on ticket facts rows. Mill **Send** grid keeps **per mtr** — Qty there is a bare number. |
| Solution Architect | No API / seed unit change. Reuse `groupHowManyByOrderUnit` + `howManyOrderFooterSummary` (rows only — do not duplicate Billing ₹). Quote / dispatch / confirm still G-001 from Edit chrome. |

---

## Platform consistency (required)

1. **Existing patterns?** How many grouping + footer rows. Kit `SectionHeader`. Ticket fact strip unchanged.  
2. **Duplicates another feature?** No — same unit language on the record.  
3. **Should reuse an existing workflow?** Yes — shared group + footer helpers.  
4. **Naming matches the app?** Sets / Mtrs; mill rolls stay metres.

**Philosophy conflict?** No — one unit system, conversion once.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Display only |
| Business rules | OK | Snapshot unit unchanged; mill `mtr` stays `mtr` |
| Workflows | OK | Ticket scan; mill Send still has sold-as |
| Edge cases | OK | One unit; mixed; pack dual qty on the fact strip |
| Permissions | N/A | |
| User states | OK | Parent items + mill cards (buyer / unheld) |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Client restack |
| Mobile interactions | OK | No new sticky bar |
| First glance (BM-11) | OK | Name; Qty noun; family total once |
| Accessibility | OK | Headings when mixed |
| Platform consistency | OK | How many group language |

---

## Gaps

### G-001 — Mill Send grid / quote / dispatch / confirm

| Field | Content |
|-------|---------|
| Gap | Mill hold Send still uses a Qty \| Rate grid with **per mtr** under the name. Quote / dispatch / confirm still not How many chrome. |
| Why it matters | Ticket record now matches Place; mill typing still needs a unit cue on a bare number. |
| Impact if ignored | Send-to-mill looks denser than the ticket. |
| Recommendation | Keep sold-as on mill Send this slice. Restack with How many later. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Order detail item list (parent ticket) and mill cards that show `OrderLineFacts`.
- Drop sold-as under the name when Qty already carries the unit.
- Group mixed units; unit-family rows under the list. ₹ now sits with that total (`2026-10-21-order-ticket-billing-footer-completeness`).
- Mill Send hold grid keeps sold-as.

## Explicitly deferred / rejected

- Changing mill catalog `unit` from metre to set.
- Restacking mill Send, quote, dispatch, confirm.
- Dropping the noun from ticket Qty (`10` instead of `10 mtrs`).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units on ticket chrome; mill metres are correct data.
