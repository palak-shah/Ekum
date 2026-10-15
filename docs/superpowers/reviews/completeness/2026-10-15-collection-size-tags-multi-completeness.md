# Feature Completeness Review — Collection Size tags (multi) + set-contains UX

**Date:** 2026-10-15  
**Module / ask:** Create/edit collection: Size becomes multi-select **Size tags** (same as Item/Quality). **1 set contains** placeholder tracks dispatch/rate-per unit (`4 pc`); order unit **dozen** autofills `12` when empty (editable).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`, `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Packs often cover several sizes (S–XL, Free Size + Custom). Single Size fought that job — deferred in 2026-10-06; lift now. Set contents should hint in the same unit as rate-per; dozen already means 12 in billing — show it. |
| UX Designer | Keep cascade typeaheads; foam chips + ×; list stays open. Label **Size tags**. Viewer joins with · like Item/Quality. Placeholder `4 {dispatch}` (not “e.g. 4”). Dozen prefill 12, still editable — no locked field. |
| Solution Architect | Still flatten to `categories[]` (max 20). `TagSlots.sizes: string[]`; reload collects all official sizes into Size tags (no longer first-only spill into Item). `piecesPerPack` stays a bare number string. |

---

## Platform consistency (required)

1. **Existing patterns?** Same cascade + chips as Item/Quality tags; OrderDispatchFields for sell-as.  
2. **Duplicates another feature?** No — lifts deferred Size multi; clarifies set-contains cue already implied by billing.  
3. **Should reuse an existing workflow?** Reuse `TagSuggestInput` multi default; reuse dispatch unit as rate-per.  
4. **Naming matches the app?** **Size tags** (with Item tags / Quality tags). Not Categories. Set contains stays pack language.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Multi Size tags; placeholder + dozen autofill |
| Business rules | OK | Cap 20 across slots; dozen=12 when empty; do not overwrite typed pack size |
| Workflows | OK | Create + edit + member sheet + Catalog defaults (shared OrderDispatchFields) |
| Edge cases | OK | Switch to dozen with existing value kept; custom size tags stay in slot |
| Permissions | N/A | Own catalog |
| User states | OK | Empty chips; empty set-contains shows unit placeholder |
| Notifications | N/A | |
| Error handling | OK | Cap ignores extra tag picks |
| Scalability | OK | Same taxonomy / categories[] |
| Mobile interactions | OK | Sticky dock unchanged (BM-07) |
| First glance (BM-11) | OK | Add designs still loudest; tags under description; set-contains quieter |
| Accessibility | OK | Chip × Remove; field labels |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Collection create/edit + member design sheet: **Size tags** multi-select (chips, list stays open), label **Size tags**.  
- Flatten to existing `categories[]`; `TagSlots.sizes: string[]`; reload all official sizes into Size tags.  
- Album / DesignSheet pack details: labeled **Size tags**; join with · ; omit when empty.  
- **1 set contains** (and dozen/box/bundle siblings): placeholder `4 {dispatchUnit}`; selecting **dozen** with empty field sets `12` (editable).  
- Docs + units.

## Explicitly deferred / rejected

- TagsField sheet on this pack form  
- Schema change for separate slot columns  
- Persisting `"12 pc"` as the piecesPerPack value  
- Overwriting a non-empty set-contains when switching to dozen  
- Perfect reload of custom quality-only / size-only tags that are not in official pools (stay Item tags)

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
