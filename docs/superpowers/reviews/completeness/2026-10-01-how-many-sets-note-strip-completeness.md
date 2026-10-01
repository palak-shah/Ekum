# Feature Completeness Review — How many each: note strip, step 1, sets via units

**Date:** 2026-10-01  
**Module / ask:** How many each / Your selection: always-on note strip; qty ± 1; qty in the design’s sell-as unit; Catalog defaults sell-as starts as **Set**. Show pcs-per-set and **Total N pcs** when known.  
**Anchors:** `docs/features/orders.md`, `docs/features/settings.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Wholesale qty is sets (or that design’s unit). MOQ stays in that unit. Pcs-per-set is a fact, not a second qty. |
| UX Designer | One-line note always (kit TextInput). No Add note. ± 1. One facts line + Total N pcs. Same rows on order builder. |
| Solution Architect | No new order field. Catalog defaults fallback `set`. Existing pc/mtr designs unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** How many each rows; Catalog defaults sell-as; kit TextInput 16px.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — sell-as unit + piecesPerPack.  
4. **Naming?** **sets** / **pcs** / **Total 20 pcs**. Not a new Settings page.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Note strip, step 1, Total pcs |
| Business rules | OK | Qty stored in sell-as unit |
| Workflows | OK | Place still needs qty ≥ 1 |
| Edge cases | OK | No Total without pcs-per-set; metre stays metre |
| Permissions | N/A | |
| User states | OK | Empty note / empty qty |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | |
| Mobile interactions | OK | Same sheet footer; BM-07 unchanged |
| Accessibility | OK | Stepper aria uses unit noun |
| Platform consistency | OK | Catalog defaults only |

---

## Approved scope for this slice

- How many each + order builder standard lines: always-on note; QtyStepper step 1.
- `howManyTotalPcsLabel`; facts keep sold-as · pcs.
- Catalog defaults / empty sell-as fallback **Set**; MOQ copy in that unit.

## Explicitly deferred / rejected

- New settings toggle; forcing metre/kg to set; API qty as pieces; dispatch / quote rate steppers.

## Sign-off

Yes · 2026-10-01
