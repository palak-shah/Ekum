# Feature Completeness Review — Own profile view then Edit

**Date:** 2026-09-30  
**Module / ask:** Business profile is read-only until **Edit profile** at the end. Then fields edit and the CTA is **Update**. Hide bottom nav while editing.  
**Anchors:** `docs/features/company.md`, `docs/features/settings.md`, ui-quality-bar (one job; hide chrome on focused edit)  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Looking at the shop card is not the same job as changing GST. View first. Edit is an explicit tap. |
| UX Designer | View: values as text, **Edit profile** last. Edit: same fields, **Update**, Back leaves edit. Hide tab bar (same as New collection). Home → Profile = view. Own shop **Edit profile** and Explore `focus=sell` open already editing. |
| Solution Architect | `?edit=1` (and existing `focus=sell`) drive edit + `shouldHideAppNav`. Save exits edit. |

---

## Platform consistency (required)

1. **Existing patterns?** PageHeader Back; kit Button; hide nav on focused create/edit.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same PATCH `/companies/me`.  
4. **Naming matches the app?** **Edit profile** / **Update** (not Save profile).

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | View / edit |
| Business rules | OK | Same required fields on Update |
| Workflows | OK | Back exits edit |
| Edge cases | OK | Empty → — |
| Permissions | OK | Own company only |
| User states | OK | |
| Notifications | N/A | Toast on Update |
| Error handling | OK | Inline on About |
| Scalability | N/A | |
| Mobile interactions | OK | Nav hidden; last CTA not clipped (pb-8) |
| Accessibility | OK | Buttons named |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- `/settings/profile` view-only until **Edit profile**.
- Edit: fields + logo + sticky **Update** dock (collection-edit band); bottom nav hidden (`?edit=1` or `focus=sell`).
- Own shop **Edit profile** opens `?edit=1`. Home **Profile** stays view.
- Update success returns to view.

## Explicitly deferred / rejected

- A separate Cancel button (Back exits edit).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
