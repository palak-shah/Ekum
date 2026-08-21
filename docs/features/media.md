# Media

## Purpose

Shared photo pipeline for design images, covers, chat photos, and photo orders: direct-to-blob upload, then async thumbnail when configured. Viewing uses a shared **PhotoViewer** (pinch / double-tap zoom, swipe within one design or chat album) on chat albums, album/Saved design sheets, and Explore design pages.

## Who uses it

Indirectly every user who attaches an image. There is no standalone “Media” tab — uploads happen inside catalog, chat, orders, and profile.

## User flows

1. User picks photos: phone **Add designs** / **Photo order** use shared continuous camera (multi-shot; gallery fallback); elsewhere camera / gallery / paste URL as the feature allows.
2. Client requests upload URL → uploads bytes → completes upload.
3. Feature stores the resulting URL on the product, message, cover, etc.
4. Background job may derive a thumbnail (`media.thumbnail`).

## Business rules

| Status | Meaning |
|--------|---------|
| `pending` | Upload URL minted; bytes not confirmed |
| `uploaded` | Client confirmed direct upload |
| `ready` | Thumbnail derived (when worker succeeds) |
| `failed` | Processing gave up after retries |

- Kind in Phase 1: **image**.
- Business rules for *who can see* an image follow the parent object (catalog audience, chat, order) — media itself is not a second visibility system.
- Dev may serve local files; production uses blob storage + SAS-style upload URLs.

## Edge cases / empty states

- Upload failure → feature shows error; no orphan published design without handling.
- Missing thumbnail → clients fall back to original URL.
- Large batch uploads (design batch / collection quick-add) run with progress; respect session caps in those UIs.

## Seed walkthrough

1. As **Ravi**: Add designs → continuous camera or gallery → 2–3 photos → confirm thumbs in batch, then save to library.
2. As **Meena**: send a chat photo in the seeded thread.
3. Photo order: attach images via **＋ → Photo order** (same continuous camera on phone).

## Automated verification

- Functional: `pnpm test:e2e:functional` — `@media` chat photo send
- Completeness: `docs/superpowers/reviews/completeness/2026-08-11-media-completeness.md`

## Where it lives

- Web: `apps/web/src/lib/mediaUpload.ts`, `apps/web/src/ui/ContinuousCamera.tsx` (Add designs / Photo order), and feature call sites
- API: `apps/api/src/media/`; job `media.thumbnail` in `apps/api/src/jobs/`
- Contracts: `packages/domain-types/src/media.ts`
