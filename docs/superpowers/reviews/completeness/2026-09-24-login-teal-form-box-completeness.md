# Feature Completeness Review — Login teal form box

**Date:** 2026-09-24  
**Module / ask:** Teal rectangle on login should cover the form as a horizontal box  
**Anchors:** `docs/features/auth.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Visual chrome only. Same OTP job. One **horizontal** rounded box wraps **logo + form**. Fill matches the logo badge teal gradient (not a full-page wash).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One job: phone → OTP. The box frames that job. |
| UX Designer | Full-width **horizontal** rounded box. Logo + fields share the logo-badge teal gradient. White/secondary Continue. |
| Solution Architect | `LoginPage` class wrap only. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit `Field` / `TextInput` / `Button`.  
2. **Duplicates?** No.  
3. **Reuse?** Yes.  
4. **Naming?** Unchanged.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same OTP |
| Business rules | OK | |
| Workflows | OK | |
| Edge cases | OK | Invite line stays above the box |
| Permissions | N/A | |
| User states | OK | Phone + code |
| Notifications | N/A | |
| Error handling | OK | In-field error |
| Scalability | N/A | |
| Mobile interactions | OK | Wide box, not tall |
| Accessibility | OK | Labels stay |
| Platform consistency | OK | Asked teal box |

---

## Approved scope

- Horizontal teal-gradient box around **logo + form**.  
- Tagline under logo: **Textile trade, organised.**
- Continue uses kit secondary (white) on teal.  
- Docs one line.

## Explicitly deferred / rejected

- Teal wash behind the whole page.  
- Changing OTP copy.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (existing auth journey; visual only)  
