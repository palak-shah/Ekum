# Feature Completeness Review — Apply to all · honest pack Explore rate

**Date:** 2026-10-22  
**Module / ask:** Apply to all does **not** overwrite a design that already has a rate; tags **append**. Explore pack card must not show pack ₹50 when members still have their own Rate per.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/explore.md`, `sell-as-units`  
**Disposition:** Proceed (Redesign vs `collectionCardRateFields` “prefer saved pack rate” over disagreeing members)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack Rate per is the collection’s asking price **when it describes the designs**. If a design already has its own rupee, Apply to all leaves it. Tags add on. Explore must not advertise ₹50/pc for members that still sell at ₹1680. |
| UX Designer | Apply-all row stays. Quiet **i**: fills empty rates; won’t replace a design that already has a rate; tags add on. Units / MOQ / notes still stamp when Apply is on. |
| Solution Architect | Stamp helpers already fill-empty rates and `unionTags`. Change Explore/album band: pack rate only when priced members follow it; else member min–max; mixed rate units omit. How many stays **design** Rate per. |

---

## Platform consistency (required)

1. **Existing patterns?** Apply-all selected-row chrome + `InfoHint`; Explore teal rate when honest.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** `designFollowsPackRate`, `packTagsForMember`, `collectionCardRateFields`.  
4. **Naming matches the app?** Apply this info to all designs.  
5. **Units?** Whose = **pack** when priced members follow pack Rate per; whose = **designs** when they kept their own Rate per. Which = Rate per. Surface = Explore pack card / album facts. How many = design Rate per. Mixed units omit (do not invent `/pc`).

**Philosophy conflict?** Yes vs “always prefer saved pack rate on the pack card.” Explore already says teal rate **when honest**. **Redesign** pack-first when members disagree; then Proceed. Does **not** fight sell-as-units: pack card is still the collection when the pack rate describes members.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Empty design rates still fill from pack; filled rates stay |
| Business rules | OK | Tags union cap 20; mill members not stamped |
| Workflows | OK | Create photos + edit PATCH same helpers |
| Edge cases | OK | No priced members → pack rate may show; mixed units omit |
| Permissions | OK | Own-company members only |
| User states | OK | Apply remembered per device |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | InfoHint tap, not a second boxed lecture |
| First glance (BM-11) | OK | Pack card ₹ matches what How many will charge per design when members differ |
| Units (order / dispatch / Rate per) | OK | Named above |
| Accessibility | OK | Existing Apply checkbox + i |
| Platform consistency | OK | No new rate chrome |

---

## Gaps

None Required after Redesign of pack-first Explore when members disagree.

---

## Approved scope for this slice

- Keep fill-empty rates; never overwrite a filled design rate; tags append.  
- Apply-all still forces units / MOQ / notes. Update InfoHint copy.  
- `collectionCardRateFields`: pack ₹ only if priced members follow that pack rate; else member min–max; mixed units omit.  
- Docs + units (`collection-card-rate.spec.ts`, `collectionSameForAll.spec.ts`).

## Explicitly deferred / rejected

- Overwriting every member rate when Apply is on (user rejected).  
- Inventing ticket ₹ without pack size.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
