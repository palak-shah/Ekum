# Feature Completeness Review — New collection client wireframe

**Date:** 2026-10-06  
**Module / ask:** Client New collection wireframe: two-door Add designs, From/To rate, cascading Item / Quality / Size tags, apply-to-all row, order vs dispatch units (settings + How many + order snapshot).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`, `docs/features/orders.md`, `docs/features/settings.md`  
**Disposition:** Redesign (docs lock) then **Proceed**

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One create screen. Add designs is the job. Identity + units are defaults for the pack, not a second CMS. Library designs keep their own rates unless the seller confirms Change. |
| UX Designer | One **Add designs** → **Designs · Photos**. Gallery lives on camera chrome (Android must open the picker, not retake). Rate is From/To with a quiet ₹ caption. Tags are three typeaheads, custom at every slot. Apply-to-all is a quiet selected row. Units stay optional and prefilled with a 10-set preview. |
| Solution Architect | Nested official taxonomy in domain + flattened CatalogTag labels for search. `Product.unit` = order taken in; new `dispatchUnit`; `piecesPerPack` in dispatch units. Snapshot both on `OrderItem`. Company Catalog defaults override platform **set**. |

---

## Platform consistency (required)

1. **Existing patterns?** Sheet chooser; kit Field / TextInput; accent selected row (not a checkbox wall); Who expandable stays.  
2. **Duplicates another feature?** Replaces Same-for-all expandable + 3-door chooser + TagsField sheet **on this pack form** only. Design-batch TagsField sheet can remain until that surface is redesigned.  
3. **Should reuse an existing workflow?** ContinuousCamera + Gallery; `unionTags`; Settings `sellAsUsual`; How many stepper in order unit.  
4. **Naming matches the app?** Add designs · Designs · Photos · Gallery · Apply this info to all designs · Order taken in · 1 set contains · Dispatch unit · Minimum order.

**Philosophy conflict?** Yes (sheet tags vs typeahead; 3-door vs 2-door; dual units) → **Redesign**, then implement the locked docs.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Two-door, cascade, apply-all, dual units |
| Business rules | OK | Tag union; rate Change/Keep; platform → settings → pack |
| Workflows | OK | Create + edit; member tile still per-design |
| Edge cases | OK | Custom tag widens next slot; Android gallery; inverted range |
| Permissions | OK | Own catalog; camera only on Photos |
| User states | OK | Empty pack + after members; edit Visibility sheet |
| Notifications | N/A | |
| Error handling | OK | Why-line + confirm sheet |
| Scalability | OK | Static taxonomy; tag cap 20 |
| Mobile interactions | OK | Sticky dock clearance BM-07 |
| First glance (BM-11) | OK | Add designs loudest; typeaheads quiet |
| Accessibility | OK | Labels on From/To and tag slots |
| Platform consistency | OK | After Redesign lock |

---

## Gaps

### G-001 — Two-door vs three-door chooser

| Field | Content |
|-------|---------|
| Gap | 2026-10-06 chooser locked Camera · Photo library · Designs |
| Why it matters | Client: Designs + Photos; gallery inside camera |
| Impact if ignored | Extra peer door; Android gallery confusion |
| Recommendation | One Add designs → Designs · Photos. Photos = camera + Gallery. |
| Priority | Required before implementation |

### G-002 — Drill-down tags were deferred

| Field | Content |
|-------|---------|
| Gap | 2026-09-17 deferred Main→Sub drill-down; TagsField is a sheet |
| Why it matters | Client flow is typeahead cascade from deals-in |
| Impact if ignored | Wrong suggestions (Readymade children after a custom tag) |
| Recommendation | Three sequential comboboxes; official path narrows; custom widens to company mains |
| Priority | Required before implementation |

### G-003 — Dual order/dispatch units

| Field | Content |
|-------|---------|
| Gap | One `Product.unit`; pack-size snapshot deferred 2026-09-23 |
| Why it matters | B2B: order in sets, dispatch in pcs/mtrs |
| Impact if ignored | Preview and How many lie |
| Recommendation | `dispatchUnit` on product + order line; preview `10 sets (= 40 pcs)` |
| Priority | Required before implementation |

### G-004 — Rate conflict on apply-all

| Field | Content |
|-------|---------|
| Gap | Library rates kept silently; Diff tiles only |
| Why it matters | Same design in another pack with a different rate |
| Impact if ignored | Silent overwrite or stale rates |
| Recommendation | Confirm Change / Keep as is before save |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Completeness Redesign → docs lock → implement:
  - Add designs: Designs · Photos; Android gallery handoff
  - From / To rate + live caption
  - Nested taxonomy + three typeaheads
  - Apply-to-all row; tag union; rate confirm
  - Order taken in / 1 set contains / dispatch unit / MOQ / preview
  - Settings Catalog defaults; How many preview; OrderItem snapshot
- Tests + trader-eye (BM-11)

## Explicitly deferred / rejected

- Jobwork
- Ops promote custom → official
- Chat ＋ Camera/Photos peers
- Inventing unreadable spreadsheet cells (flag in tests)
- Side-by-side empty-state tiles (keep one Add designs control)

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
