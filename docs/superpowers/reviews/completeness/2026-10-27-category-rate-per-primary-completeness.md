# Feature Completeness Review — Category primary as Rate per default

**Date:** 2026-10-27  
**Module / ask:** Rate per on create collection / catalog / design defaults to the Master Category’s sheet **primary** unit; secondary units stay in the list. Tags unchanged.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `.cursor/rules/sell-as-units.mdc`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Client sheet: Unit of Measurement = what ₹ is usually per; Secondary = other Rate per choices. Readyset is **pc** (dozen/set optional). Fabric is **mtr** (kg optional). **Jobwork is mtr** (kg and pc secondary) — today’s “prefer pc if offered” would pick the wrong default. |
| UX Designer | Same Rate per select. No new chrome. Order taken in / Dispatch stay platform usual **set**. Changing Category on create resets Rate per to the new primary until they pick another. |
| Solution Architect | Keep sheet `units[]` order (`[0]` = primary). Persist `CategoryUnit.sortOrder`. Taxonomy returns that order. `defaultRateUnit` = first offered, not prefer-pc. Create snaps unless the trader already changed the select. Edit keeps stored if still offered. |

---

## Platform consistency (required)

1. **Existing patterns?** Rate per select + category `permittedUnits`.  
2. **Duplicates another feature?** No — fixes default, not a second unit control.  
3. **Should reuse an existing workflow?** Create collection / catalog / design Rate per.  
4. **Naming matches the app?** Rate per · pc / mtr / kg / dozen / set.  
5. **Units?** Whose: pack Rate per on collection/catalog; design Rate per on the design editor. Which: **Rate per** (`catalogRateUnit`) only. Surface: create/edit select. Order / dispatch unchanged. Pack Explore card still uses collection Rate per.

**Philosophy conflict?** No — Rate per was already category-aware; this matches the sheet primary instead of always preferring pc.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Options = primary + secondary; selected = primary on create |
| Business rules | OK | Jobwork never defaults to pc; user may still pick kg or pc |
| Workflows | OK | Create snap; edit keep/coerce-if-invalid; category change on create resets |
| Edge cases | OK | No category yet → pc until taxonomy; shop sell-as Rate per does not override category primary on create |
| Permissions | N/A | |
| User states | OK | Saved Rate per kept when still offered |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | One integer sortOrder |
| Mobile interactions | OK | No new sticky chrome (BM-07 N/A) |
| First glance (BM-11) | OK | Readyset shows pc; Fabric/Jobwork show mtr; list still has secondaries |
| Units (order / dispatch / Rate per) | OK | Rate per only |
| Accessibility | OK | Existing Rate per label |
| Platform consistency | OK | Item / quality / size tags unchanged |

---

## Gaps

### G-001 — Prefer-pc default fights Jobwork / Fabric order

| Field | Content |
|-------|---------|
| Gap | `defaultRateUnit` picks pc whenever pc is offered; taxonomy sorts units A–Z |
| Why it matters | Jobwork primary is mtr; Fabric primary is mtr (kg must not sort first) |
| Impact if ignored | Create Jobwork Rate per shows pc |
| Recommendation | sortOrder from sheet; default = first offered |
| Priority | Required before implementation |

---

## Approved scope for this slice

- `CategoryUnit.sortOrder`; seed from sheet array order; taxonomy returns primary first.
- `defaultRateUnit(offered)` = first offered (else pc).
- Create collection / catalog / design: Rate per = category primary until the trader changes the select; category change on create resets to the new primary.
- Edit: keep stored Rate per if offered; else coerce to primary.
- Docs: catalog + collections Rate per default. No tag list edits. Order / dispatch stay set.

## Explicitly deferred / rejected

- Changing Item / Quality / Size master options.
- Rewriting Order taken in / Dispatch from the sheet.
- Design batch Rate per select (still amount-only).
- Rewriting saved packs/designs that already stored pc on Jobwork.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (unit coverage; no new e2e required)  
