# Feature Completeness Review — Explore search: drop GST

**Date:** 2026-09-24  
**Module / ask:** Client UI sheet — Explore feed / empty search / header+field still say GST  
**Anchors:** `docs/features/explore.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Copy only. GST stays a profile / Find-on-Ekum lookup, not Explore chrome.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Explore find is supplier / pack / design. GST number is a shop identity field. |
| UX Designer | One hint on idle bar and focused field. No second GST header. |
| Solution Architect | Shared `EXPLORE_SEARCH_HINT`. Search API may still match a typed GST. |

---

## Platform consistency (required)

1. **Existing patterns?** List search chrome; one placeholder.  
2. **Duplicates?** No. Find on Ekum keeps GST.  
3. **Reuse?** Same string both lines.  
4. **Naming?** Plain: supplier, collection, design.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hint only |
| Business rules | OK | |
| Workflows | OK | |
| Edge cases | OK | Empty + typed |
| Permissions | N/A | |
| User states | OK | Idle + focused |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | |
| Accessibility | OK | Same `aria-label="Search"` |
| Platform consistency | OK | |

---

## Approved scope

- Remove GST from Explore idle bar and focused field.  
- One shared hint: **Search supplier, collection or design**.

## Explicitly deferred / rejected

- Changing Find on Ekum / billing GST copy.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (`explore.journey` asserts no GST)  
