# Feature Completeness Review — Login phone typing (iOS Home Screen)

**Date:** 2026-09-25  
**Module / ask:** Trader cannot type a mobile number on login (Home Screen screenshot: field has a short prefix, Continue stays disabled).  
**Anchors:** `docs/features/auth.md`, `docs/features/settings.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Login is one job: type phone → Continue. A silent Home Screen reload (added so the icon can pick up a deploy) must not wipe or steal that field. |
| UX Designer | Keep the existing tel field and teal box. No extra chrome. Continue still waits for 10 characters. Do not autofocus the phone field on first paint (iOS PWA often focuses without a working keyboard). |
| Solution Architect | Home Screen one-shot cache-drop reload stays, but not on `/login` or `/onboarding`, and not while an input is focused. Persist the one-shot key in `localStorage` (iOS standalone often drops `sessionStorage` on reload → loop). Retry after they leave login via the existing 20s / focus checks. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit `Field` + `TextInput`; same OTP step.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — phone OTP as today.  
4. **Naming matches the app?** Mobile number / Continue.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Type any phone characters; Continue at 10+ trimmed |
| Business rules | OK | OTP unchanged |
| Workflows | OK | Home Screen deploy still applies after login |
| Edge cases | OK | Skip reload while typing; one-shot key only after a real apply |
| Permissions | N/A | |
| User states | OK | Signed-out login |
| Notifications | N/A | |
| Error handling | OK | API errors stay in-field |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky chrome (BM-07 N/A) |
| Accessibility | OK | Label still wraps the input |
| Platform consistency | OK | Kit field |

---

## Gaps

None required.

## Approved scope for this slice

- Stop Home Screen silent reload on login / onboarding and while a field is focused.
- One-shot key in `localStorage`.
- Login phone: `tel` + `inputMode=tel`, no page-load autofocus; inputs `user-select: text`.
- Units for the reload guards and the login field.

## Explicitly deferred / rejected

- Changing Continue length rules.
- Deleting the Home Screen icon as the update path.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units; existing login e2e already fills Mobile number)
