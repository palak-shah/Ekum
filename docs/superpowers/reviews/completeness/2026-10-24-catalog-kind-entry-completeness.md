# Feature Completeness Review — Catalog vs collection create (kind from entry)

**Date:** 2026-10-24  
**Module / ask:** New collection vs New catalog are separate entries. Drop “Treat this collection as a catalog?”. Catalog create: exclusive General Collection picker, exclusive why-block, order-as-whole / pick-and-choose, Catalog name, rest same as collection. Collection create hides catalog chrome. Catalog-member design edit is photos / name / notes. Add/edit design rate is one amount. Designs ＋ filled teal square.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`  
**Disposition:** Proceed (Redesign of “same editor + Treat as catalog?”)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Kind is the You entry. Own designs in a catalog are exclusive; the picker is General Collection leftovers (not in any pack). Orders on a catalog follow that catalog’s whole / pick — mill send-as-bunch and trader curate of mill IDs both order that way. |
| UX Designer | Same CollectionEditorPage, no checkbox. Catalog create: chooser → exclusive Card → order-mode → Catalog name* → rest. Collection create: no exclusive note, no order-mode. Catalog-member editor is quiet (photos, name, notes). Designs ＋ filled 40×40 like Chats. |
| Solution Architect | API already `CATALOG_EXCLUSIVE` for own designs. Persist `orderMode` on catalog PATCH. Freeze `kind`. Curate still reuses mill product IDs (owner check skipped). |

---

## Platform consistency (required)

1. **Existing patterns?** You tabs, CollectionEditorPage, kit Card, order-mode pill, ListSquareButton, RateRangeFields `fixedOnly`.  
2. **Duplicates another feature?** No — two entries, one editor.  
3. **Should reuse an existing workflow?** Yes — `?kind=catalog` already routes New catalog.  
4. **Naming matches the app?** Catalog name · Order as whole · Pick and choose · General Collection.  
5. **Units?** Design add/edit: whose = design, which = Rate per, one amount. Pack Rate on collection/catalog create may still be a range. Catalog members inherit catalog rate/units on stamp.

**Philosophy conflict?** Yes vs “same editor + Treat as catalog?” — **Redesign** that line. Exclusivity for **own** designs vs any other own pack is already API; picker UI must match. Global exclusivity that would block mill→trader curate stays **Rejected**.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Kind from entry; exclusive picker; slim catalog design edit |
| Business rules | OK | Own exclusive; GC leftovers; foreign curate OK; orderMode on catalog |
| Workflows | OK | New catalog / New collection / Designs ＋ / album Add |
| Edge cases | OK | Remove from catalog → GC; AddToPack hides illegal targets |
| Permissions | OK | `uploads`; existing owned() |
| User states | OK | Create vs edit titles; catalog edit hydrates orderMode |
| Notifications | N/A | |
| Error handling | OK | `CATALOG_EXCLUSIVE` toast |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky that clips (BM-07 N/A) |
| First glance (BM-11) | OK | Catalog name + chooser loudest; exclusive Card is why, not a second title |
| Units (order / dispatch / Rate per) | OK | Catalog stamps pack onto own members; design editor hidden fields re-sent |
| Accessibility | OK | Existing pills + aria-labels |
| Platform consistency | OK | After Redesign |

---

## Gaps

### G-001 — Treat-as checkbox vs two entries

| Field | Content |
|-------|---------|
| Gap | Create still asks Treat as catalog? Order mode hidden on edit; PATCH ignores orderMode. |
| Why it matters | New catalog / New collection already exist. Checkbox is a second path. |
| Impact if ignored | Traders flip kind by accident; Whole/Pick does not save on edit. |
| Recommendation | Kind from URL/existing. Persist orderMode on catalog update. Drop checkbox. |
| Priority | Required before implementation |

### G-002 — Catalog picker / design editor still look like a collection

| Field | Content |
|-------|---------|
| Gap | Viewer Add designs skips exclusive filter. Product editor ignores catalogCollectionId. Add designs still accepts 1200-1400. |
| Why it matters | Catalog members must follow catalog category/rates/dispatch. Own designs in a pack must not appear in the catalog picker. |
| Impact if ignored | Dual membership in the UI; catalog design form fights the stamp. |
| Recommendation | Picker = General Collection leftovers. Catalog-member editor = photos, name, notes. Batch rate = one amount. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Kind from New collection vs New catalog (`?kind=catalog`). No treat-as checkbox.  
- Catalog create: exclusive Card + order-mode + Catalog name*; picker = GC leftovers.  
- Collection create: no catalog chrome.  
- Persist `orderMode` on catalog PATCH. Freeze kind.  
- Album Add designs uses `libraryDesignsEligibleForPack`. AddToPack hides illegal targets.  
- Designs ＋ filled accent square.  
- DesignBatchPage one rate (`rateMax: null`). Catalog-member ProductEditor: photos, name, notes; re-send hidden fields. Catalog member sheet on the editor: same slim fields.

## Explicitly deferred / rejected

- Nav ＋ New catalog.  
- Deleting `/catalog/products/new`.  
- Global exclusivity that would block mill→trader curate.  
- Changing pack Rate One rate / A range on collection/catalog create.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
