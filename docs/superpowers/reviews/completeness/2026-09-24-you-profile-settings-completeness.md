# Feature Completeness Review — You: Edit, Share, library; Settings groups

**Date:** 2026-09-24  
**Module / ask:** Profile muscle memory + Settings grouping without Instagram You  
**Anchors:** `docs/features/settings.md`, `docs/features/catalog.md`, `docs/features/company.md`  
**Disposition:** Proceed (approved Redesign of the original one-screen Profile brief)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | You = identity + manage library. Shop = public preview. Settings = Team, paths, addresses, billing. |
| UX Designer | Edit + Share on identity. Catalog chrome reused on You (no second “My designs” title). Settings = quiet sections, not cards. |
| Solution Architect | Embed `MyCatalogPage`; `/catalog` list redirects to You. Reuse CompanyShareSheet. |

---

## Platform consistency (required)

1. **Existing patterns?** PageHeader, kit Button, You chevron rows, catalog tabs/chips.  
2. **Duplicates another feature?** Shop grids stay on `/company/:id`. Library only on You.  
3. **Should reuse an existing workflow?** Yes — catalog, share sheet, profile form, Team, Your paths.  
4. **Naming matches the app?** Edit / Share / Settings / You.

**Philosophy conflict?** No (after Redesign).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Buyers: no library |
| Workflows | OK | |
| Edge cases | OK | `/catalog` query preserved |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | OK | |
| Mobile interactions | OK | Library select dock; hide floater on You |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Approved scope for this slice

- You: Edit, Share, embedded library, Saved + Network + Settings.
- Settings: Team, Your paths (trading), Dispatch, Billing.
- `/catalog` list → You. Own shop Edit.

## Explicitly deferred / rejected

- Empty Settings domains. Return policy / notification type mutes. Library on shop.

## Sign-off

Required gaps closed: Yes. Ready: Yes.
