# Feature Completeness Review — Collection Item / Quality tags (multi)

**Date:** 2026-10-06  
**Module / ask:** New collection and edit collection: Item and Quality/work always allow multiple picks; labels use the word **tags**.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`, `docs/features/settings.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | A pack is often several items (kurti + dupatta) and several finishes. One typeahead that replaces the previous pick fights that job. Size stays one optional cue. |
| UX Designer | Keep cascade typeaheads (not the TagsField sheet). Foam chips + ×; pick stays open so they can add another. Labels: **Item tags**, **Quality / work tags**. Size stays **Size**. |
| Solution Architect | Still flatten to `categories[]` (max 20) for search. Session source of truth is slot arrays so custom quality tags do not jump fields. Reload classifies official labels; leftover custom → Item tags. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Field + typeahead; foam chips + explicit × (TagsField / photo remove).  
2. **Duplicates another feature?** No — same pack form, multi instead of one string per slot.  
3. **Should reuse an existing workflow?** Reuse cascade suggestions; do not reopen the tag-picker sheet on this form.  
4. **Naming matches the app?** **tags** in the slot names. Not Categories.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Multi Item tags + Quality / work tags; Size single |
| Business rules | OK | Union flatten; cap 20; apply-all still unions |
| Workflows | OK | Create + edit + member sheet |
| Edge cases | OK | Custom stays in the slot during the session |
| Permissions | N/A | Own catalog |
| User states | OK | Empty chips + typeahead |
| Notifications | N/A | |
| Error handling | OK | Cap: extra picks ignored |
| Scalability | OK | Same taxonomy |
| Mobile interactions | OK | Sticky dock unchanged (BM-07) |
| First glance (BM-11) | OK | Add designs still loudest; tags stay under Product description |
| Accessibility | OK | Chip × labelled Remove {tag}; field labels |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Collection create/edit + member design sheet: **Item tags** and **Quality / work tags** are multi-select typeaheads (chips, list stays open). **Size** stays one optional typeahead.  
- Flatten to existing `categories[]`.  
- Docs + units (cascade + suggest input).

## Explicitly deferred / rejected

- TagsField sheet on this pack form  
- Size as multi  
- Schema change for separate slot columns  
- Perfect reload of custom quality-only tags (classified as Item tags)

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (existing collection publish journey still covers the item field)  
