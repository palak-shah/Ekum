# Feature Completeness Review — Edit collection details only

**Date:** 2026-10-10  
**Module / ask:** Remove designs grid / Add designs from Edit collection — membership already on album.  
**Anchors:** `docs/features/collections.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Edit was two jobs (members + details). Album already Add / Replace / remove. Edit = pack details + Update. |
| UX Designer | One job per screen. Create keeps the album builder. |
| Solution Architect | Hide edit-mode grid only; keep selected members in state for Apply / save; album boot pickers unchanged. |

## Platform consistency

1. Matches “Edit collection details” naming.  
2. No duplicate membership chrome.  
3. Reuse album manage dock.  
4. Naming unchanged.

**Philosophy conflict?** No — removes clutter.

## Approved scope

- Edit page: identity fields + Update only (no member grid / AddDesigns / Diff tip).  
- Docs + gap matrix + dock comment.  
- Tests that assumed edit-page member tiles.

## Explicitly deferred

- Keep Add designs fully on album without routing through editor.
