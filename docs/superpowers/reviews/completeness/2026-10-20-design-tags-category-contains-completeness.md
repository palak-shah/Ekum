# Feature Completeness Review — Design tags, category, set-contains unit

**Date:** 2026-10-20  
**Module / ask:** Design tags work like collection (suggestions on focus). **1 set contains** shows **n unit** while typing (design + collection). Design in a collection uses that collection’s Category; solo add/edit shows the Category dropdown.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Tags and category are the same job on a pack and a design. Solo add has no pack to inherit, so they pick Category once — otherwise Item tags have no official list. Designs already in a pack must not re-pick Category. |
| UX Designer | Reuse collection **Item / Quality / Size** typeaheads (used first, official, cap 8, close on pick). No second Tags sheet. **1 set contains**: number field + unit suffix (`4` → **4 pcs**), same chrome as Rate ₹. Locked Category is a quiet read-only row, not a disabled fake dropdown. |
| Solution Architect | Official tag pool needs `masterCategoryId`. Pack membership already carries it. Solo designs need `Product.masterCategoryId` (same optional FK as Collection) so re-edit still has taxonomy. `OrderDispatchFields` already shared (collection, member sheet, Catalog defaults) — suffix lives there. |

---

## Platform consistency (required)

1. **Existing patterns?** Collection Category select + `CascadeTagsFields` + `OrderDispatchFields`. Kit Field / TextInput. Rate ₹ prefix → contains unit suffix.  
2. **Duplicates another feature?** No — DesignBatch still used the old Tags sheet; ProductEditor had cascade tags but no Category so the list stayed empty.  
3. **Should reuse an existing workflow?** Yes — same Category + tag fields as New collection; same Order and dispatch fields.  
4. **Naming matches the app?** Category, Item tags, Quality / work tags, Size tags, 1 set contains. Not Seller/Buyer.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Tags; n unit; inherit vs dropdown |
| Business rules | OK | Pack category wins over the design’s stored id while they are in that pack |
| Workflows | OK | You → Add, Edit design, New collection, member sheet |
| Edge cases | OK | Several packs → first pack with a category; no used tags + no category → empty list until they pick Category |
| Permissions | N/A | Own catalog |
| User states | OK | New solo, edit solo, edit in pack, empty contains |
| Notifications | N/A | |
| Error handling | OK | Invalid category id rejected the same way as collection |
| Scalability | OK | One optional FK |
| Mobile interactions | OK | No new sticky chrome (BM-07). Suffix inside the 40px field |
| First glance (BM-11) | OK | Category once; tags typeahead; contains reads as one caption |
| Accessibility | OK | Category select/read-only labelled; contains input + unit |
| Platform consistency | OK | Same kit as collection |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Kit `OrderDispatchFields`: typed count + live unit suffix (`1 pc` / `4 pcs`); empty placeholder `4` with unit beside it.  
- Product `masterCategoryId` (optional, SET NULL). Create/update + `ProductView`.  
- Solo Add/Edit design and Add designs batch: Category dropdown (full catalog; default if Settings deal-in is exactly one) + collection tag typeaheads (replace batch Tags sheet).  
- Design in a collection: Category locked to the pack; no dropdown.  
- Edit design: Order and dispatch (includes **1 set contains**) in Show details, replacing the lone MOQ field. Batch shared/per-design card uses the same Order and dispatch fields.  
- Docs + units + trader-eye.

## Explicitly deferred / rejected

- Asking which pack Category to use when a design is in two packs with different categories (first pack with a category).  
- Category on the collection member sheet (already the pack’s).  
- Changing typed field size (iOS zoom).  
- Optional / “Pick category…” copy.

---

## Decision

**Proceed.**
