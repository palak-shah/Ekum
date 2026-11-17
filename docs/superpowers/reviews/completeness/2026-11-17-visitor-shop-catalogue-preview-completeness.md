# Feature Completeness Review — Visitor shop catalogue preview + View all

**Date:** 2026-11-17  
**Module / ask:** Visitor shop catalogue shows the same short preview as Home (4 packs / 4 designs) plus **View all…** to a dedicated `/company/:id/catalogue` page. That page lists every collection/design this viewer may already see and keeps today’s visitor shelf actions (open, ⋯, Find, layout, Select, trade dock). Home **View more…** → You unchanged.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/company.md`, `docs/features/home.md`  
**Disposition:** Proceed (with Redesign vs older visitor-full-list lock)

> Completeness keeps Ekum **coherent**. Shop face = look; full shelf job = its own page. Do not strip visitor actions when moving the list.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Full Select/Find library on the shop face fights one-job-per-screen and duplicates Home→You. Preview + dedicated catalogue matches that split for visitors. |
| UX Designer | Quiet **View all…**; catalogue page Back to shop; same foam tabs/rows/tiles/dock as today — not a read-only strip. Preview taps still open album/DesignSheet. |
| Solution Architect | No new APIs or grants. Client slice + route; reuse BusinessProfileBody shelf + dock (variant `catalogue`). Own `/company/:id/catalogue` → `/more`. |

---

## Platform consistency (required)

1. **Existing patterns?** Foam catalogue card; You-style rows/tiles; PageHeader Back; SelectModeControls + BottomTradeDock; `?tab=collections|products` like You.  
2. **Duplicates another feature?** No — visitor catalogue is not My collections; audience-filtered other-shop shelf.  
3. **Should reuse an existing workflow?** Yes — move existing visitor shelf behaviour to the new route; do not invent a second interaction model.  
4. **Naming matches the app?** View all… (visitor) · View more… (Home) · Business / company name header · Collections · Designs.  
5. **Units?** N/A.

**Philosophy conflict?** Older docs/completeness said visitor shop keeps the full list on the profile. **Redesign** that lock to preview + View all → catalogue page. Action parity on that page is Required.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Preview, View all, full catalogue page |
| Business rules | OK | Same audience rows; no new grant |
| Workflows | OK | Shop → catalogue → Back; open / ⋯ / Select / Order |
| Edge cases | OK | Stub omits; empty omits; own catalogue → You; tab deep-link |
| Permissions | OK | Profile access + existing collection visibility |
| User states | OK | Home vs shop preview vs catalogue vs stub |
| Notifications | N/A | |
| Error handling | OK | Existing profile/shelf errors |
| Scalability | OK | Preview caps; full page uses same page size as today |
| Mobile interactions | OK | Dock clearance BM-07 on catalogue |
| First glance (BM-11) | OK | Quiet preview; catalogue one job |
| Units | N/A | |
| Accessibility | OK | Link + PageHeader Back |
| Platform consistency | OK | After Redesign |

---

## Gaps

None Required.

### Redesign vs older completeness

| Older lock | Now |
|------------|-----|
| 2026-11-17 home-team-roster: visitor full catalogue on shop | Visitor preview 4/4 + **View all…** → `/company/:id/catalogue` |
| company.md: visitor keeps full list, Find, Select on shop face | Find / Select / layout / dock on catalogue page; shop face preview opens only |

---

## Approved scope for this slice

- Visitor (and Home) catalogue preview: 4 collections / 4 designs.  
- Visitor **View all…** → `/company/:id/catalogue` (`?tab=` from active tab).  
- Catalogue page: full allowed list + Find + layout + Select + ⋯ + trade dock + open album/DesignSheet (parity with today’s visitor shop shelf).  
- Shop face: no Select / Find / layout; preview taps still open.  
- Home **View more…** → `/more` unchanged.  
- Own `/company/:id/catalogue` → `/more`.  
- Docs + unit/e2e + trader-eye.

## Explicitly deferred / rejected

- Expand-in-place on the shop face.  
- New APIs / grant rules.  
- Changing Home caps or destination.  
- Weakening visitor Message / Share / Bookmark / Select on the full list.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
