# Feature Completeness Review — Version identity (Docker PWA + API)

**Date:** 2026-10-19  
**Module / ask:** Release semver + per-build identity baked at Docker/Vite build; API `/version`; Settings → About Ekum; non-prod TEST badge; image tags by version + SHA  
**Anchors:** `docs/features/settings.md`, `docs/docker.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Support/ops need to know what code is running when PWA and API ship separately. Traders rarely open About; keep it off the daily path under Settings. Semver `0.x.y` + unique build id is enough for beta. |
| UX Designer | One quiet Settings domain card **About Ekum**. Full details on that page (App + API). Non-prod: discreet **TEST · version · shortSha** Tag on About only — mute, not a second New version pill. No chrome on everyday trader jobs. |
| Solution Architect | Bake identity at image build (ARG→ENV / Vite define); never hardcode UI labels. Extend existing `VITE_WEB_BUILD` / `version.json` / `/api/v1/web-build`. New public `GET /api/v1/version`. Compose `image:` tags + sha retag via docker scripts. Explicit `EKUM_DEPLOYMENT` (not NODE_ENV). |

---

## Platform consistency (required)

1. **Existing patterns?** Settings domain card + detail page; kit `Tag`; PWA build poll unchanged (`build` field).  
2. **Duplicates another feature?** No — New version · Load stays the update prompt; About is identity/read-only.  
3. **Should reuse an existing workflow?** Reuse Vite build id + health-module public route style.  
4. **Naming matches the app?** **About Ekum**, **TEST** (ops), plain field labels (Version, Build, Commit, Built).

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Bake, API, About, tags, CHANGELOG template |
| Business rules | OK | Identity = baked image; deployment flag explicit |
| Workflows | OK | Settings → About; docker:up resolves meta |
| Edge cases | OK | Local defaults when meta missing; API offline on About |
| Permissions | OK | Version endpoint public (like health) |
| User states | N/A | Same for all signed-in |
| Notifications | N/A | |
| Error handling | OK | About shows quiet fail for API fetch |
| Scalability | N/A | Static metadata |
| Mobile interactions | OK | No sticky bar on About; TEST chip must not clip content (BM-07) |
| First glance (BM-11) | OK | About one job; TEST quiet |
| Accessibility | OK | Tag text readable; About rows labeled |
| Platform consistency | OK | |

---

## Gaps

None Required for this slice.

### G-001 — Registry push

| Field | Content |
|-------|---------|
| Gap | No GHCR/Docker Hub push in CI |
| Why it matters | Multi-host pull by tag |
| Impact if ignored | Local/server still rebuild from git |
| Recommendation | Future: CI push `version` + `sha-*` |
| Priority | Future improvement |

---

## Approved scope for this slice

- Root `VERSION` + `CHANGELOG.md` template
- `scripts/resolve-build-meta.mjs` + docker script wiring + Compose image tags + sha retag
- Dockerfile ARG/ENV/LABEL for api + web
- Public `GET /api/v1/version`
- Expanded `version.json` (keep `build`)
- Settings → About Ekum (App + API blocks)
- Non-prod TEST badge on About Ekum only (no shell chip)
- Docs: settings.md, docker.md, gap-matrix
- Unit tests for API config/version + web helpers/About

## Explicitly deferred / rejected

- CI image build/push
- Auto-bump VERSION in CI
- Trader-facing changelog in-app

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (unit track sufficient; no new trader journey)
