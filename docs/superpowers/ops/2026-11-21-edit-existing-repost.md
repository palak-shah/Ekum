# Edit existing Repost from Explore — ship notes

## What shipped

- Explore cards expose `viewerRepostCollectionId` (source → child map from `viewerRepostStamps`; shop lists same).
- `ALREADY_REPOSTED` includes `details.collectionId` (filter-safe).
- Already-reposted icon: muted, `aria-label="Edit repost"`, opens `RepostSheet` edit (no toast-only).
- Edit save: PATCH name if needed → PUT products only when membership changed (after curate-check) → POST publish → PATCH member-pricing. No second create / no delete-on-fail.

## Tests run

| Command | Result |
|---|---|
| `pnpm --filter @ekum/web exec vitest run …curateCheck / ExploreFeedActions / RepostSheet` | PASS (36) |
| `pnpm --filter @ekum/api exec vitest run collection.service.spec -t "rejects second repost"` | PASS |

## Trader-eye (running app)

- **390px:** muted done icon after create; tap opens **Edit repost** with prefilled name + members; CTA **Save** (no 48h link). Screenshot: `2026-11-21-edit-repost-390.png`.
- **Desktop (1280):** same sheet language / Save. Screenshot: `2026-11-21-edit-repost-desktop.png`.

## Gaps / risks

- No dedicated API feed-stamp integration test beyond unit + live Explore probe.
- Soft-unavail membership-unchanged settings save relies on skipping curate-check gate (covered in sheet logic; no e2e tag yet).
- Playwright `@functional` journey for edit-repost not added this slice.
