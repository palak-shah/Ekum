# Feature Completeness Review — Purge collection orderPathPreference

**Date:** 2026-09-08  
**Module / ask:** Stop writing/reading `Collection.orderPathPreference` for path; curated = from-pack. Column stay.  
**Anchors:** `orders.md`, `collections.md`, unified-main-linked-lots, remove-profile-order-path  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Removes dead pack path stamp; aligns with TradeLane + from-pack. |
| UX Designer | No new chrome; pack Order always “to trader” for curated. |
| Solution Architect | Web stop write/read; API keep column; serializers may still expose. |

---

## Platform consistency (required)

1. **Existing patterns?** Path = Your paths / order switches.  
2. **Duplicates?** Removes duplicate pack-level path.  
3. **Reuse?** TradeLane.  
4. **Naming?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Stop write/read |
| Business rules | OK | Curated → from-pack |
| Workflows | OK | Publish Who/Rules only |
| Edge cases | OK | Stale DB values ignored |
| Permissions | N/A | |
| Mobile / BM-07 | N/A | |
| Platform consistency | OK | |

---

## Approved scope

- Web: remove publish state/DTO stamps; pack viewer/explore/resolve ignore collection field.  
- Chat: stop new metadata stamps for pack path.  
- Docs + journey matrix #11.  
- Column drop deferred.

## Explicitly deferred

- Prisma drop `Collection.orderPathPreference`.  
- Removing field from domain-types / API serializers entirely.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
