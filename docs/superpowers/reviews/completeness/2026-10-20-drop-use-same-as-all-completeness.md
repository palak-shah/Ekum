# Feature Completeness Review — Drop “Use same as all designs” on Update this design

**Date:** 2026-10-20  
**Module / ask:** **Use same as all designs** is ambiguous and not needed on the design editor. Challenge if wrong.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The ghost **sounds like stamp every design**. It does the opposite: reset **this** design to shared units. Pack already has **Apply this info to all designs** (clear direction: pack → members). Edit design (`/catalog/products/:id`) never had this control. Add designs already has **Same for all designs** on the **page**. A second “same as all” inside **Update this design** is a CMS undo, not a trader job. |
| UX Designer | One job on the sheet: this design. **Done** keeps what they typed. Matching others = type the same fields, or the pack Apply row. Do not rename the ghost — the wrong-direction tap is the bug. **Remove design** on Add designs stays (different job). |
| Solution Architect | Delete the ghost on collection member sheet + Add designs sheet. Drop `useSameAsAllOnMember` / `clearSheetOverrides` if unused. Keep `forceSameForAllToForm` for pack Apply / new-photo stamp. |

---

## Challenge (required)

**Is the user wrong?** No.

The only real job the ghost had: undo a Diff on this one design without retyping. That is a second path. Philosophy: cut it. Losing a session undo is cheaper than a trader tapping it thinking they just set the whole pack (or wiping a careful override).

**Keep (not this slice):** pack **Apply this info to all designs**; Add designs page card **Same for all designs** / **This design**; Diff on library members.

---

## Platform consistency (required)

1. **Existing patterns?** Sheet footer = primary **Done** (Remove on batch).  
2. **Duplicates another feature?** Yes — pack Apply, and the batch shared card.  
3. **Should reuse an existing workflow?** Yes — edit this design’s fields, or Apply on the pack.  
4. **Naming matches the app?** Removing a label that fights Apply.

**Philosophy conflict?** Yes vs “if two ways exist, keep the shorter one” → **cut the ghost**, not rename-and-keep.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Done still saves this design |
| Business rules | OK | Apply-all / photo stamp unchanged |
| Workflows | OK | Add designs, collection member, Edit design |
| Edge cases | OK | 1 vs 2+ designs: no ghost either way |
| Permissions | N/A | |
| User states | OK | Diff still tap-to-edit |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Shorter footer; BM-07 unchanged |
| First glance (BM-11) | OK | Done is the one job |
| Accessibility | OK | One primary in the sheet |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Remove **Use same as all designs** from collection **Update this design** and Add designs **Update this design**.  
- Docs + unit/e2e that asserted the ghost.

## Explicitly deferred / rejected

- Renaming the ghost (“Match the others”).  
- Removing pack **Apply this info to all designs**.  
- Removing Add designs **Same for all designs** page card.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
