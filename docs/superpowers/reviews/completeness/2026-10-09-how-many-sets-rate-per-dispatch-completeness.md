# Feature Completeness Review — How many: sets qty + rate per dispatch

**Date:** 2026-10-09  
**Module / ask:** Platform sell-as ~80% sets (qty in Sets, rate per pc/dispatch) / ~20% native unit (e.g. lehenga per pc). Align Place order + create rate labels with client Place order concept.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/orders.md`, `docs/features/settings.md`  
**Disposition:** Redesign → **Proceed**

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Sets are the majority path (Catalog defaults **set** + dispatch **pc**). Niche packs stay **pc**/mtr/than with rate on that unit. Rate meaning when pack unit: **per dispatch**, not per set. |
| UX Designer | How many: Sets stepper label; ₹/pc on pack lines; contents-missing copy; footer `N sets [= M pcs]`. Create: label **Rate per pc** when order unit is pack-like. No Order through picker. |
| Solution Architect | No new columns — reuse `unit` / `dispatchUnit` / `piecesPerPack` / `rate`. `formatCatalogRate` chooses display unit. No silent migration of old per-set rates. |

---

## Platform consistency (required)

1. **Existing patterns?** How many each sheet; Order and dispatch; Catalog defaults; kit Field labels.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — same create knobs; switch is configuration.  
4. **Naming?** **Sets** / **pcs** / **Rate per pc** — plain trader language.

**Philosophy conflict?** Yes — today’s `formatRate(rate, unit)` shows ₹/set. **Redesign** rate display + create label, then Proceed this slice.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Pack vs native paths |
| Business rules | OK | Rate per dispatch when pack unit; qty in order unit |
| Workflows | OK | Create → Place |
| Edge cases | OK | Missing piecesPerPack; mixed units in one sheet |
| Permissions | N/A | |
| User states | OK | On request rate |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | |
| Mobile interactions | OK | Footer BM-07 unchanged |
| First glance (BM-11) | OK | Sets + rate/pc loudest on pack path |
| Accessibility | OK | Stepper label + aria |
| Platform consistency | OK | After Redesign |

---

## Gaps

### G-001 — Rate shown per set today

| Field | Content |
|-------|---------|
| Gap | `formatRate` uses order unit → ₹/set |
| Why it matters | Client + majority traders price per pc while buying sets |
| Impact if ignored | Wrong money language on Place / Explore |
| Recommendation | Display rate against dispatch when order unit is pack-like |
| Priority | Required before implementation |

### G-002 — Order through picker

| Field | Content |
|-------|---------|
| Gap | Client prototype dropdown |
| Why it matters | Agents / two traders same mill |
| Impact if ignored | None this slice |
| Recommendation | Later — client chat |
| Priority | Future improvement |

---

## Approved scope for this slice

- Docs: 80/20 platform rule; rate per dispatch when pack unit.
- Create/edit: rate field label **Rate per {dispatch}** when order unit is set/dozen/box/bundle.
- How many + order builder: banner (pack lines); ₹/dispatch; visible Sets (etc.); contents not mentioned; footer `N sets [= M pcs]`; native unit path unchanged.
- Helper `formatCatalogRate` / pack-unit detection; units + trader-eye.

## Explicitly deferred / rejected

- Order through / agent picker  
- Auto-migrating historical per-set typed rates  
- New DB fields  
- ₹ money total on How many footer (pcs × rate) — Later  
- Changing MOQ into pieces  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
