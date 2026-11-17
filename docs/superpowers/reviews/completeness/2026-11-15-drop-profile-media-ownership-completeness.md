# Feature Completeness Review — Drop profile media ownership check

**Date:** 2026-11-15  
**Module / ask:** Remove `assertOwnedMediaUrls` from Business Profile `PATCH /companies/me` (cover, avatar, Showcase). Traders are responsible for uploading only their own pictures.  
**Anchors:** `docs/features/company.md`, `docs/features/media.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Ownership gate caused false rejects on gallery upload (URL rewrite ≠ Media row). Trust company members who can already edit the profile. |
| UX Designer | Home Showcase / cover / avatar upload must save without “not from your business” when the trader just uploaded. |
| Solution Architect | Delete dead helper; keep SHOWCASE_MAX and unlink-only remove. No schema change. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — still URL strings on Company; upload ticket auth unchanged.  
2. **Duplicates?** No.  
3. **Reuse workflow?** Upload / design pick unchanged.  
4. **Naming?** Unchanged.  
5. **Units?** N/A.

**Philosophy conflict?** No — intentional trust of edit members; documents the trade-off.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | PATCH accepts any URL string for logo/cover/showcase |
| Business rules | OK | SHOWCASE_MAX remains |
| Permissions | OK | Still JWT + company membership only |
| Error handling | OK | No MEDIA_NOT_OWNED on profile media |
| First glance (BM-11) | N/A | API-only |

---

## Approved scope

- Remove ownership assert from `updateOwnProfile`; delete `owned-media-urls` helper.
- Specs + media/company docs.

## Explicitly deferred

- Normalizing `toAbsoluteMediaUrl` for other features that may still exact-match Media URLs.
- Broader media ACL redesign.

## Disposition rationale

Product explicitly drops the gate; fixes real gallery upload failures without inventing a second ownership system.
