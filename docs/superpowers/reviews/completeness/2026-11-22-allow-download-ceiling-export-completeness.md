# Feature Completeness Review — `allow-download-ceiling-export`

**Date:** 2026-11-22  
**Module / ask:** Allow download hop ceiling; PhotoViewer Download; no anonymous catalog media (path-bound tokens); thumb2/original only when allowed  
**Anchors:** `docs/features/collections.md`, `docs/features/media.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Conflicts with philosophy → Reject/Redesign. This slice hardens design theft without DRM claims.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Trust ladder: Allow download cannot exceed upstream. Visitors need Download when on; locked visitors browse preview only. |
| UX Designer | Quiet disabled Allow download when ceiling off. PhotoViewer Download when allowed; omit when off. |
| Solution Architect | Path-bound HMAC/SAS on media GETs; sign in API responses (no per-tile mint). Untokenized GET deny. Screenshot residual. |

---

## Platform consistency (required)

1. **Existing patterns?** Publish Who checkboxes; PhotoViewer headerAction; curation-ceiling clamps.  
2. **Duplicates?** No — closes G-001 buyer export from 2026-09-24 redesign.  
3. **Reuse?** `curatedPublishRateVisibility` style clamp; PhotoViewer headerAction.  
4. **Naming?** Allow download · Download.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Ceiling + tokens + Download |
| Business rules | OK | Hop AND; owner always |
| Workflows | OK | Repost/Publish + DesignSheet viewer |
| Edge cases | OK | Mixed foreign AND; path guess |
| Permissions | OK | canView + allowDownload |
| User states | OK | Owner vs visitor |
| Notifications | N/A | |
| Error handling | OK | 401/403 untokenized |
| Scalability | OK | Sign in response; TTL cache |
| Mobile | OK | Download via share/save |
| First glance (BM-11) | OK | No loud locked button |
| Units | N/A | |
| Accessibility | OK | Button label Download |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Azure private container ops

| Field | Content |
|-------|---------|
| Gap | Prod Azure may still expose public blob GETs if container is public. |
| Why it matters | Tokens on local `/media` alone do not close Azure hotlinks. |
| Recommendation | Emit read SAS for Azure URLs in this slice; ops ensure container is not anonymously listable. |
| Priority | Required before implementation |

### G-002 — Screenshot residual

| Field | Content |
|-------|---------|
| Gap | Painted pixels can be photographed. |
| Recommendation | Document honest limit; no DRM. |
| Priority | Future improvement (watermark Later) |

---

## Approved scope for this slice

- `curatedPublishAllowDownload` + publish clamp + UI disabled checkbox  
- Path-bound media tokens; untokenized catalog image GET deny  
- Locked visitor: thumbnail1 signed URLs only  
- Owner / allowDownload: signed thumb2/original as needed  
- PhotoViewer Download when allowed  
- Docs + units  

## Explicitly deferred / rejected

- Album bulk zip  
- Server-side watermark  
- Re-litigate chat Quote chrome  

## Sign-off

Required gaps closed: Yes (G-001 via SAS emit)  
Ready for implementation: Yes  
