# Media

## Purpose

Shared photo pipeline for design images, **Business Profile cover / Showcase**, chat photos, and photo orders: direct-to-blob upload, then async **thumbnail1** (max 480px) and **thumbnail2** (max 1080px) WebP siblings. Viewing uses a shared **PhotoViewer** (pinch / double-tap zoom, swipe) on chat albums, album/Saved design sheets, Explore design pages, How many / order detail, Orders list stacks, complaint images, and **Business Profile cover gallery** (cover + showcase; view-only).

## Who uses it

Indirectly every user who attaches an image. There is no standalone “Media” tab — uploads happen inside catalog, chat, orders, and profile.

## User flows

1. User picks photos: phone **Add designs** / **Photo order** / **chat ＋ Camera** use shared continuous camera (multi-shot; gallery fallback); elsewhere camera / gallery / paste URL as the feature allows.
2. Client requests upload URL → uploads **original** bytes → completes upload.
3. Feature stores the resulting **original** URL on the product, message, cover, etc.
4. Background job `media.thumbnail` writes `{companyId}/thumbnail1/{stem}.webp` and `{companyId}/thumbnail2/{stem}.webp`. Lists and feed request the matching variant; **PhotoViewer** (pinch / zoom) always loads the stored original.

**Duplicate detection (hook only, not built):** after `MediaService.complete` enqueues `media.thumbnail`, a later `JobType.MediaDedupe` can take the same `mediaId`. Compare within `companyId` only. High-confidence matches should **prompt** “This looks like {name} — use existing?” — never auto-merge. Uncertain stays two commercial identities. No hash/palette columns or matcher in this slice.

## Storage layout

```text
{companyId}/original/{file}          original bytes (JPEG / PNG / WebP)
{companyId}/thumbnail1/{stem}.webp   longest edge ≤ 480, aspect + EXIF orientation kept
{companyId}/thumbnail2/{stem}.webp   longest edge ≤ 1080
seed/{name}.jpg                      seed catalog original (stored URL unchanged)
seed/thumbnail1/{name}.webp
seed/thumbnail2/{name}.webp
```

New **image** uploads mint `{companyId}/original/{token}.{ext}`. Audio and documents stay `{companyId}/{token}.{ext}`. Seed catalog stored URL stays `/media/seed/{name}.jpg`; `ensureSeedImages` writes the sibling thumbs so Explore / Orders can request them.

Local disk: `apps/api/.media/…` (Docker volume `ekum_media`). Azure: container (default `media`) when account + key are set. Local GET `Cache-Control: public, max-age=86400`. Variant PUTs use the same max-age (not `immutable` — retries overwrite the same key).

## Relocate historical originals (ops)

Legacy files live at `{companyId}/{file}`. Do **not** run `--apply` on production until staging succeeds.

1. **Backup and verify**
   ```text
   pg_dump "$DATABASE_URL" --format=custom -f ekum-media-relocate.dump
   pg_restore --list ekum-media-relocate.dump
   ```
   Restore: `pg_restore -d "$DATABASE_URL" ekum-media-relocate.dump`
2. **Dry-run** (default): `pnpm --filter @ekum/api media:relocate-originals`  
   Review counts (`copied`, `alreadyInPlace`, `missingSource`, `urlRowsRewritten`) and sample `from` → `to` URLs.
3. **Apply on staging** DB + storage container: `pnpm --filter @ekum/api media:relocate-originals:apply`  
   Copies each original, sha256-checks the destination, **then** UPDATEs URL strings in a transaction per row. Legacy blobs are **kept**. Safe to rerun. Local disk also copies leftover `{companyId}/{file}` images that are not in any URL (skip `seed/`, thumbs, audio/PDF).
4. If the script dies mid-apply: rerun (idempotent). To undo URL changes: restore the dump. Leftover `original/` copies are harmless.
5. Production only after staging.

Pixel thumbs for existing `Media` image rows are enqueued by `media.thumbnail.backfill` once per environment (first boot after this ships). To run again, insert a `Job` row `type = media.thumbnail.backfill`. Missing thumbs: `ManagedImage` falls back to the original URL once. Do not claim every historical URL has variants until backfill has run in that environment. Seed catalog thumbs are written by `ensureSeedImages` (local API boot + `db:seed`); PhotoViewer still loads the jpg.

## Business rules

