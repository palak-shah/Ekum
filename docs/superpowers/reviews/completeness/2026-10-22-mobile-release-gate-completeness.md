# Feature Completeness Review — Mandatory mobile release quality gate (solo)

**Date:** 2026-10-22  
**Module / ask:** Enforce production `pnpm docker:up` so an untested SHA cannot ship. Record Android + iPhone device sign-off for that SHA. Solo developer — no extra branches or reviewers.  
**Anchors:** `docs/docker.md`, `docs/superpowers/qa/mobile-and-pwa-test-matrix.md`, `2026-10-19-mobile-e2e-pwa-gate-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders on phones must not be the first to find a broken dock, upload, or stale PWA. Production ship is the gate, not a green WebKit job. |
| UX Designer | Viewport smoke is useful. Safari / Home Screen / Android Chrome+PWA stay a written device pass. Do not label emulation as iOS OK. |
| Solution Architect | Production path is SSH + `pnpm docker:up`, not GitHub CD. Lock that command when `EKUM_DEPLOYMENT=production`. Reuse Playwright smoke. No second framework. |

---

## Platform consistency (required)

1. **Existing patterns?** `@smoke` / `@functional` / `@release`; Docker identity; matrix honesty rule.  
2. **Duplicates another feature?** No — wraps the existing ship command.  
3. **Should reuse an existing workflow?** Yes — CI preview smoke, docker smoke, Pixel 7 / iPhone 13 WebKit.  
4. **Naming matches the app?** About Ekum, New version · Load.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Evidence JSON + docker-up assert |
| Business rules | N/A | No trade-rule change |
| Workflows | OK | test Docker unchanged; production blocked |
| Edge cases | OK | EXCEPTION skips device, not a red suite |
| Permissions | OK | Solo records own exception |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | OK | Assert exits 1 with SHA / decision |
| Scalability | OK | `@release` not every-push |
| Mobile interactions | OK | Device checklist owns keyboard / safe-area |
| First glance (BM-11) | N/A | Process |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | N/A | |
| Platform consistency | OK | WebKit ≠ iPhone |

---

## Gaps

None Required. Device-only items stay on the checklist (real IME, camera, Home Screen).

---

## Approved scope for this slice

- Completeness + `docs/superpowers/qa/RELEASE.md` + per-SHA evidence.  
- `pnpm release:check` / `signoff` / `exception` / `assert` / `post`.  
- `docker-up` asserts when `EKUM_DEPLOYMENT=production`. No env skip.  
- CI on all branches; RC `workflow_dispatch` for docker smoke + `@release`.  
- Tag existing journeys `@release`; settle submit + second LR in fulfillment.  
- Gate unit tests.

## Explicitly deferred / rejected

- GitHub CD / registry / extra branches / required reviewers.  
- Full `@functional` on WebKit or every push.  
- Auto-rollback. Soft keyboard, HEIC, push-tap, offline Workbox.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — process + `@release` tags.
