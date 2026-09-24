# Feature Completeness Review — You identity + Settings domains

**Date:** 2026-09-24  
**Module / ask:** Profile = identity + published presence; Edit / Share / Settings stay three jobs; Settings grows by domain cards  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/settings.md`, `docs/features/company.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | You is not Instagram. No follower counts. Edit = manage business/profile/content. Share = Ekum identity. Settings = configure Ekum. |
| UX Designer | Keep identity card + Edit · Share + ⋯. Designs \| Collections use the Chats segment (primary). Status chips stay FilterRail (secondary). Add stays on the tab row. Grid stays on the chip row. |
| Solution Architect | Reusable `SettingsDomainCard` + `settingsDomains()` registry. Ship only domains that exist (Business & Roles, Dispatch, Billing). No empty Privacy / Account cards. |

---

## Platform consistency (required)

1. **Existing patterns?** You identity, CompanyShareSheet, Chats tablist, FilterRail + Chip, Settings chevron rows.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — `/settings/profile`, share sheet, Team, Your paths, addresses, billing.  
4. **Naming matches the app?** Edit, Share, Settings — not Manage Profile.

**Philosophy conflict?** No

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hierarchy + Settings registry only. |
| Business rules | OK | Buyers still have no Designs/Collections library. |
| Workflows | OK | ⋯ → Settings; Edit → profile; Share → sheet. |
| Edge cases | OK | Trading off hides Your paths only. |
| Permissions | OK | Unchanged. |
| User states | OK | |
| Notifications | N/A | No Notifications domain until it exists. |
| Error handling | OK | Existing sheets. |
| Scalability | OK | Add a domain or a link inside one. |
| Mobile interactions | OK | No new sticky chrome (BM-07 N/A). |
| Accessibility | OK | tablist + existing testids. |
| Platform consistency | OK | |

---

## Gaps

None required.

---

## Approved scope for this slice

- You: stronger identity; Edit · Share stay; ⋯ stays secondary.
- Library: Designs \| Collections (Chats segment) + Add; Published / Draft / Archived / Saved + Grid.
- Settings: domain groups + reusable card; existing Team / paths / dispatch / billing only.
- Docs lock Edit ≠ Share ≠ Settings.

## Explicitly deferred / rejected

- Followers / likes / vanity metrics.
- Empty Account, Privacy, Notifications domains.
- Renaming Edit to Manage Profile.
- Redesigning public `/company/:id`.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
