# Feature Completeness Review — You: no paired trailing actions

**Date:** 2026-09-24  
**Module / ask:** Edit+Share and Grid+Add side by side look wrong  
**Anchors:** `docs/features/settings.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Identity stays Edit and Share. Library stays Feed/Grid + Add. Pairing them as equal buttons fights “one trailing action.” |
| UX Designer | Edit · Share as one quiet text line under the name (same · as city). Tab row: pills + Add (or Cancel). Grid pinned after the chip rail, not beside Add. |
| Solution Architect | No new routes. Reuse share sheet and catalog layout storage. |

---

## Platform consistency (required)

1. **Existing patterns?** List chrome = one trailing control. City line already uses ·.  
2. **Duplicates another feature?** No.  
3. **Should reuse?** Company share sheet; catalog layout toggle.  
4. **Naming matches the app?** Edit, Share, Grid/Feed, Add.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same actions |
| Business rules | N/A | |
| Workflows | OK | |
| Edge cases | OK | Buyers: Grid on Saved kind row only |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Chip rail still scrolls; Grid stays pinned |
| Accessibility | OK | Same testids |
| Platform consistency | OK | |

---

## Approved scope for this slice

- You identity: `Edit · Share` text actions, not a button pair.
- You library: Designs/Collections + Add (or Cancel). Feed/Grid pinned beside the status chip rail.

## Explicitly deferred / rejected

- Moving Share or Grid into ⋯.

## Sign-off

Required gaps closed: Yes. Ready: Yes.
