# Media

## Purpose

Shared photo pipeline for design images, covers, chat photos, and photo orders: direct-to-blob upload, then async **thumbnail1** (max 480px) and **thumbnail2** (max 1080px) WebP siblings. Viewing uses a shared **PhotoViewer** (pinch / double-tap zoom, swipe within one design or chat album) on chat albums, album/Saved design sheets, Explore design pages, How many / order detail, and **Orders list** design stacks (and complaint row images).

## Who uses it

Indirectly every user who attaches an image. There is no standalone “Media” tab — uploads happen inside catalog, chat, orders, and profile.

## User flows

1. User picks photos: phone **Add designs** / **Photo order** / **chat ＋ Camera** use shared continuous camera (multi-shot; gallery fallback); elsewhere camera / gallery / paste URL as the feature allows.
2. Client requests upload URL → uploads **original** bytes → completes upload.
3. Feature stores the resulting **original** URL on the product, message, cover, etc.
4. Background job `media.thumbnail` writes `{companyId}/thumbnail1/{stem}.webp` and `{companyId}/thumbnail2/{stem}.webp`. Lists and feed request the matching variant; **PhotoViewer** (pinch / zoom) always loads the stored original.

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
- Who can see an image follows the parent object (catalog audience, chat, order) — media is not a second visibility system.
- Dev may serve local files; production uses blob storage + SAS-style upload URLs.
- Feature records store original URL **strings**, not Media IDs.
- Display: **thumbnail1** (max 480) for list / 48–64px thumbs; **thumbnail2** (max 1080) for Explore cards and design carousels; **original** for PhotoViewer. `mediaDisplayUrl` + `ManagedImage` pick the sibling; one `onError` falls back to the original.

## Edge cases / empty states

- Upload failure → feature shows error; no orphan published design without handling.
- Missing thumbnail file → clients fall back to original URL.
- Large batch uploads (design batch / collection quick-add) run with progress; respect session caps in those UIs.

## Seed walkthrough

1. As **Ravi**: Add designs → continuous camera or gallery → 2–3 photos → confirm thumbs in batch, then save to library.
2. As **Meena**: send a chat photo in the seeded thread.
3. Photo order: attach images via **Orders ＋** or **chat ＋ → Photo order** (same continuous camera on phone).

## Automated verification

- Functional: `pnpm test:e2e:functional` — `@media` chat photo send (original URL still works; PhotoViewer stays original).
- Completeness: `docs/superpowers/reviews/completeness/2026-10-22-media-folder-variants-completeness.md`. Chat-photo completeness: `docs/superpowers/reviews/completeness/2026-08-11-media-completeness.md`

## Where it lives

- Web: `apps/web/src/lib/mediaUrl.ts` (`mediaDisplayUrl`), `apps/web/src/ui/ManagedImage.tsx`, `CoverImage` / `DesignPhotoCarousel` / list thumbs. PhotoViewer stays original. `apps/web/src/lib/mediaUpload.ts`, `apps/web/src/lib/mediaSession.ts` (camera/mic permission reuse in-tab), `apps/web/src/ui/ContinuousCamera.tsx` (Add designs / Photo order / **chat ＋ Camera**; **chat ＋ Photos** is gallery-only).
- Camera / mic: first allow in the tab is remembered for that session — reopening camera or holding mic again does not call a fresh permission prompt while tracks stay live (soft-release; hard-stop after ~5 min idle or tab close). Camera soft-release mutes tracks; microphone stays enabled so Safari MediaRecorder does not return empty clips after mute/unmute. **Gallery / Designs** on camera chrome **hard-stops** the stream and opens the file picker in the same tap (no viewfinder flash under the OS picker).
- API: `apps/api/src/media/`; jobs `media.thumbnail` and `media.thumbnail.backfill` in `apps/api/src/jobs/`
- Relocate: `apps/api/scripts/relocate-media-originals.ts`
- Contracts: `packages/domain-types/src/media.ts`, `packages/domain-types/src/media-paths.ts`
