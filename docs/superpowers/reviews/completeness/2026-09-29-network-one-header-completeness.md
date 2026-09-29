# Feature Completeness Review — Network one header

**Date:** 2026-09-29  
**Module / ask:** Hub showed shell **Network** plus PageHeader **Network**. Keep Back · Network on the top band only.  
**Anchors:** `docs/features/access-and-connections.md`, `docs/features/settings.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | You → Network is a nested desk, not a tab root. One title. |
| UX Designer | Same as Settings: hide shell band; PageHeader is flush top with Back. Nested I see theirs / They see mine / Connections already have their own PageHeader. |
| Solution Architect | `pageOwnsTopChrome('/network…')` + `shellTitle` null. No API. |

## Platform consistency

1. **Existing patterns?** Yes — Settings / catalog / referrals.  
2. **Duplicates?** No — removes a duplicate.  
3. **Reuse?** Yes — existing PageHeader.  
4. **Naming?** Network.

**Philosophy conflict?** No.

## Checklist scan

All OK / N/A. No extra sticky bar. Back on the remaining header.

## Approved scope

- `/network` (and nested) own top chrome; no shell **Network** title.  
- Keep PageHeader Back · title on hub and child lists.

## Sign-off

Required gaps closed: Yes  
Ready: Yes  
