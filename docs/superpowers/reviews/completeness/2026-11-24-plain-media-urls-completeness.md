# Feature Completeness Review — `plain-media-urls`

**Date:** 2026-11-24  
**Module / ask:** Drop path-bound media URL tokens (`ekum_sig`) and untokenized GET deny; restore plain `/media/…` URLs openable in DevTools  
**Anchors:** `docs/features/media.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Redesign of the “no anonymous catalog media / path-bound tokens” lock from Completeness `2026-11-22-allow-download-ceiling-export`. Allow download UI, hop ceiling, and PhotoViewer / DesignSheet **Download** stay.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders and ops need to open image URLs from Network / DevTools without a signature. Signed URLs blocked that. Download export remains gated by Allow download. |
| UX Designer | No UI chrome change. Images load from plain stored URLs again. |
| Solution Architect | Remove HMAC query on local GET and response signing interceptor. Stored URL strings stay originals. Screenshot residual unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Same media pipeline; Display still uses `mediaDisplayUrl` / ManagedImage variants.  
2. **Duplicates?** No — undoes token layer only.  
3. **Reuse?** Keep `allowDownload` + `downloadCeiling` + PhotoViewer Download.  
4. **Naming?** Unchanged.  
5. **Units?** N/A.

**Philosophy conflict?** Yes vs 2026-11-22 token lock → disposition is **Proceed** on this **Redesign** (plain public local GETs again; Download still product-gated).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Plain GET + plain JSON URLs |
| Business rules | OK | Allow download still gates Download |
| Workflows | OK | No new hops |
| Edge cases | OK | Guessable paths possible again (honest limit) |
| Permissions | OK | Catalog audience unchanged; media not a second ACL |
| User states | OK | Owner / visitor Download visibility |
| Notifications | N/A | |
| Error handling | OK | No 401 for bare image GET |
| Scalability | OK | Less signing work |
| Mobile | OK | |
| First glance (BM-11) | OK | No chrome change |
| Units | N/A | |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Guessable path residual

| Field | Content |
|-------|---------|
| Gap | Anyone who knows or guesses `{companyId}/original/…` can GET the bytes without a token. |
| Why it matters | We previously used path-bound tokens to harden theft. |
| Recommendation | Accept for local/dev and current product ask; Download menu still gated. Azure container privacy remains ops. |
| Priority | Accepted residual (document in media.md) |

---

## Approved scope for this slice

- Drop `verifyMediaUrlToken` on local image GET  
- Drop `SignMediaUrlsInterceptor` and response signing / locked thumbnail1 rewrite in API JSON  
- Pass stored media URLs through unchanged  
- Keep Allow download checkbox, hop ceiling, PhotoViewer / DesignSheet Download  
- Update `media.md`, `collections.md`, feature-gap-matrix  

## Explicitly deferred / rejected

- Azure private container / SAS ops (unchanged)  
- DRM / anti-screenshot  
- Changing Allow download product behaviour  
