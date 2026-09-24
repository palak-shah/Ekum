# Feature Completeness Review — New collection redesign

**Date:** 2026-09-24  
**Module / ask:** New collection chrome + always-visible vs three job-grouped expandables; Settings defaults; tag/rate merge; Diff-first; piecesPerPack; allowDownload  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`, `docs/features/settings.md`  
**Disposition:** Redesign → Proceed

> Philosophy: “decide Who/rates on Publish sheet” → **shop defaults in Settings**; pack form shows always-visible identity fields; three job-grouped expandables for rare tweaks; Create & Publish commits form values (no second Who sheet).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders add photos + name most of the time. Habitual Who/rates/units live in Settings. Pack-level overrides stay optional. |
| UX Designer | Always visible: Designs · Name · Description · Tags. Three separate expandables (not one More): Same for all · Set units · Who. Sticky Create & Publish / Save in Draft; hide bottom nav; BM-07 clearance. |
| Solution Architect | Extend `tradeDefaults` for publish + sell-as usual. `piecesPerPack` on Product. `allowDownload` on Collection + Product. Rate non-overwrite in Same for all; pack tags on form, design tags via tap-edit. Portal sticky dock. |

---

## Platform consistency (required)

1. **Existing patterns?** List chrome + sticky dock + SettingsDomainCard; PublishAudienceFields reused inside Who expandable.  
2. **Duplicates another feature?** No — moves publish decisions onto pack form with Settings defaults.  
3. **Should reuse an existing workflow?** Yes — publishDefaults, Same for all Diff, edit portal dock.  
4. **Naming matches the app?** Plain: Same for all designs · Set units · Who can see this?

**Philosophy conflict?** Yes → **Redesign** (docs updated): publish rules may be set on the pack form (prefilled from Settings), not only on a Publish sheet.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Create path + Settings defaults |
| Business rules | OK | Merge tags; don’t overwrite rates; Diff-first |
| Workflows | OK | Create & Publish without second Who sheet |
| Edge cases | OK | Library Diff; also-in packs |
| Permissions | OK | Existing catalog caps |
| User states | OK | Draft / publish |
| Notifications | N/A | |
| Error handling | OK | Inline / toast as today |
| Scalability | OK | |
| Mobile interactions | OK | Hide nav + sticky dock BM-07 |
| Accessibility | OK | Expandable rows |
| Platform consistency | OK | After Redesign docs |

---

## Gaps

### G-001 — Buyer download UI

| Field | Content |
|-------|---------|
| Gap | No buyer photo download control yet |
| Why it matters | Checkbox without enforcement is empty |
| Impact if ignored | Flag unused |
| Recommendation | Ship `allowDownload` schema + Who UI; document buyer export as follow-up |
| Priority | Required before implementation (schema + UI); enforcement Later |

### G-002 — Order stepper in sets

| Field | Content |
|-------|---------|
| Gap | Full qty-in-sets stepper |
| Why it matters | Pack size display vs editable order unit |
| Impact if ignored | Traders still see pcs/set |
| Recommendation | Display + snapshot `piecesPerPack` this slice; stepper Later if needed |
| Priority | Recommended enhancement · Future |

---

## Approved scope for this slice

- Hide bottom nav on collection create/edit; portal sticky Create & Publish / Save in Draft (BM-07).
- Always-visible: Designs → Name → Description → Tags.
- Three expandables: Same for all · Set units · Who (prefilled from Settings).
- Rate/unit/MOQ/notes non-overwrite; Diff-first + subtle bg; also-in packs on design tap. Pack tags on form only; design tags via tap-edit (not Same for all).
- `piecesPerPack` on Product; How many each / order display.
- `allowDownload` on Collection + Product; Who expandable.
- Settings: Defaults (publish + sell-as) + Units conversions page.

## Explicitly deferred / rejected

- Schedule / When on create.
- Buyer download/export UX beyond gate.
- Company-wide overwrite of library design set size.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
