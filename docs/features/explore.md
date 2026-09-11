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
6. Follow businesses; open album or design detail (`/explore/products/:id`, `/collections/:id`). **Bookmark** in the Explore header opens **Saved**; **Selection** opens **Your selection** (`/selection`). On a design page, tap a photo → shared **PhotoViewer** (pinch / swipe within that design).
   - **Album:** long-press → select album. **Design:** long-press → select design. Both can stay selected together (types preserved — albums stay albums). Same traveling **Selection** as Saved, company shop, curated albums, and My designs/collections. Long-press uses a non-link press target so iOS Safari does **not** show Open / Open in New Tab; short tap still opens the album or design.
   - Explore header **Selection** control (next to Saved) opens **Your selection**; badge when count > 0. Small floater chip **N selected · View** above bottom nav when the pile is non-empty (hidden on `/selection`, open **chat threads**, and My Catalog root; shown on **Chats list**). Traveling Selection accepts **published** items only.
   - Trade verbs live on **Your selection** — **Order** · **Curate** (Trading on) · **Bookmark** · **Share** — not on an Explore dock. **Clear selection** empties both stores. Selection **survives logout**; empties only on Clear or after a successful action. After **Bookmark**, app opens **Saved** (not the empty Selection screen).
   - **Share** / **Bookmark** keep original types (collection cards / Saved collection refs + design cards / Saved design refs). They do **not** expand an album into its designs.
   - **Order** needs design lines. If any collection is selected, a resolve sheet asks per album **All designs** or **Choose designs** (open album to pick). Then existing How many each. Expanding All **dedupes** by product id. A collection is never an order line.
   - **Curate** uses **selected designs only**. Selected collections are not auto-expanded for Curate.
   - Unavailable picks stay on Your selection (faded + reason such as Archived / Not published / No longer available) — never silently dropped. **Access only** (no inventory): a design stays available while the viewer can still open it — market post, connection, chat share, **or** still a member of a published live album whose designs are visible to them. Surviving logout does not fade rows when access is unchanged.
   - **Follow** on post card header when you are not following and not connected (instant — not a request). Request access stays on the business profile.
   - Locked (`allowForward: false`): **Can’t put in a pack** under the title (before select). **Share** / **Forward** still include them. **Curate** skips locked designs **and locked collections** (no Pick designs into a pack-locked album). **Order** / **Bookmark** still work.
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

- Cold start: **Find in Explore** from empty Chats and Share sheets → browse businesses (`?show=businesses&search=1`).
- Share with no chats yet → **Find in Explore** (not a dead end); single selection still has **48h link**.
- Buying + no follows → empty followed shelf; still offer supplier discovery.
- Post feed: **Follow** on card when stranger views a discoverable post; hidden when following, connected, own post, or select mode.
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
