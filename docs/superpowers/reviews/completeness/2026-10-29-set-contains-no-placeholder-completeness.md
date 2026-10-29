# Feature Completeness Review — Blank 1 set contains (no ghost 4)

**Date:** 2026-10-29  
**Module / ask:** Empty **1 set contains** shows a ghost `4` that reads like a real pack size. Keep the field blank; unit suffix only. Blank/0 still means pack size is not given.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `sell-as-units`  
**Disposition:** Redesign → Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Supersedes the empty-field **placeholder `4`** chrome in Completeness `2026-10-15-collection-size-tags-multi` and `2026-10-17-category-keeps-sell-as`. Conversion is unchanged: empty/0 still stores `piecesPerPack: null` (Completeness `2026-10-21-pack-rate-unit-clear`).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Ghost `4` looks filled. Traders who leave it empty already get no conversion. Blank is honest: pack size is not given. Typed numbers still show **4 pcs** / **4 mtrs**. Dozen empty still autofills **12**. |
| UX Designer | Cluster stays `n` + Rate per unit suffix (`pc` / `mtr` / …) so they still know whose unit. Empty: no placeholder, suffix only. Same kit `OrderDispatchFields` on collection, catalog, design, Catalog defaults. |
| Solution Architect | Drop `placeholder="4"` on `collection-set-contains`. `setContainsUnitLabel` and `parsePiecesPerPack` stay. No schema, API, or Explore conversion change. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Field cluster; `FIELD_IDLE_FILL_CLASS`; live unit suffix.  
2. **Duplicates another feature?** No — same pack-size row.  
3. **Should reuse an existing workflow?** Yes — same `OrderDispatchFields`.  
4. **Naming matches the app?** **1 set contains** / **1 dozen contains** / **1 box contains** / **1 bundle contains**.  
5. **Units?** Whose = pack (collection) or that design. Which = contents of one order unit, labeled in Rate per. Surface = Order and dispatch on create/edit. Empty/0 → `null` — no invented ₹. Typed n still **n pc/pcs** (or mtr/mtrs).

**Philosophy conflict?** Placeholder `4` fights “no invented leftover” at first glance even though save already stores `null`. **Redesign** the empty chrome only.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Empty field blank; suffix still Rate per unit |
| Business rules | OK | Blank/0 → `piecesPerPack: null`; typed n saved; dozen empty → 12 |
| Workflows | OK | Collection, catalog, design, Catalog defaults share the field |
| Edge cases | OK | Typed 0 clears to blank; mtr suffix when Rate per is mtr |
| Permissions | N/A | Own catalog |
| User states | OK | Empty vs typed vs 0 vs dozen |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new chrome; accordion unchanged (BM-07) |
| First glance (BM-11) | OK | Empty does not look like pack size 4 |
| Units (order / dispatch / Rate per) | OK | Suffix = Rate per; empty does not invent conversion |
| Accessibility | OK | `aria-label` stays the field label |
| Platform consistency | OK | Same cluster, no one-off |

---

## Gaps

None Required. Prior placeholder-`4` lock is this Redesign.

---

## Approved scope for this slice

- Empty **1 set contains**: no placeholder. Cluster is blank `n` + Rate per unit suffix.  
- Typed number still **4 pcs** / **4 mtrs**. Typed `0` or blank still clears stored pack size (`null`). Dozen empty still autofills **12**.  
- Same `OrderDispatchFields` everywhere it is used.  
- Units for empty field (no placeholder). No e2e asserts the `4` placeholder.

## Explicitly deferred / rejected

- Changing conversion, Rate per, Order taken in, or Dispatch values.  
- A hint word instead of the suffix (suffix already names the unit).  
- Per-page exception for Catalog defaults.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
