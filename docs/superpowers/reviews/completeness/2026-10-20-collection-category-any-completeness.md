# Feature Completeness Review — Collection category + add-tile fill

**Date:** 2026-10-20  
**Module / ask:** New/Edit collection: **Add from existing designs** / **Add photos** share field fill; Category empty state quiet (no **Pick category…**); pick **any** catalog category; if Settings deal-in is exactly one, pre-select it.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `ui-quality-bar`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Deal-in on Settings is a default, not a fence. A pack can be another Master Category (one-off ethnic drop from a mostly-western shop). Publish still needs a category. Draft still does not. |
| UX Designer | Tiles use the same `bg-input` as name / Description / Rate — not louder foam. Category always visible. Empty select is muted with a blank option (no **Pick category…**). One deal-in → that label already selected. |
| Solution Architect | Collection list = `GET /catalog/master-categories`. Profile chips only feed the default helper. API `resolveCategoryIdForCompany` accepts any active category; still auto-fills the single deal-in when the client sends none. Product editor / Explore deal-in unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit field fill; dashed add tiles; Field label **Category** + red * on publish-required.  
2. **Duplicates another feature?** No — same collection identity.  
3. **Should reuse an existing workflow?** Same taxonomy + Rate per for the **selected** category.  
4. **Naming matches the app?** **Category**. No “Choose a category” / **Pick category…**.

**Philosophy conflict?** No — profile deal-in stays the shop’s usual mix; the pack can be more specific.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Full catalog on the select; single deal-in pre-selected |
| Business rules | OK | Publish requires a resolved active category; draft does not; off-profile pick allowed |
| Workflows | OK | Create + edit. Product editor still uses deal-in for its own tags |
| Edge cases | OK | Zero deal-in → empty muted select, full list; unknown id still rejected |
| Permissions | N/A | Own catalog |
| User states | OK | Empty = muted blank; selected = ink label |
| Notifications | N/A | |
| Error handling | OK | Publish still “Pick a category.” when empty |
| Scalability | N/A | |
| Mobile interactions | OK | No new chrome |
| First glance (BM-11) | OK | Add tiles same pale fill as fields; Category is a quiet required field, not a shout |
| Accessibility | OK | Field **Category**; select `aria-label` Master category; blank empty option |
| Platform consistency | OK | Kit `bg-input` only |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Add tiles: dashed `bg-input` (same fill as identity fields).  
- Category always shown when the catalog has rows; options = full catalog.  
- Default: Settings deal-in length === 1 → that id.  
- Empty option: no **Pick category…**; muted until a value is chosen.  
- API allows any active Master Category; single deal-in still auto-resolves when omitted.  
- Docs + units.

## Explicitly deferred / rejected

- Changing Product editor / Explore deal-in chips.  
- Optional / “Choose a category” copy.  
- Auto-adding a picked off-profile category onto Settings deal-in.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
