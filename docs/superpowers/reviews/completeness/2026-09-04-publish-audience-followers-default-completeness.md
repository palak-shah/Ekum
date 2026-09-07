# Feature Completeness Review — Publish audience Followers default

**Date:** 2026-09-04  
**Module / ask:** Hide **My connections** on Publish/Visibility; default **My followers**  
**Anchors:** `docs/features/00-concepts.md`, design `2026-09-04-publish-audience-followers-default-design.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary |
|------|---------|
| Product Manager | Connections ≠ buyer list; default Followers matches seller intent. Legacy Connections posts stay as-is. |
| UX Designer | Three Who chips only; Selected extras unchanged. |
| Solution Architect | UI + defaults + docs; API enum unchanged. |

## Platform consistency

1. Existing patterns? Same PublishAudienceFields sheet.  
2. Duplicates? No.  
3. Reuse? Shared fields for design/collection/bulk.  
4. Naming? My followers / Everyone / Selected.

**Philosophy conflict?** Soft update to concepts (default was Connections) — document before ship.

## Checklist

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hide option + default |
| Business rules | OK | Server still enforces all audiences |
| Edge cases | OK | Legacy Connections display only |
| Mobile | OK | Fewer chips |
| Platform consistency | OK | |

## Gaps

None Required. Optional later: migrate or retire API `connections`.

## Approved scope

- UI options + defaults as in design A  
- Docs update  
- Unit coverage for defaults / option list  

## Sign-off

Ready for implementation: Yes  
