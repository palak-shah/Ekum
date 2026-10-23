# Feature Completeness Review — Designs via collection only (no You +)

**Date:** 2026-10-22  
**Module / ask:** Remove **+** on You **Designs**. Traders add photos through a **collection**, not a second solo-design create path.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Two create doors (You Designs **+** vs collection Photos) trains a first-time seller to hunt. Nav **＋** already opens Collection. Cut the Designs **+**. Library still lists designs that collections create. |
| UX Designer | Same job → one door. Empty Designs copy points at a collection, not a second Add sheet (**Single design** / **Collection**). Collection empty-library CTA is **Add photos**, not hop to solo add. |
| Solution Architect | Keep `/catalog/products/new` for now (e2e / leftover deep links). Stop linking it from You Designs **+**, Home empty add, and collection picker empty. No schema change. |

---

## Platform consistency (required)

1. **Existing patterns?** Nav **＋** → Collection sheet; collection **Photos** = new designs.  
2. **Duplicates another feature?** Yes — You Designs **+** duplicates collection Photos. Cut it.  
3. **Should reuse an existing workflow?** Collection create / album Add photos.  
4. **Naming matches the app?** New collection · Add photos. Not Seller/Buyer.  
5. **Units?** N/A.

**Philosophy conflict?** No — fewer taps, one create path.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Remove Designs + ; empty copy → collection |
| Business rules | OK | Designs still exist; they are born in a collection |
| Workflows | OK | Nav ＋ / You Collections New collection / album Photos |
| Edge cases | OK | Empty library in Add designs sheet → Add photos |
| Permissions | OK | |
| User states | OK | Empty Designs / empty draft |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | One less chrome control |
| First glance (BM-11) | OK | Designs tab is the library, not a second create |
| Units | N/A | |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Remove You Designs **+** and the **What are you posting?** sheet it opened.  
- Empty Designs (draft) does not offer solo Add. Copy points at collections.  
- Home empty “Add designs” goes to **New collection**.  
- Collection picker with an empty library: **Add photos** (camera), not `/catalog/products/new`.  
- Solo add route may remain unlinked this slice.

## Explicitly deferred / rejected

- Deleting `/catalog/products/new` (DesignBatchPage) this slice.  
- Hiding Designs tab.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
