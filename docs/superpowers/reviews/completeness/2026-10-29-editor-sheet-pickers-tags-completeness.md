# Feature Completeness Review — Editor sheet pickers, tags after Category, catalog apply-all

**Date:** 2026-10-29  
**Module / ask:** Catalog / collection / design editors: Android OS Category (and Rate per / Order taken in / Dispatch) dropdown looks unlike Ekum. Tag suggestions and added chips must stay readable above the keyboard. Do not show Item / Quality / Size tags until Category is chosen. Catalog always applies pack info to member designs — hide the checkbox.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `ui-quality-bar`  
**Disposition:** Redesign → Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Supersedes the **native `<select>`** lock in Completeness `2026-10-20-collection-category-any` for these editor fields only. Empty Category stays muted with no **Pick category…**. Tags still use the page typeahead (not a second Tags sheet) — Completeness `2026-10-20-design-tags-category-contains` “no second Tags sheet” holds.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Official lists (Category, Rate per, Order taken in, Dispatch) are short pick-one jobs. The Android OS spinner is a different product on the same screen as kit fields. Tags without a Category have no official pool — hide them until that pick. Catalog already stamps exclusive members; a remembered off checkbox fights that. Regular collections still opt in. |
| UX Designer | Closed control is the 40px kit field (`bg-input`, 16px). Tap opens a kit Sheet of tappable rows (ConnectionPicker selected chrome — not native checkboxes). No search (short lists). Tag chips stay above the input; the suggestion list uses the visual viewport so the keyboard does not cover chips or options. |
| Solution Architect | One `OptionSheetField` for the four editor selects. Callers already share `MasterCategoryField` / `RateRangeFields` / `OrderDispatchFields`. Catalog Defaults Order/Dispatch inherit; its Rate per uses the same control. Admin tags and Referrals stay native `<select>`. Catalog save path already takes `applyToAll` — force true and hide the row. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Field fill; library pickers as sheets; ConnectionPicker row selection (`border-accent bg-accent/5` + quiet Selected). Tag typeahead stays `TagSuggestInput`.  
2. **Duplicates another feature?** No — same Category / Rate per / Order / Dispatch / tags jobs.  
3. **Should reuse an existing workflow?** Yes — one sheet picker; do not invent a combobox.  
4. **Naming matches the app?** Category, Rate per, Order taken in, Dispatch unit, Item tags / Quality / work tags / Size tags, Apply this info to all designs.  
5. **Units?** No ₹ or qty string change. Whose / which / surface unchanged. Rate per still the Rate-per unit; Order taken in / Dispatch still those units.

**Philosophy conflict?** Native OS spinner on create/edit fights “same job → same control language” and “long lists open as sheets.” **Redesign** the picker chrome, not the taxonomy.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Sheet pick; tags gated on Category; catalog always stamps |
| Business rules | OK | Publish still needs Category; draft does not; catalog exclusive stamp unchanged |
| Workflows | OK | New/Edit collection, catalog, design, Add designs, member sheet, Catalog defaults units |
| Edge cases | OK | Empty Category muted; locked pack Category still foam; regular apply-all remembered |
| Permissions | N/A | Own catalog |
| User states | OK | No Category → no tag fields; Category chosen → typeaheads; keyboard open → chips + list in view |
| Notifications | N/A | |
| Error handling | OK | Publish still “Pick a category.” under Category |
| Scalability | OK | Short official lists; no search |
| Mobile interactions | OK | Sheet above dock. Tag list uses visualViewport; when keyboard is open do not reserve 136px dock clearance (BM-07). |
| First glance (BM-11) | OK | One field language; tags not empty chrome before Category; catalog has no extra checkbox |
| Units (order / dispatch / Rate per) | N/A | Picker chrome only |
| Accessibility | OK | Trigger labelled; sheet titled; rows Selected/Select |
| Platform consistency | OK | ConnectionPicker rows; kit Sheet; Admin/Referrals native left alone |

---

## Gaps

None Required. Prior native-select lock is this Redesign.

---

## Approved scope for this slice

- `OptionSheetField`: 40px closed field → kit Sheet of tappable rows.  
- Wire Category, Rate per, Order taken in, Dispatch on catalog/collection/design editors; Catalog Defaults Rate per too.  
- Hide `CascadeTagsFields` until `masterCategoryId`.  
- `TagSuggestInput`: `visualViewport` anchor; chips + input scrolled into view; list in the remaining gap (keyboard inset, not dock inset).  
- Catalog: `applyToAll` always true; hide the checkbox. Regular collections unchanged. General Collection still none.  
- Units + e2e journeys that used `selectOption`.

## Explicitly deferred / rejected

- Native `<select>` on Admin Tag Management and Referrals.  
- A second Tags sheet (typeahead stays on the page).  
- Search inside Category / unit sheets.  
- Changing Rate per / Order / Dispatch **values** or stamp rules.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
