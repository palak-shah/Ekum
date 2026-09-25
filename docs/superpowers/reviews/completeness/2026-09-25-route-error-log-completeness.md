# Feature Completeness Review — Crash page shows a sendable log

**Date:** 2026-09-25  
**Module / ask:** Page crash shows only “Something went wrong”; traders/devs cannot send the real error (e.g. `itemMeta is not defined`) without a desktop console.  
**Anchors:** `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Keep the plain why-line. Add a small “Send this” box so they can screenshot or copy the real error. |
| UX Designer | Same error page chrome (ErrorState + Go home / Try again). Kit Field + read-only TextArea + Copy — same as 48h share fallback. No new debug overlay for all traders. |
| Solution Architect | Extract `name: message` (+ two stack frames) from React Router’s error. Do not send to a server this slice. |

---

## Platform consistency (required)

1. **Existing patterns?** Route error page + kit Field / TextArea / Button.  
2. **Duplicates another feature?** Debug API panel stays `ekum.debug` only.  
3. **Should reuse an existing workflow?** Copy button like share fallback.  
4. **Naming matches the app?** “Send this to Ekum” — not “stack trace”.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Detail on unexpected crashes; 404 stays clean |
| Business rules | N/A | |
| Workflows | OK | Copy / screenshot |
| Edge cases | OK | Non-Error values stringify |
| Permissions | N/A | |
| User states | OK | Any signed-in/out route crash |
| Notifications | N/A | |
| Error handling | OK | This is the handler |
| Scalability | N/A | |
| Mobile interactions | OK | No extra sticky chrome (BM-07 N/A) |
| Accessibility | OK | Label + selectable text |
| Platform consistency | OK | Kit field |

---

## Gaps

None required.

## Approved scope for this slice

- `routeErrorDetail` + copyable box on `RouteErrorPage` (not the 404 splat).
- Units for ReferenceError-style messages.

## Explicitly deferred / rejected

- Remote crash reporting.
- Showing the box on 404.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units)
