# Feature Completeness Review — Collection mosaic +N

**Date:** 2026-09-24  
**Module / ask:** Shop/Explore mosaic showed +3 on a 5-design pack (photo inventory, not designs).  
**Anchors:** `docs/features/collections.md`, `docs/features/company.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Caption is **N designs**. Overlay must be leftover **designs**, not every extra photo + cover. |
| UX Designer | 2×2 stays. 4th cell +N = designs beyond the four thumbs (`productCount - 4`). Five designs → **+1**. |
| Solution Architect | Client mosaic count helper. `imageCount` still means photos for My Catalog “N photos”. |

## Platform consistency

1. Same +N as My Catalog / Saved: productCount when 4 thumbs exist.  
2. No new chrome.  
3. Reuse AlbumGrid.  
4. Naming unchanged.

**Philosophy conflict?** No.

## Approved scope

- Collection mosaics pass design count for +N.  
- Overlay is remaining after 4 cells (`count - 4`).  
- Units for the helper; no API change.

## Sign-off

Required gaps closed: Yes. Ready: Yes.
