# Feature Completeness Review — Category change keeps sell-as

**Date:** 2026-10-17  
**Module / ask:** Changing master category on collection create/edit must not rewrite Order taken in / 1 set contains / Dispatch. Official tags may drop if the new category does not offer them; custom tags stay.  
**Anchors:** `docs/features/collections.md`, `docs/features/catalog.md`, `docs/features/00-concepts.md` (sell-as)  
**Disposition:** Proceed  

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Platform usual is set · (empty contains, placeholder 4 pc) · set. Category is for tags/suggestions — not a silent rewrite of how they sell. |
| UX Designer | No confirm-and-wipe. No toast that units were updated. Quiet prune of stale official tags only. |
| Solution Architect | Remove category→`clampSameForAllUnits` effect. Prune via old/new `master-taxonomy` pools. Blank `piecesPerPack` stays blank. |

---

## Platform consistency (required)

1. **Existing patterns?** Cascade tags + OrderDispatchFields on collection create.  
2. **Duplicates another feature?** No — fixes category side effects.  
3. **Should reuse an existing workflow?** Yes — taxonomy pools already drive CascadeTagsFields.  
4. **Naming matches the app?** Order taken in / 1 set contains / Dispatch unit unchanged.

**Philosophy conflict?** No — fewer surprise resets; sell-as stays trader-controlled.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Units unchanged; prune official-only |
| Business rules | OK | Custom tags kept; blank pack size rule |
| Workflows | OK | Category change without wipe dialog |
| Edge cases | OK | Taxonomy fetch fail → keep tags, still switch |
| Permissions | N/A | |
| User states | OK | Empty category first pick keeps custom |
| Notifications | N/A | |
| Error handling | OK | Soft fail on taxonomy |
| Scalability | N/A | |
| Mobile interactions | OK | No new chrome |
| First glance (BM-11) | OK | Defaults stay set / placeholder 4 pc / set |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Remove category unit clamp + toast on collection editor.  
- Prune official tags against API taxonomy pools; keep custom.  
- Docs + unit tests.

## Explicitly deferred / rejected

- Auto-fill `piecesPerPack` to `4`.  
- Product editor master category.  
- Filtering order/dispatch selects by permitted units.
