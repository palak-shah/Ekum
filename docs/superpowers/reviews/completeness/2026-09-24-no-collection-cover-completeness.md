# Feature Completeness Review — No collection cover photo

**Date:** 2026-09-24  
**Module / ask:** Drop the pack **cover** concept. A collection is only its designs.  
**Anchors:** `docs/features/collections.md`, `docs/features/company.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Cover was a second photo next to members. Traders already think in designs. Mosaic +N must stay design-based. |
| UX Designer | No “First item is the cover”, no Cover chip. Album = member grid. Mosaic = first photo of each design. |
| Solution Architect | `coverImage` column stays as a silent first-design thumb for chat/OG. Previews never prepend it. No schema drop this slice. |

## Platform consistency

1. Matches “membership is always designs.”  
2. Does not add a new picker.  
3. Reuse AlbumGrid / collection preview.  
4. Naming: designs only — no Cover.

**Philosophy conflict?** No.

## Approved scope

- Editor: remove cover tip and Cover badge.  
- Preview builder: first photo per member design only (not pack cover, not extra shots).  
- Album viewer: no standalone cover banner.  
- Shop / Saved / tiles: design thumbs only.  
- Docs + units + collection create e2e (no Cover copy).

## Explicitly deferred

- Drop `coverImage` column / DTO. Chat/OG still read the derived field.

## Sign-off

Required gaps closed: Yes. Ready: Yes.
