# Feature Completeness Review — Profile catalogue You listings

**Date:** 2026-11-17  
**Module / ask:** Business Profile catalogue should match You listings (underline Collections · Designs, list rows + design tiles) with existing own/visitor ⋯ and long-press Message · Share · Order. No Catalogs tab. Preserve first-tab-with-content and published-only shelf.  
**Anchors:** `docs/features/company.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders already know You list + visitor album ⋯ + shop dock. Profile should not invent a third catalogue. Drafts stay on You. |
| UX Designer | Underline tabs like You (no Catalogs). Collection rows = `YouCollectionListRow` look; hide library meta/draft chips. Designs = You tiles. Long-press dock already exists. |
| Solution Architect | Reuse rows, `visitorCollectionMoreIds`, `DesignSheet`, `CatalogShareSheet`, `useSaveToggle`, shop dock. Map `CollectionCard` / `ExploreProductCard`. No new APIs. Seed tab once; manual tap wins. |

---

## Platform consistency (required)

1. **Existing patterns?** You underline tabs, You collection rows, You design tiles, visitor album ⋯, shop trade dock.  
2. **Duplicates another feature?** Visual reuse of You; not a second library (no create row, no drafts, no Catalogs).  
3. **Should reuse an existing workflow?** Yes — sheets/handlers above.  
4. **Naming matches the app?** Collections · Designs. Message · Share · Bookmark · Order.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Listings + menus + dock |
| Business rules | OK | Published-only; first tab with content; manual tab kept |
| Workflows | OK | Tap album `/collections/:id` (`packManage` own); tap design DesignSheet |
| Edge cases | OK | Both empty omit catalogue; catalogs mixed into Collections |
| Permissions | OK | Own ⋯ OwnerCollectionMoreSheet (`canDraft` false) Share/Bookmark/Who/Add/Edit (album); visitor Message · Share · Bookmark; dock Message muted own; Share/Order same prepare path. No Hide/Delete/Draft on published profile. |
| User states | OK | Home own + visitor shop |
| Notifications | N/A | |
| Error handling | OK | Existing chat/order toasts |
| Scalability | N/A | |
| Mobile interactions | OK | Dock clearance BM-07; long-press swallows click |
| First glance (BM-11) | OK | Underline + list, not mosaic pills |
| Units | N/A | |
| Accessibility | OK | role=tablist |
| Platform consistency | OK | |

---

## Gaps

None Required. `YouCollectionListRow` only takes `onMore`/`onShare` — You library still uses `youCollectionRowMore`; profile never wires Hide/Publish/Delete. Manual tab tap is not overwritten by first-tab-with-content.

---

## Approved scope for this slice

- Underline Collections · Designs; no Catalogs.  
- `YouCollectionListRow` on profile (`surface: shelf`, hide library meta).  
- Extract `SellerProductTile`; You page import unchanged visually.  
- Own/visitor ⋯ via existing helpers/sheets.  
- Shop dock on Home when selecting; Message disabled if owner.  
- Keep first-tab-with-content; do not override a manual tab.

## Explicitly deferred / rejected

- Catalogs tab, new APIs/DB, new menu implementations, drafts on profile, Showcase changes.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
