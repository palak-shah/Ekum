# Feature Completeness Review — collection / design create polish

**Date:** 2026-09-17  
**Module / ask:** Collection & design create polish — capped photo grids, publish-first CTAs, drop Everyone, name/description/tags with search, collection tile → full design detail sheet  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`, `docs/features/explore.md`, plan catalog create polish  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Conflicts with product philosophy → **Reject** or **Redesign**.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Suppliers create packs from photos with full design details on one surface; tags must power buyer search; Everyone publish is wrong default for textile trade. |
| UX Designer | Cap grids at 9 + blurred +n; tags via collapsed row + sheet (not chip walls); Create & Publish primary; Followers / Selected only. |
| Solution Architect | Shared `CappedMediaGrid`; CatalogTag official+company; cascade collection→products; Explore search on tag labels; remap legacy everyone in UI. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — kit Sheet, PublishAudienceFields, DesignBatch per-design sheet, SuggestInput patterns.  
2. **Duplicates another feature?** No — Collection create gains parity with Add designs for members; standalone Add designs remains for designs-only.  
3. **Should reuse an existing workflow?** Reuse DesignBatch detail sheet fields; reuse PublishAudienceFields minus Everyone.  
4. **Naming matches the app?** Designs / collection / tags / My followers / Selected — plain trader language.

**Philosophy conflict?** No — decisions at publish; one job per screen; library pickers as sheets.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Grids, CTAs, tags, sheet parity, search |
| Business rules | OK | Custom tags picker-private; searchable on published; cascade unless dirty |
| Workflows | OK | Create → details → Publish (Followers/Selected) |
| Edge cases | OK | >9 tiles; empty tags; legacy everyone |
| Permissions | OK | Own catalog only; company custom tags scoped |
| User states | OK | Create vs edit draft vs published |
| Notifications | N/A | No new notify types |
| Error handling | OK | Tag create fail, publish validation |
| Scalability | OK | Cap custom tags; seed official from taxonomy |
| Mobile interactions | OK | BM-07 sticky CTA clearance unchanged |
| Accessibility | OK | Load more button; sheet labels |
| Platform consistency | OK | Sheet pickers; accent selection elsewhere N/A |

---

## Gaps

### G-001 — Admin promote custom → official

| Field | Content |
|-------|---------|
| Gap | Ops cannot promote custom tags yet |
| Recommendation | Schema `status`; UI deferred |
| Priority | Future improvement |

### G-002 — Trade-name verified library

| Field | Content |
|-------|---------|
| Gap | Excel trade-name global pool |
| Recommendation | Custom tags cover slang for v1 |
| Priority | Deferred |

---

## Approved scope for this slice

- `CappedMediaGrid` (9 + blurred +n) on Collection, DesignBatch, Photo order  
- Publish-first CTAs; remove Everyone from Publish/Visibility  
- Collection name + description + tags (row + sheet); cascade to designs  
- Per-tile design detail sheet with Add-designs field parity  
- CatalogTag seed + company custom; Explore search by tag labels  
- Docs + unit/API + functional coverage  

## Explicitly deferred / rejected

- Admin promote custom → official  
- Full Main→Sub drill-down on form  
- Trade-name global verified library  
- Auto-migrate historical `everyone` posts (UI remaps on next edit only)  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
