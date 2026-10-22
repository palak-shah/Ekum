# Feature Completeness Review — Quiet Item tag suggestions

**Date:** 2026-10-20  
**Module / ask:** Collection/design tag typeahead: empty focus shows **used** shop tags only; list is short; closes after a pick (and Escape). Official taxonomy is for typing, not a wall.  
**Anchors:** `docs/features/collections.md`, `docs/features/catalog.md`, `ui-quality-bar`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders reuse Saree / Kurti they already tag. Dumping 40 official item types on tap is a catalog, not a field. Typing still finds official labels and **Use “…”** still creates custom. |
| UX Designer | Match `SuggestInput`: cap **8**, close on pick, Escape closes, click the field again to add another. Empty with no history = no menu. Rows `text-sm`, short max-height. Same quiet pattern on Quality / Size (one control). |
| Solution Architect | Used = union of `categories` on `/products` + `/collections`, bucketed with `categoriesToTagSlots`. No API change. Shared `filterTagSuggestions`. |

---

## Platform consistency (required)

1. **Existing patterns?** City/category `SuggestInput` (cap 8, type before live, close on pick).  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same TagSuggestInput; same product/collection lists already cached.  
4. **Naming matches the app?** **Item tags**. **Use “…”** for custom.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Used on empty; typed official + used; custom still works |
| Business rules | OK | Tags still flatten to `categories[]` max 20 |
| Workflows | OK | Collection create/edit + design editor + member sheet |
| Edge cases | OK | New shop: empty menu until they type |
| Permissions | N/A | Own catalog |
| User states | OK | Pick closes; click field again for another |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Cap 8; cached lists |
| Mobile interactions | OK | Shorter list no longer buries Rate / dock (BM-07) |
| First glance (BM-11) | OK | Focus does not open an encyclopedia |
| Accessibility | OK | listbox; Escape |
| Platform consistency | OK | SuggestInput judgment |

---

## Approved scope for this slice

- Empty query → shop-used tags only (≤8).  
- Typed → used hits then official, ≤8.  
- Close on pick and Escape. Click field to open again.  
- Quieter list chrome.  
- Docs + units.

## Explicitly deferred / rejected

- Platform-wide “popular tags” ranking.  
- A new tag picker sheet.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
