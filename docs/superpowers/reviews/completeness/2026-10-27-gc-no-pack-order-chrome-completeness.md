# Feature Completeness Review — General Collection has no pack order chrome

**Date:** 2026-10-27  
**Module / ask:** General Collection should not show **Apply this info to all designs** or **Order and dispatch**. It is leftover storage for dangling designs, not an album they order as a pack.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | GC is computed leftovers, not an Explore / order pack. Pack Rate, apply-all, and order/dispatch units belong on regular collections and catalogs. Designs keep their own Rate per / Order and dispatch on the design editor. |
| UX Designer | Edit collection details for GC: name + description only (already no tags/category/rate). Drop apply-all and the Order and dispatch accordion. Album: no “Rates are per pc. Order and dispatch…” journey line. Select + Order on leftover **designs** stays (trade the design, not the bouquet). |
| Solution Architect | Hide chrome when `kind=general`. Save must not stamp apply-all / pack units onto leftovers even if a remembered apply-all flag is on. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** GC already omits tags/category/rate, Draft, Delete, setProducts, Explore. Same rule: not a pack.  
2. **Duplicates another feature?** No. Design editor still has Order and dispatch.  
3. **Should reuse an existing workflow?** Hide with `isGeneralCollection`, same as product details.  
4. **Naming matches the app?** General Collection.  
5. **Units?** No ₹ string invented. Whose = design (not pack) · which = order/dispatch/Rate per stay on the design · surface = design editor, not GC.

**Philosophy conflict?** No. Matches “GC is leftover home, not a sell-as pack.”

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hide apply-all + pack Order and dispatch; album journey |
| Business rules | OK | GC save does not stamp pack units onto members |
| Workflows | OK | Add leftover to a real collection to set pack units |
| Edge cases | OK | Remembered apply-all ignored on GC |
| Permissions | OK | Owner editor / album only |
| User states | OK | Rename still works |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Shorter editor; no new sticky bar |
| First glance (BM-11) | OK | Bouquet job is name + leftover designs, not pack sell-as |
| Units (order / dispatch / Rate per) | OK | Pack chrome gone; design units unchanged |
| Accessibility | OK | Controls removed, not disabled |
| Platform consistency | OK | |

---

## Gaps

### G-001 — GC editor looked like a pack

| Field | Content |
|-------|---------|
| Gap | Apply this info to all designs + Order and dispatch sat on General Collection edit, and the album showed a pack journey line. |
| Why it matters | Traders think they can sell the leftover pile as a collection. |
| Impact if ignored | Accidental stamp of pack units onto every dangling design. |
| Recommendation | Hide pack trade chrome when `kind=general`. Do not stamp on save. |
| Priority | Required before implementation |

Closed by this slice.

---

## Approved scope for this slice

- GC editor: name + description only — no apply-all, no Order and dispatch accordion, no on-request pack note.
- GC album: no order/dispatch journey line.
- GC Update does not apply pack units / apply-all to members.
- Regular / catalog editor and design editor unchanged.

## Explicitly deferred / rejected

- Hiding Select / Order on leftover **designs** (those are design trade, not pack trade).
- Hiding design Rate per on GC album facts (design money, not pack Order and dispatch).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
