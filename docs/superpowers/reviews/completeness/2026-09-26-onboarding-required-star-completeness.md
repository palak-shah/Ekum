# Feature Completeness Review — onboarding required stars

**Date:** 2026-09-26  
**Module / ask:** Mark onboarding **name / company / city** as required with `*` before submit.  
**Anchors:** `docs/features/onboarding.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Every field that blocks Create shows **\*** — business name, contact person, city, and at least one type. |
| UX Designer | Kit `Field` `required` → label + red `*`. Same Field as the rest of the app. No new hint paragraph. |
| Solution Architect | No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit `Field`.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes.  
4. **Naming matches the app?** Business name · Contact person · City.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Visual only |
| Business rules | OK | Already required |
| Workflows | OK | |
| Edge cases | N/A | |
| Permissions | N/A | |
| User states | OK | Onboarding only |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | |
| Accessibility | OK | Visible star on the label |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Kit `Field` `required` shows `*`
- Onboarding: Business name, Contact person, City, What do you deal in?

## Explicitly deferred / rejected

- Profile edit stars

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes (unit; no behaviour change)
