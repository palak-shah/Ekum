# Feature Completeness Review — Collection vs catalog copy never interchange

**Date:** 2026-10-27  
**Module / ask:** Catalog surfaces must say **catalog**; collection surfaces must say **collection** — labels, toasts, errors, placeholders. No swapped noun.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | You already splits **Collections** and **Catalogs**. A catalog that says “this collection” teaches the wrong object. Draft/Remove already switch the noun; the rest of chrome must follow. |
| UX Designer | Same job → same sentence, swap only the noun. Catalog name · Update catalog · Share this catalog · Find in this catalog · Enter a catalog name. Collection keeps collection. Allowed mixes stay: **Add to collection / catalog**, **General Collection**, curate-into-your-collection. |
| Solution Architect | One `packKindCopy` helper. Kind from `Collection.kind` or New catalog `?kind=catalog`. API toasts that name “this collection” use the same noun. |

---

## Platform consistency (required)

1. **Existing patterns?** Matches Draft this catalog / Remove from this catalog.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Reuse `isCatalogCollection`.  
4. **Naming matches the app?** Yes — Collections vs Catalogs.  
5. **Units?** N/A — no ₹ / qty string.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Copy only |
| Business rules | OK | Catalog ≠ collection |
| Workflows | OK | New/Edit/album/You/share/publish |
| Edge cases | OK | General Collection stays collection; name clash uses the *existing* pack’s kind |
| Permissions | N/A | |
| User states | OK | Visitor album Share/Find too |
| Notifications | OK | Toasts |
| Error handling | OK | Enter a name, load fail, Who, API publish |
| Scalability | N/A | |
| Mobile interactions | OK | No new chrome |
| First glance (BM-11) | OK | Catalog name field is the tell |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | aria-labels match visible labels |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Catalog chrome still said collection

| Field | Content |
|-------|---------|
| Gap | Update, Share, Find, Who, publish, load error, name clash, picker replace, delete-only-here still said collection on a catalog. |
| Why it matters | Traders think a catalog is a collection. |
| Impact if ignored | Wrong object, wrong list, lost trust. |
| Recommendation | Kind-aware copy helper; lock both nouns in unit tests. |
| Priority | Required before implementation |

Closed by this slice.

---

## Approved scope for this slice

- Owner + visitor pack chrome, editor, You share toast, picker replace hint, delete-only-here, API name/publish errors.
- Tests: catalog strings must not contain `collection` (except allowed phrases); collection strings must not contain `catalog` (except allowed phrases).

## Explicitly deferred / rejected

- Relist / “put in a collection” mill grants (that *is* a collection dest).
- Chat cards that already say collection for a collection share.
- Renaming API error codes (`COLLECTION_NAME_TAKEN`).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
