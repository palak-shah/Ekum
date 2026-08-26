# Explore & search

## Purpose

Discovery surface for posts (collections and designs), businesses, and federated search. Ranking is **opportunity / interest**, not engagement vanity metrics. Network nodes are **companies**, not individual people. Publishers are opaque **businesses** (no trader/seller labels).

## Who uses it

Buyers, sellers, and dual-role companies. Explore is not limited to “seller catalog only” — curated packs from dual-network companies publish here too.

## User flows

1. Open **Explore** (`/explore`) — **Stories** rail, then shelves / filters.
2. **Filter square** — root: **Change View** · **Select Category** · **Select City** · (dual only) **Explore Buyers** / **Explore Suppliers**. Content type: **View Items By** — All Feeds / Collections Only / Designs Only / Businesses Only (`?show=`). Category and city are multi-select (starts-with search, Confirm). **Clear** on a Category or City row clears that facet only. No All / Buying / Selling chips.
3. Tap a Story → filter posts from that business (`?story=`); Clear or Open shop if no posts in shelf.
4. **Buying** = posts (and Stories). **Selling** = **Buyers for you** only. Selling never shows My Catalog. Suggested-supplier shelf is not on the buying feed — directory is filter square → **Businesses Only**.
5. Filter by one or more categories / cities (OR within a facet, AND together).
6. Follow businesses; open album or design detail (`/explore/products/:id`, `/collections/:id`). **Bookmark** in the Explore header opens **Saved**. On a design page, tap a photo → shared **PhotoViewer** (pinch / swipe within that design).
   - **Album:** long-press → select album. **Design:** long-press → select design. Both can stay selected together.
   - Sticky dock: **Share** / **Bookmark** apply to everything selected (albums as collection cards, designs as product cards / Saved refs). **Order** / **Curate** (Trading on) use **designs only**. **Clear** empties the pick and **exits** select mode. Untapping the last selected item also exits — then tap opens the album/design again.
   - Locked (`allowForward: false`): **Can’t share** under the title (before select); toast if selected anyway; **Share** / **Curate** only include shareable items. **Order** / **Bookmark** still work.
   - Tap still opens the album or design when not selecting. No Select control in the search chrome.
7. Search — federated company / collection / design; feed stays until the user types (UX rule).
8. From company cards → public profile → follow / request access / chat.

### Trade-side

User control is **Buying** or **Selling** only (`?side=`). Dual presence (I buy + I sell) defaults to **Buying**; last filter row is **Explore Buyers** (→ Selling) or **Explore Suppliers** (→ Buying). Buy-only / sell-only stay in that side; the row is hidden. Old `?side=all` is treated as Buying for dual (Buying for buy-only; Selling for sell-only).

| Side | Intent |
|------|--------|
| **Buying** | Ranked feed: **follows first**, then **connected + your categories**, then **category matches**; **Received** packs by UTC day then business (directed audience or broadcast — not Everyone-market); Stories for follow/connected publishers who posted |
| **Selling** | **Buyers for you** only — **not** My Catalog |

## Business rules

| Rule | Detail |
|------|--------|
| Visibility | Blocked companies never appear; audience (`everyone` / `connections` / `followers` / `selected`) enforced server-side |
| Designs on Explore | Published designs with `postedToMarketAt` (Publish sets both) |
| Collections on Explore | Published albums with activity / live-window rules — see [collections](./collections.md) |
| Follow | Permissionless; Buying side prioritizes followed publishers’ posts |
| Ranking (feed) | Interest / opportunity matching (`feed-rank`, `interest-match`) — not likes/viral scores. **Seen posts** sink within a tier until the post has newer activity (device-local for now; server sync later at scale). Explore home shows **12 posts** then **More posts** so discovery shelves are not buried. |
| Stories | Company appears when viewer **follows or is connected** and company has **published** to feed (own or curated). Rank by recent publish; hide rail when empty; not Instagram personal stories |
| Role opacity | No Trader / Seller badges on Stories or cards |
| Businesses directory | Filter square → **Businesses Only**. Not mixed into the buying post feed. |
| Businesses tab | Directory = **2-col grid** of company tiles (one cover). Companies with live Explore posts (not self, not blocked). Rank: **interest match first**, then **newest post activity** |
| Why-lines | Cards may show relevance / posted-time cues for clarity |
| Curated packs | Publish curated collections (multi-supplier, within original seller forward/audience). Capability `relist`. See [saved](./saved.md) |

## Edge cases / empty states

- Cold start: prompt to browse businesses.
- Buying + no follows → empty followed shelf; still offer supplier discovery.
- Selected-audience posts hidden from non-selected viewers.
- Story with no posts in current shelves → Open shop → company profile.

## Seed walkthrough

1. As **Meena**: Explore → Stories / feed → Surat Silk House / Wedding Edit. Directory: filter → **Businesses Only**.
2. Follow Ravi’s company if not already; confirm Following list under **You → Network**.
3. As **Ravi**: Explore → Stories / feed → Ahmedabad Loom Co (peer fabric supplier); **Buyers for you** → Jaipur Emporium.
4. As **Ravi**: post a design to Explore → confirm Meena can see it when audience is connections/everyone.

## Automated verification

- Functional: `pnpm test:e2e:functional` — `@explore` browse, filter dismiss, open collection
- Completeness: `docs/superpowers/reviews/completeness/2026-08-11-explore-completeness.md`; Slice C `2026-08-22-explore-trade-side-completeness.md`; filter panels `2026-08-23-explore-filter-panels-completeness.md`

## Where it lives

- Web: `apps/web/src/features/explore/`
- API: `apps/api/src/discovery/` (`ExploreHomeView.stories`, `receivedByDay`, `receivedCurated`)
- Contracts: `packages/domain-types/src/discovery.ts`
- Platform / trader decisions: [mvp-garmenthub-gap-matrix.md](../superpowers/reviews/mvp-garmenthub-gap-matrix.md)
