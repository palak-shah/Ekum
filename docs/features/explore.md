# Explore & search

## Purpose

Discovery surface for posts (collections and designs), businesses, and federated search. Ranking is **opportunity / interest**, not engagement vanity metrics. Network nodes are **companies**, not individual people. Publishers are opaque **businesses** (no trader/seller labels).

## Who uses it

Buyers, sellers, and dual-role companies. Explore is not limited to “seller catalog only” — curated packs from dual-network companies publish here too (planned).

## User flows

1. Open **Explore** (`/explore`) — **Stories** rail, then shelves / filters.
2. **Trade-side filter (planned):** **All** (default) · **Buying** · **Selling**. Content type (Collections / Designs / Businesses) stays a separate filter.
3. Tap a Story → filter posts from that business (`?story=`); Clear or Open shop if no posts in shelf.
4. **Businesses for you** (Buying / All); **Buyers for you** (Selling / All when you sell).
5. Filter by category / city where offered.
6. Follow businesses; open album or design detail (`/explore/products/:id`, `/collections/:id`). **Bookmark** in the Explore header opens **Saved**. On a design page, tap a photo → shared **PhotoViewer** (pinch / swipe within that design).
   - **Album:** long-press → select album. **Design:** long-press → select design. Both can stay selected together.
   - Sticky dock: **Share** / **Save** apply to everything selected (albums as collection cards, designs as product cards / Saved refs). **Order** / **Curate** (Trading on) use **designs only**. **Clear** empties the pick and **exits** select mode. Untapping the last selected item also exits — then tap opens the album/design again.
   - Locked (`allowForward: false`): **Can’t share** under the title (before select); toast if selected anyway; **Share** / **Curate** only include shareable items. **Order** / **Save** still work.
   - Tap still opens the album or design when not selecting. No Select control in the search chrome.
7. Search — federated company / collection / design; feed stays until the user types (UX rule).
8. From company cards → public profile → follow / request access / chat.

### Trade-side (planned)

| Side | Intent |
|------|--------|
| **All** | Mixed market + network (today’s default shape) |
| **Buying** | Upstream: collections/designs from companies you **follow** first; Stories for follow/connected publishers who posted; **received packs** browse by day/business nested here — not mixed into Selling or opportunity ranking |
| **Selling** | Downstream: **Buyers for you** / sell-side opportunity — **not** My Catalog |

## Business rules

| Rule | Detail |
|------|--------|
| Visibility | Blocked companies never appear; audience (`everyone` / `connections` / `followers` / `selected`) enforced server-side |
| Designs on Explore | Published designs with `postedToMarketAt` (Publish sets both) |
| Collections on Explore | Published albums with activity / live-window rules — see [collections](./collections.md) |
| Follow | Permissionless; Buying side prioritizes followed publishers’ posts |
| Ranking (feed) | Interest / opportunity matching (`feed-rank`, `interest-match`) — not likes/viral scores |
| Stories | **Planned rule:** company appears when viewer **follows or is connected** and company has **published** to feed (own or curated). Rank by recent publish; hide rail when empty; not Instagram personal stories. Today’s rail may still include broader publishers — Partial until tightened |
| Role opacity | No Trader / Seller badges on Stories or cards |
| Businesses for you | Suggested businesses shelf (Buying / All); feed rows = name + why + buys/sells line — **not** a fake design collage. Home may keep a short Recommended list |
| Businesses tab | Directory = **2-col grid** of company tiles (one cover). Companies with live Explore posts (not self, not blocked). Rank: **interest match first**, then **newest post activity** |
| Why-lines | Cards may show relevance / posted-time cues for clarity |
| Curated packs | **Planned:** publish curated collections (multi-supplier, within original seller forward/audience). Capability `relist`. See [concepts](./00-concepts.md) |

## Edge cases / empty states

- Cold start: prompt to browse businesses.
- Buying + no follows → empty followed shelf; still offer supplier discovery.
- Selected-audience posts hidden from non-selected viewers.
- Story with no posts in current shelves → Open shop → company profile.

## Seed walkthrough

1. As **Meena**: Explore → Stories / Businesses for you → Surat Silk House / Wedding Edit.
2. Follow Ravi’s company if not already; confirm Following list under **You → Network**.
3. As **Ravi**: Explore → Stories / New for you → Ahmedabad Loom Co (peer fabric supplier); **Buyers for you** → Jaipur Emporium.
4. As **Ravi**: post a design to Explore → confirm Meena can see it when audience is connections/everyone.

## Automated verification

- Functional: `pnpm test:e2e:functional` — `@explore` browse, filter dismiss, open collection
- Completeness: `docs/superpowers/reviews/completeness/2026-08-11-explore-completeness.md`

## Where it lives

- Web: `apps/web/src/features/explore/`
- API: `apps/api/src/discovery/` (`ExploreHomeView.stories`)
- Contracts: `packages/domain-types/src/discovery.ts`
- Platform / trader decisions: [mvp-garmenthub-gap-matrix.md](../superpowers/reviews/mvp-garmenthub-gap-matrix.md)
