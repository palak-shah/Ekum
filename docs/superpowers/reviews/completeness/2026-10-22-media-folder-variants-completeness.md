# Feature Completeness Review — Media folder variants

**Date:** 2026-10-22  
**Module / ask:** Generate real 480px / 1080px WebP siblings under `thumbnail1/` and `thumbnail2/`; keep originals under `original/`; relocate historical blobs with a copy-then-UPDATE script (no Prisma schema change).  
**Anchors:** `docs/features/media.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders should not wait on photos or burn mobile data on Explore / How many / chat thumbs. No new Media tab. Missing thumbs must still show the original. |
| UX Designer | No layout, crop, or chrome change. PhotoViewer / zoom stay full original. Variant choice is behind the existing `<img>` slots. |
| Solution Architect | Keep string URLs on features. Do not FK Media. New uploads land in `original/`. Historical files are **copied** (not deleted) then DB strings updated. Thumbs are written by the existing `media.thumbnail` job using Sharp. |

---

## Platform consistency (required)

1. **Existing patterns?** Direct-to-blob upload ticket → PUT → complete → job. CoverImage / PhotoViewer / DesignPhotoCarousel stay. No new picker or Media nav.  
2. **Duplicates another feature?** No. Replaces the unused `_thumb` URL fiction with real files.  
3. **Should reuse an existing workflow?** Yes: `Media` row, `Job` queue, Azure/local drivers, `PUBLIC_MEDIA_BASE_URL`.  
4. **Naming matches the app?** Photos / designs — not “assets” or DAM. Folder names `original` / `thumbnail1` / `thumbnail2` are storage keys, not trader copy.  
5. **Units?** N/A — no rate or qty string changes.

**Philosophy conflict?** No.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Three stored versions; UI picks by display size in Stage B. |
| Business rules | OK | Visibility still follows parent. Original bytes unchanged. |
| Workflows | OK | Upload path unchanged for the client except blob path includes `/original/`. |
| Edge cases | OK | Missing thumb → original. Corrupt image → job retry then `Media.failed`. Legacy flat path until relocate script. |
| Permissions | OK | Uploads cap unchanged. Worker uses storage credentials; tenant prefix `companyId/`. |
| User states | N/A | No new user-facing state. |
| Notifications | N/A | |
| Error handling | OK | Job retries; Media `failed` on exhaust; UI onError once (Stage B). |
| Scalability | OK | Sequential Sharp per job; backfill pages Media rows; no generate-on-GET. |
| Mobile interactions | N/A | No new chrome / sticky bars. |
| First glance (BM-11) | OK | Stage B: lists request thumbs; PhotoViewer original; missing thumb → original. |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Same alt / PhotoViewer. |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Thumbnail bytes were never written

| Field | Content |
|-------|---------|
| Gap | `media.thumbnail` only derived `abc_thumb.jpg` and did not write a file. UI never reads `thumbnailUrl`. |
| Why it matters | Thumbs in lists load multi-megabyte originals. |
| Impact if ignored | Bandwidth and slow Explore / How many. |
| Recommendation | Sharp write `thumbnail1` (max 480) and `thumbnail2` (max 1080) WebP. |
| Priority | Required before implementation |

### G-002 — Historical originals sit on a flat path

| Field | Content |
|-------|---------|
| Gap | Existing blobs are `{companyId}/{file}`, not `{companyId}/original/{file}`. |
| Why it matters | One layout is simpler for variant URL derivation. |
| Impact if ignored | Dual-path forever. |
| Recommendation | Copy (do not delete) then UPDATE URL strings. Dry-run; staging before production; backup first. |
| Priority | Required before implementation |

### G-003 — Frontend still points at originals

| Field | Content |
|-------|---------|
| Gap | CoverImage, carousels, 48px order thumbs all `src={original}`. |
| Why it matters | Files on disk do not help until the UI requests them. |
| Impact if ignored | Stage A alone does not improve loading. |
| Recommendation | Stage B: `mediaDisplayUrl` + ManagedImage fallback; PhotoViewer original. Seed catalog gets sibling thumbs so Explore / Orders do not keep loading the jpg. **Closed in Stage B.** |
| Priority | Required — implemented in Stage B |

### G-004 — Feature URLs without a Media row

| Field | Content |
|-------|---------|
| Gap | Catalog/chat/order copy URL strings and drop `mediaId`. |
| Why it matters | Backfill that only walks `Media` misses some photos. |
| Impact if ignored | Those URLs still display via original fallback. |
| Recommendation | Relocate script walks feature URL columns. Pixel thumbs from Media rows + helper fallback. Do not claim 100% historical thumbs. |
| Priority | Recommended enhancement |

---

## Approved scope for this slice

**Stage A (this implementation):**

- Completeness + `docs/features/media.md` (pipeline + ops).
- Shared path helpers (`original` / `thumbnail1` / `thumbnail2`).
- Storage `get` / `put` / `exists` (local + Azure).
- New uploads: `{companyId}/original/{token}.{ext}`.
- Sharp job writes both WebP variants; `Media.failed` on permanent job failure.
- Relocate script: backup guidance, dry-run, copy+verify, then transactional URL UPDATEs; keep legacy blobs; idempotent.
- Backfill job over `Media` image rows.
- API tests for paths, Sharp, drivers, job idempotency/failure, relocate helper.

**Stage B (this follow-up):**

- `mediaDisplayUrl` + ManagedImage fallback (one `onError` → original).
- Migrate call sites; PhotoViewer stays original.
- Seed catalog: `ensureSeedImages` writes `seed/thumbnail1|2/{name}.webp`; stored URL stays the jpg.
- Trader-eye: Explore, chat, orders, PhotoViewer.

## Explicitly deferred / rejected

- Prisma schema / new tables / Media FKs on products — Rejected for this slice.
- Deleting legacy flat blobs — Deferred (rollback).
- Client-side compress on upload — Deferred.
- Top-level Media tab — Rejected (existing).
- Four named variants / new CDN — Rejected.

## Sign-off

Required gaps closed or deferred in writing: Yes (G-003 closed in Stage B; G-004 fallback documented)  
Ready for implementation / `@functional` journeys: Yes. Chat-photo `@functional` remains a regression (original still works). Stage B display is unit-tested (`mediaDisplayUrl`, ManagedImage, CoverImage, PhotoViewer original).
