# Feature Completeness Review — Home-only bell and You

**Date:** 2026-09-25  
**Module / ask:** Remove Notifications + profile avatar from every shell page except Home.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/settings.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Everyday lists (Chats / Explore / Orders) keep one job. You and Notifications stay reachable from Home. |
| UX Designer | Chats keeps header ⋯. You keeps its ⋯. No second avatar on `/more`. |
| Solution Architect | `AppShell` gates chrome on `pathname === '/'`. Network stays under Settings. |

---

## Platform consistency (required)

1. **Existing patterns?** Shell header + PageHeader on detail.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Home avatar → You → Settings → Network.  
4. **Naming matches the app?** Bell / You unchanged.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Home keeps both controls |
| Business rules | N/A | |
| Workflows | OK | Extra hop to You from Chats |
| Edge cases | OK | Detail pages already hide shell |
| Permissions | N/A | |
| User states | OK | |
| Notifications | OK | Bell only on Home |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Less chrome; BM-07 unchanged |
| Accessibility | OK | aria-labels stay on Home |
| Platform consistency | OK | |

## Approved scope for this slice

- Bell + shop photo only when `pathname === '/'`.

## Explicitly deferred / rejected

- New bottom-nav You tab. Network redesign.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
