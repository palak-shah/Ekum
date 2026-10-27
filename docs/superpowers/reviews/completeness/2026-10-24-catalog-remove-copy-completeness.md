# Feature Completeness Review — catalog remove copy + leftover return

**Date:** 2026-10-24  
**Module / ask:** Catalog album Remove says **Remove from this catalog** (not collection). Own design removed from its only regular collection or catalog must sit in General Collection.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Catalog vs collection is already the You split. The remove verb on a catalog album must use catalog. Leftovers are computed: leave the last qualifying pack → General Collection. |
| UX Designer | Same ⋯ row, same order. Only the noun changes. Toast matches: **Removed from catalog**. Do not rename Share / Find / Delete selected. |
| Solution Architect | Remove must PUT remaining **owner** members (including drafts hidden on the published album), then refetch every `collection-preview` so GC is not a 60s stale empty. |

---

## Platform consistency (required)

1. **Existing patterns?** Catalog name, New catalog, Delete this catalog?, In your catalog. Remove follows that noun.  
2. **Duplicates another feature?** No — same Remove, correct word.  
3. **Should reuse an existing workflow?** Album Select ⋯ / design sheet ⋯ / draft editor select dock.  
4. **Naming matches the app?** Catalog on catalog albums; collection on regular. Plain trader words.  
5. **Units?** N/A

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Remove membership; leftover → GC |
| Business rules | OK | Qualifying join gone → GC. Draft members of the pack stay unless they were the remove target. |
| Workflows | OK | Select ⋯ · design ⋯ · editor select Remove |
| Edge cases | OK | Last design in the pack; drafts hidden on published album must not be wiped by a published-only PUT |
| Permissions | OK | Owner only |
| User states | OK | |
| Notifications | N/A | Toast only |
| Error handling | OK | Failed PUT keeps membership; invalidate after successful PUT even if tag stamp fails |
| Scalability | N/A | Extra owner GET on remove |
| Mobile interactions | OK | Same ⋯ sheet |
| First glance (BM-11) | OK | Catalog album must not say collection on Remove |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Same button, new name |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Catalog: **Remove from this catalog** + **Removed from catalog** (Select ⋯, design ⋯, editor select dock).
- Regular stays **Remove from this collection**.
- Remove uses full owner membership, then invalidates GC / You lists.
- Sole-pack leftover appears in General Collection.

## Explicitly deferred / rejected

- Share / Find / Replace entire collection / Ask to see this collection stay “collection” until a later naming pass.
- Hide (draft the design) is not Remove — unpublished members stay out of GC on purpose.
