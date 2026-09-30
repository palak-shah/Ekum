# Feature Completeness Review — Shop Share on Business profile

**Date:** 2026-09-30  
**Module / ask:** Shop **Share** icon must sit on **Business profile**, not on You / My Collections.  
**Anchors:** `docs/features/settings.md`, `docs/features/company.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | You is the library. Sharing the shop is a profile job — same as a visitor shop header. Collections stay about packs, not “share my business.” |
| UX Designer | PageHeader **Share** on `/settings/profile` (same icon + `CompanyShareSheet` as a shop). You shell is **Back · You** only. No extra chrome row. Hide Share while editing so Update owns the band. |
| Solution Architect | Drop `YouHeaderShare` from AppShell `/more`. Mount it on `ProfilePage` `action`. Same sheet. |

---

## Platform consistency (required)

1. **Existing patterns?** Shop header Share; profile PageHeader action slot.  
2. **Duplicates another feature?** Own shop `/company/:id` already has Share — same sheet. Fine.  
3. **Should reuse an existing workflow?** `YouHeaderShare` + `CompanyShareSheet`.  
4. **Naming matches the app?** **Share**. Title **Business profile**.

**Philosophy conflict?** No — earlier You Share treated You as the shop card. You is library now.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Share shop from profile. |
| Business rules | OK | Same chat + OS share as shop. |
| Workflows | OK | Home avatar → Profile → Share. |
| Edge cases | OK | Disabled until company id; hidden in edit. |
| Permissions | N/A | Own profile only. |
| User states | OK | Buyer and seller. |
| Notifications | N/A | |
| Error handling | N/A | Sheet already handles. |
| Scalability | N/A | |
| Mobile interactions | OK | One header row; edit dock unchanged (BM-07). |
| Accessibility | OK | aria-label Share. |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Remove Share from You (`/more`).  
- Business profile view: Share in PageHeader. Hidden while `?edit=1`.

## Explicitly deferred / rejected

- Removing Share from public shop (`/company/:id`).  
- Pack Share on album ⋯ (different job).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