| Status | Meaning |
|--------|---------|
| `pending` | Upload URL minted; bytes not confirmed |
| `uploaded` | Client confirmed direct upload |
| `ready` | Both thumbnail files exist (or were confirmed present) |
| `failed` | `media.thumbnail` job gave up after retries |

- Kind: **image** / **audio** / **document**. Only images get thumbnails.
- Who can see an image follows the parent object (catalog audience, chat, order, **or Business Profile access** for cover/showcase) — media is not a second visibility system. Profile cover / avatar / Showcase store URL **strings** on the company; `PATCH /companies/me` does **not** re-check Media/Product ownership (members who can edit are trusted to upload their own pictures). Removing them from the profile **unlinks** only (does not delete blobs or designs). Showcase is independent of collection audience.
- **Plain media URLs (locked):** API responses return stored `/media/…` strings **without** path-bound signatures (`ekum_sig`). Local image GET serves the file without a token so DevTools / Network can open the URL. Legacy rows that still have `ekum_k` / `ekum_exp` / `ekum_sig` on the string are **stripped on read** (API + web) — no DB migration; Azure SAS query keys are left alone. Guessable paths are an accepted residual — who can *see* a design still follows the parent object; **Allow download** still gates PhotoViewer / DesignSheet **Download**. Completeness: `2026-11-24-plain-media-urls-completeness` (redesign of 2026-11-22 token gate).
- **Allow download off** (visitor): no DesignSheet ⋯ **Download** / PhotoViewer **Download**. **Allow download on** or **owner**: PhotoViewer **Download** exports original. Screenshots of painted pixels cannot be stopped.
- Dev may serve local files; production uses blob storage + SAS-style **upload** URLs when Azure is set.
- Feature records store original URL **strings**, not Media IDs.
- Display: **thumbnail1** (max 480) for list thumbs; **thumbnail2** (max 1080) for Explore cards; **original** for PhotoViewer. `mediaDisplayUrl` + `ManagedImage` pick the sibling; one `onError` falls back to original when a thumb is missing.

## Edge cases / empty states

- Upload failure → feature shows error; no orphan published design without handling.
- Missing thumbnail file → clients fall back to original URL.
- Large batch uploads (design batch / collection quick-add) run with progress; respect session caps in those UIs.

## Seed walkthrough

1. As **Ravi**: Add designs → continuous camera or gallery → 2–3 photos → confirm thumbs in batch, then save to library.
2. As **Meena**: send a chat photo in the seeded thread.
3. Photo order: attach images via **Orders ＋** or **chat ＋ → Photo order** (same continuous camera on phone).

## Automated verification

- Functional: `pnpm test:e2e:functional` — `@media` chat photo send (plain URLs; PhotoViewer loads original).
- Units: `catalog-media-access`, `downloadCeiling`, PhotoViewer Download visibility; media path helpers as needed.
- Completeness: `docs/superpowers/reviews/completeness/2026-11-24-plain-media-urls-completeness.md` (+ allow-download ceiling / media folder Completeness).

## Where it lives

- Web: `apps/web/src/lib/mediaUrl.ts` (`mediaDisplayUrl`), `apps/web/src/ui/ManagedImage.tsx`, `CoverImage` / `DesignPhotoCarousel` / list thumbs. PhotoViewer stays original. `apps/web/src/lib/mediaUpload.ts`, `apps/web/src/lib/mediaSession.ts` (camera/mic permission reuse in-tab), `apps/web/src/ui/ContinuousCamera.tsx` (Add designs / Photo order / **chat ＋ Camera**; **chat ＋ Photos** is gallery-only).
- Camera / mic: first allow in the tab is remembered for that session — reopening camera or holding mic again does not call a fresh permission prompt while tracks stay live (soft-release; hard-stop after ~5 min idle or tab close). Camera soft-release mutes tracks; microphone stays enabled so Safari MediaRecorder does not return empty clips after mute/unmute. **Gallery / Designs** on camera chrome **hard-stops** the stream and opens the file picker in the same tap (no viewfinder flash under the OS picker).
- API: `apps/api/src/media/`; jobs `media.thumbnail` and `media.thumbnail.backfill` in `apps/api/src/jobs/`
- Relocate: `apps/api/scripts/relocate-media-originals.ts`
- Contracts: `packages/domain-types/src/media.ts`, `packages/domain-types/src/media-paths.ts`
