# Feature Completeness Review — Add to collection / catalog sheet

**Date:** 2026-10-24  
**Module / ask:** Designs **Add to collection / catalog**: published packs only; search; collection multi-select; catalogs only for General Collection leftovers (max one, exclusive). Rows use You-list thumbs. Group Collections then Catalogs — do not stamp “Collection” on every row.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Draft albums are not destinations. Catalog exclusivity is already API. Leftover own designs may join published collections (many) or one published catalog. Pack members may join more published collections, never a catalog. |
| UX Designer | Sheet stays kit Sheet + You album **Find + Select** (`BrowseLotChrome`) + accent-border rows (ConnectionPicker). Thumb is You list `h-16 w-16` CoverImage. One **Collections** heading then one **Catalogs** heading. Quiet Selected — no native checkboxes, no repeating Collection. |
| Solution Architect | Reuse `PUT /collections/:id/products`. Filter `status=published`. Toggle helper: catalog pick clears collections (and vice versa). Sequential PUTs. |

---

## Platform consistency (required)

1. **Existing patterns?** Sheet, BrowseLotChrome (Find + Select all / Clear), accent-border select, You list thumb.  
2. **Duplicates another feature?** No — this is the existing Add to pack door.  
3. **Should reuse an existing workflow?** Yes — membership PUT + exclusivity codes.  
4. **Naming matches the app?** Collection / Catalog / General Collection.  
5. **Units?** N/A.

**Philosophy conflict?** No. Hiding drafts matches You published landing. Catalog still exclusive.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Search, multi collection, one catalog |
| Business rules | OK | Published only; GC leftovers see catalogs |
| Workflows | OK | Design sheet ⋯ and Designs select ⋯ |
| Edge cases | OK | Exclusive member empty; no published empty; Find no match |
| Permissions | OK | Owner library |
| User states | OK | Loading products before listing (else leftovers look empty) |
| Notifications | N/A | Toast on add |
| Error handling | OK | `CATALOG_EXCLUSIVE` |
| Scalability | OK | In-sheet Find, not a second page |
| Mobile interactions | OK | Sheet footer Add; body scrolls (BM-07 Sheet) |
| First glance (BM-11) | OK | Thumb + name; headings once; Find quiet |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | aria-pressed rows |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Drafts and bland text-only rows

| Field | Content |
|-------|---------|
| Gap | Sheet listed every non-deleted pack with a trailing Collection/Catalog label. Single-select. |
| Why it matters | Traders add to live albums. Draft Untitled rows bury the job. Repeating “Collection” is chrome, not meaning. |
| Impact if ignored | Wrong destination; exclusive catalog looks like another collection. |
| Recommendation | Published only. Search. Multi collections. Catalogs only for GC leftovers; max one; exclusive vs collections. You thumbs. Grouped headings. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Filter destinations to **Published** (not Draft / Deleted / General Collection).  
- Find + Select all / Clear in the sheet (`BrowseLotChrome`, same as You). Select all is this filter’s collections only — never bulk-picks a catalog.  
- Collections: multi-select. Catalogs: only when every picked design is a General Collection leftover; at most one catalog; picking a catalog clears collections (and the reverse).  
- Rows: 64px You thumb + name + quiet Selected. Headings **Collections** then **Catalogs**.  
- Add PUTs each selected pack. Toast names collection vs catalog vs N collections.

## Explicitly deferred / rejected

- Adding leftovers to draft albums from this sheet. **Superseded** 2026-10-24-add-to-pack-album-already (drafts listed with a Draft chip).  
- Selecting a catalog and collections in one Add.  
- Nav ＋ New catalog (already deferred).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
