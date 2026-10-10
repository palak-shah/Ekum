# Feature Completeness Review — album scan chrome

**Date:** 2026-10-09  
**Module / ask:** Reshape `/collections/:id` visitor scan stack from client protocol (facts, collapsed About, priced grid, Order after Select, ⋯ Message)  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/saved.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One job: scan the lot then Select → Order. Whole pack = Select all. No Ask for rates on album (rates in subtitle/chips). Album-scoped selection avoids Explore pile confusion. |
| UX Designer | Drop loud CompanyRow; shop in subtitle link. Collapsed About matches Explore. Grid rate chip readable (`text-xs`). ⋯ Message · Share · Bookmark; layout icon stays outside. |
| Solution Architect | Reuse shortlist, startChat, How many, BrowseLayoutToggle. Trade dock gated on `thisAlbumCount > 0`. Helpers in `collectionViewerChrome` + `packHeaderSubtitle`. |

---

## Platform consistency (required)

1. **Existing patterns?** Explore About; shop Feed/Grid toggle; shop-scoped selection analogy; kit Order dock.  
2. **Duplicates another feature?** No — chrome reshape of album viewer only.  
3. **Should reuse an existing workflow?** Yes — traveling shortlist, How many, CatalogShareSheet, startChat.  
4. **Naming matches the app?** Message {shop}; About this collection; Curate lock copy when `allowForward` false (Forward/Share still free).

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Scan → Select → Order; Message in ⋯ |
| Business rules | OK | Album-scoped picks; I-handle copy unchanged |
| Workflows | OK | Select all = whole pack |
| Edge cases | OK | Zero picks → no Order; foreign Explore picks hidden |
| Permissions | OK | Quiet note when Curate locked / look-only |
| User states | OK | Owner vs visitor chrome |
| Notifications | N/A | |
| Error handling | OK | Existing order errors |
| Scalability | N/A | |
| Mobile interactions | OK | Order dock clears content when shown; Find not permanent bar |
| First glance (BM-11) | OK | Designs loudest after thin facts |
| Accessibility | OK | About expand aria; layout aria-label |
| Platform consistency | OK | |

---

## Gaps

None Required. Deferred: 3-col grid, always-on Search/Filters, wipe global shortlist, elsewhere badge.

---

## Approved scope for this slice

- Visitor subtitle `N designs · ₹band · from {shop}` (shop link); no CompanyRow  
- Categories facts line; collapsed About  
- Order dock only when this-pack picks > 0; no Ask for rates; no empty→whole-pack How many fallback  
- ⋯ Message · Share · Bookmark (+ quiet note when warranted)  
- Album-scoped float/count/Order lines  
- Grid rate overlay (`text-xs`); 2-col grid  
- Docs + units + trader-eye  

## Explicitly deferred / rejected

- Always-on Search + Filters  
- 3-column grid  
- Ask for rates on album  
- Clearing traveling shortlist on album enter  
- App-wide font root bump  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
