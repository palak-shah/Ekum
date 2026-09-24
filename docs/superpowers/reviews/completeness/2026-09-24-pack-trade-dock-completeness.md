# Feature Completeness Review — Curated pack Ask rates / Order dock

**Date:** 2026-09-24  
**Module / ask:** On a buyer curated-pack viewer, **Ask for rates** and **Order** should match the design page: sticky above the tab bar, not buried in a card after the last design.  
**Anchors:** `docs/features/collections.md`, `docs/features/explore.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same verbs, same HowManyEach / from-pack path. The card only hid the job after a long scroll. |
| UX Designer | Reuse Explore design dock (`Button` pair, `bottom-20`). Keep **Order goes to {shop}** as a quiet line — not a second CTA surface. Hide dock while album Select / resume-continue owns the band. |
| Solution Architect | No API change. Existing `handlePack` + HowManyEach. |

---

## Platform consistency (required)

1. **Existing patterns?** Design page sticky Ask for rates · Order.  
2. **Duplicates?** No — selection dock still owns multi-pick.  
3. **Should reuse?** HowManyEach, from-pack.  
4. **Naming?** Ask for rates · Order. Order goes to {business}.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Sticky dock opens qty sheet |
| Business rules | OK | Curated pack still orders with pack owner |
| Workflows | OK | Select designs still uses album dock |
| Edge cases | OK | Hide when selecting or resume-continue |
| Permissions | N/A | Visitor only (owner has Edit) |
| User states | OK | Owner: no trade dock |
| Notifications | N/A | |
| Error handling | OK | Existing sheet / toast |
| Scalability | N/A | |
| Mobile interactions | OK | BM-07: pad body for nav + dock |
| Accessibility | OK | Named buttons |
| Platform consistency | OK | Match design page, not a one-off card CTA |

---

## Approved scope for this slice

- Curated pack visitor: sticky **Ask for rates** · **Order** (same as `/products/:id`).  
- Quiet **Order goes to {shop}** line in the scroll (path cue).  
- No dock while this album is selecting or showing resume-continue.

## Explicitly deferred / rejected

- Hide tab bar on album (shop dock does; design page does not — match design).  
- Curate on this dock (still via Select).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (existing from-pack journey + unit)  
