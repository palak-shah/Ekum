# Feature Completeness Review — Mobile / PWA Playwright gate

**Date:** 2026-10-19  
**Module / ask:** Strengthen the existing Playwright suite so mobile-layout, upload-failure, and production-PWA bugs that currently escape Vite-dev Chromium smoke are caught before Docker deploy. No second test framework. No new trader UI.  
**Anchors:** `docs/features/00-concepts.md`, `docs/superpowers/specs/2026-08-11-quality-gate-and-test-system-design.md`, `docs/docker.md`, `docs/features/settings.md` (PWA update)  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders hit clipped docks, failed photo sends, and stale Home Screen shells after a Docker ship. Those paths are not a merge gate today. A small smoke gate on the production build is the product, not a new feature. |
| UX Designer | Viewport + touch simulation is useful for overflow and clearance. It is not a phone. Soft keyboard, Home Screen, camera, and safe-area stay a written device checklist. Do not label WebKit green as “iOS OK”. |
| Solution Architect | Keep `@playwright/test`. PR gate = Chromium + WebKit smoke against `vite preview` (service worker on). Main / dispatch = Docker Compose `:8080` smoke (nginx gateway + SW). Functional journeys stay Chromium and are not every-PR. Diagnostics attach screenshots, video, traces, console, and failed requests. |

---

## Platform consistency (required)

1. **Existing patterns?** Reuse `@smoke` / `@regression` / `@functional`, Pixel 7 device, seed personas, and the quality-gate BM-07 clearance idea. Do not invent a parallel runner.
2. **Duplicates another feature?** No. Complements unit coverage of PWA update and version identity; does not replace them.
3. **Should reuse an existing workflow?** Yes: OTP seed login helpers, orders chrome bounding-box asserts, media `setInputFiles`.
4. **Naming matches the app?** Docs stay plain: New version · Load, About Ekum. Tests assert existing test ids; no new trader chrome.

**Philosophy conflict?** No.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | Smoke is 2 Chromium specs on Vite dev; SW disabled in dev. |
| Business rules | N/A | Gate only; no new trade rules. |
| Workflows | Gap | CI e2e is `workflow_dispatch` only; no post-deploy smoke. |
| Edge cases | Gap | No failed upload, list 500, or narrow-chrome overflow matrix in smoke. |
| Permissions | N/A | |
| User states | Later | Full offline Workbox matrix and chunk-404 recovery stay Later. |
| Notifications | Later | Real push tap needs a device. |
| Error handling | Gap | No failure screenshots/video/console/network attach by default. |
| Scalability | OK | Smoke stays small; functional not on every PR; workers stay 1. |
| Mobile interactions | Gap | No WebKit project; keyboard only approximated; BM-07 not systematic in smoke. |
| First glance (BM-11) | Later | Still a human phone-width pass; automation does not replace it. |
| Accessibility | N/A | |
| Platform consistency | OK | Extends Playwright; honesty rule in docs. |

---

## Gaps

### G-001 — Dev Chromium smoke misses the shipped PWA

| Field | Content |
|-------|---------|
| Gap | Default and CI smoke hit Vite dev. Service worker is off. Docker nginx `/api/v1/web-build` proxy is untested. |
| Why it matters | Stale shell and gateway quirks show up after deploy, not in `pnpm dev`. |
| Impact if ignored | “Green smoke” still ships a broken Home Screen / version pill path. |
| Recommendation | Preview smoke on PR; Docker smoke on main + dispatch. |
| Priority | Required before implementation |

### G-002 — No WebKit project and weak failure artifacts

| Field | Content |
|-------|---------|
| Gap | Chromium only; trace on first retry; no screenshot/video; no console/network log. |
| Why it matters | Mobile layout flakes are invisible in CI logs. |
| Impact if ignored | Same class of bug keeps escaping. |
| Recommendation | Projects `chromium-mobile` + `webkit-mobile`; screenshot/video/trace; diagnostics helper. Document WebKit ≠ real iOS. |
| Priority | Required before implementation |

### G-003 — Highest-risk mobile regressions untested in smoke

| Field | Content |
|-------|---------|
| Gap | Overflow, clipped CTAs, failed upload, loading/error, keyboard approximation absent from `@smoke`. |
| Why it matters | BM-07 and upload failure are the bugs traders screenshot. |
| Impact if ignored | Functional suite may cover happy path only, and it does not gate merges. |
| Recommendation | Small new `@smoke @regression @mobile` specs; do not rewrite journeys. |
| Priority | Required before implementation |

### G-004 — Real device behavior cannot be claimed from Playwright

| Field | Content |
|-------|---------|
| Gap | No written split between automated checks and iPhone/Android checklist. |
| Why it matters | A green WebKit job would be misread as iOS sign-off. |
| Impact if ignored | False confidence before client phones. |
| Recommendation | `docs/superpowers/qa/mobile-and-pwa-test-matrix.md` + docker.md link. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Completeness + gap-matrix row for the gate.
- Playwright diagnostics (screenshot, video, trace, console, failed network).
- `chromium-mobile` (Pixel 7) and `webkit-mobile` (iPhone 13 descriptor on WebKit). Smoke on both; functional stays Chromium.
- `playwright.preview.config.ts` + `pnpm test:e2e:smoke:preview` against production `vite preview`.
- `playwright.docker.config.ts` + `pnpm test:e2e:smoke:docker` against Compose `:8080`.
- New smoke specs: overflow, chrome clearance, failed upload, orders error, keyboard approximation, PWA/version identity.
- CI: preview smoke blocks PR and main; Docker smoke blocks main and `workflow_dispatch`. Artifact upload on failure.
- Device checklist doc. WebKit is not iOS compatibility.

## Explicitly deferred / rejected

- Second test framework, visual snapshot farm, rewriting existing journeys.
- Full `@functional` on WebKit or on every PR.
- HEIC, real camera, real soft keyboard, safe-area, push tap, Android install prompt.
- Full offline Workbox matrix and chunk-404 recovery (already Later).
- Claiming iOS/Android compatibility from emulation.

## Sign-off

Required gaps closed or deferred in writing: Yes (G-001–G-004 in this slice; device-only items deferred in the matrix doc)  
Ready for implementation / `@functional` journeys: Yes — implementation is the gate itself; no new trader journey beyond smoke regressions.
