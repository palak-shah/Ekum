# Feature Completeness Review — Order-unit chrome (shared)

**Date:** 2026-10-21  
**Module / ask:** One chrome for every order design list / Total / rate: always a unit header (ordering vs dispatching), Total defines the set when rate unit differs, price is ₹/unit. Confirm / Dispatch / quote / Settle still ungrouped. Ticket Total hid `= pcs`. How many showed a silent per-set rupee.  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`, `2026-10-20-how-many-unit-groups` G-003  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Trader must know which unit they are ordering, confirming, or dispatching. Set/box are groups; pc/mtr are not. ₹ Total without a defined set is invented money. A bare `Price ₹1,290` is not a rate. |
| UX Designer | Always `SectionHeader`: `Order in Sets` / `Dispatch in Sets` — even one unit. Conversion only on Total. How many stack vs ticket cards are two layouts of one component. |
| Solution Architect | `OrderUnitGroups` + `OrderUnitTotal` + `OrderRate` in `orderUnitChrome`. No new order `.map` of designs. Conversion: group unit + pack known + rate unit ≠ order/dispatch. Unknown pack → no ₹. Missing rate still billed others + cue. |

---

## Platform consistency

1. **Existing patterns?** Kit `SectionHeader`; How many restack; `formatCatalogRate`.  
2. **Duplicates?** Unifies How many + ticket lists.  
3. **Reuse?** `groupHowManyByOrderUnit`, `isPackOrderUnit`, `catalogRateUnit`.  
4. **Naming?** Order in / Dispatch in · Missing rates · No pcs in a set.

**Philosophy conflict?** No — one chrome, clutter-free headers, conversion at Total.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Lists, totals, rates |
| Business rules | OK | Group vs native; no ₹ without pack |
| Workflows | OK | Place → confirm → dispatch → settle |
| Edge cases | OK | One unit; mixed; pack 1 + /pc; metres-only |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Client restack |
| Mobile interactions | OK | Header + BM-07 footers |
| First glance (BM-11) | OK | Header names the job |
| Accessibility | OK | Section titles |
| Platform consistency | OK | |

---

## Approved scope

- Shared `orderUnitChrome`: Groups (always header, `role`), Total (conversion rule), Rate (`₹/pc`).
- Migrate How many, builder, Edit, ticket, Confirm, quote, Dispatch + prior-edit, Settle.
- Hide Same for all when mixed units.
- Docs: no new order design list without `OrderUnitGroups`.

## Explicitly deferred

- Per-line `1 set = N` (except mixed pack-size cue).
- Per-group Same for all.
- Packing-list PDF dual (already 1:1 skip).
- Explore cards (already `/pc`).
- Grouping by shop or pack ratio.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
