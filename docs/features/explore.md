# Explore & search

## Purpose

Discovery surface for posts (collections and designs), businesses, and federated search. Ranking is **opportunity / interest**, not engagement vanity metrics. Network nodes are **companies**, not individual people. Publishers are opaque **businesses** (no trader/seller labels).

## Who uses it

Buyers, sellers, and dual-role companies. Explore is not limited to “seller catalog only” — curated packs from dual-network companies publish here too.

## User flows

1. Open **Explore** (`/explore`) — **Stories** rail, then shelves / filters. Feed chrome is Chats-tight (36px shop avatar, small Stories, `gap-2.5` between search / Stories / posts). Pack mosaic + pack name use the same page gutter as the header (`px-4`) — inset from the screen, not shoved under the shop name.
2. **Filter square** — root: **Change View** · **Select Category** · **Select City** · (dual only) **Explore Buyers** / **Explore Suppliers**. Content type: **View Items By** — All Feeds / Collections Only / Designs Only / Businesses Only (`?show=`). Category and city are multi-select (starts-with search, Confirm). **Clear** on a Category or City row clears that facet only. No All / Buying / Selling chips.
3. Tap a Story → filter posts from that business (`?story=`); Clear or Open shop if no posts in shelf.
4. **Buying** = posts (and Stories). **Selling** = **Buyers for you** only. Selling never shows My Catalog. Suggested-supplier shelf is not on the buying feed — directory is filter square → **Businesses Only**.
5. Filter by one or more categories / cities (OR within a facet, AND together). Collection and design **tags** (`categories` labels) match Explore search `q` the same way as product categories — **case-insensitive** exact label match (so `bedsheet` finds a pack tagged `Bedsheet`).
6. See new packs (ask); open album or design detail (`/explore/products/:id`, `/collections/:id`). Explore chrome is **search + Filter square + Select** (shop’s Select pill, not a Saved or Selection square — Saved is **You → Saved**; Selection is the floater when the pile is non-empty). **Select** is hidden while searching, on Selling, and on Businesses Only. Design page is tight: full-bleed square photo (tap → PhotoViewer, swipe more photos there), one company row, rate / min / notes — no second “View business” link and no filmstrip of small cards. Sticky **Curate · Ask for rates · Order** is **visitors only** on a visible design (same as pack `visitor`) — owner never sees that dock, including when Selling or Trading is on.
   - **Start pick with Select** (same as shop / Saved). Then tap the mosaic or photo to add. Long-press still works as a shortcut. **Album:** mosaic → select album. **Design:** photo → select design. Both can stay selected together (types preserved — albums stay albums). Same traveling **Selection** as Saved, company shop, curated albums, and My designs/collections. Long-press uses a non-link press target so iOS Safari does **not** show Open / Open in New Tab. Idle short tap on the photo / mosaic opens the album or design. While **Selecting**, the photo / mosaic **toggles** pick; the **name always opens** (collection or design — more photos). Design cards show the **first photo only** (extra photos on the design page). Long-press select must **stick** (Android: ghost click after entering select mode must not toggle the item off).
   - Small floater chip above bottom nav when the pile is non-empty **and** you are still picking: **Explore**; **shared design set**; **another shop** when that shop’s trade dock is **not** up; a **design or pack while Selecting**. Count + thumbs open **Your selection**; accent **Order** starts Order. Hidden on Home, Chats, Orders, You, Settings, Network, own shop, `/selection`, and whenever Ask / Order / shop dock owns the band. Pile is not cleared when the floater hides. No drag-to-move pill.
   - Other trade verbs live on **Your selection** — **Curate** (Trading on) · **Bookmark** · **Share** — not on an Explore feed dock. **Order** is on the floater and again as the primary on Your selection. **Company shop** is the exception: when this seller has selected designs, **Order** · **Ask for rates** · **Curate** run on that page for **this shop’s** lines only (see [company.md](./company.md)). **Clear selection** empties both stores. Selection **survives logout**; empties only on Clear or after a successful action. After **Bookmark**, app opens **Saved** (not the empty Selection screen). After **Order** / **Ask for rates**, app opens the **first successful ticket** in **chat** (or the order page) — not the Orders list, not empty Your selection. **Your selection** hides the bottom nav (dock owns the band).
   - **Share** / **Bookmark** keep original types (collection cards / Saved collection refs + design cards / Saved design refs). They do **not** expand an album into its designs. **Share** opens a sheet to pick **one or many** companies (Find on Ekum, Clear) and posts into those chats — not buyer-group Broadcast.
   - **Order** needs design lines. If any collection is selected, a resolve sheet asks per album **All designs** or **Choose designs** (open album to pick). **Continue** expands All into How many each. A locked pack (no design list) opens that album instead of a “not listed yet” error. Empty pack: **{name} has no designs.** Expanding All **dedupes** by product id. A collection is never an order line.
   - **Curate** uses **selected designs only**. Selected collections are not auto-expanded for Curate.
   - Unavailable picks stay on Your selection (faded + reason such as Archived / Not published / No longer available) — never silently dropped. **Access only** (no inventory): a design stays available while the viewer can still open it — market post, connection, chat share, **or** still a member of a published live album whose designs are visible to them. Surviving logout does not fade rows when access is unchanged. **Curate-check** (`Can't see this now`) is **not** a list reason — it only skips those ids when saving a pack. Seller lock on the list stays **Can't put in a pack** + Ask.
   - **See new packs** on post card header when you are not allowed, not pending, and not connected (asks — not instant). Hidden when pending, already seeing packs, connected, own post, or select mode. Shop header is **name + GST tick** and **city · categories** (not Connected / GST chip). Posted date sits under the pack or design title, not beside the name. Shop **Message** is the first-chat path.
   - Pack page header subtitle is **N designs · ₹low–₹high /unit** when loaded members share one sold-as unit and at least one rate (space before the unit). Mixed units, all On request, or no member list → count only.
   - Design cards (search tile, pack tile, pack photo sheet) always show the shop name. Owner viewing a curated foreign member still uses **From {shop}**.
   - Locked (`allowForward: false`): **Can’t put in a pack** under the title (before select). **Share** / **Forward** still include them. **Curate** skips locked designs **and locked collections** (no Pick designs into a pack-locked album). **Order** / **Bookmark** still work.
   - **Select** sits after Filter (text pill, not a square). Selecting does not lock the feed: tap the name to open. No Select-all on the mixed Explore feed.
7. Search — federated company / collection / design; feed stays until the user types (UX rule). Idle bar and focused field share **Search supplier, collection or design** — no GST (GST is profile / Find on Ekum). Category copy uses human labels (`Women's apparel`, never `womens_apparel`) on the feed relevance line, search chips, design tags, and shop tags.
8. From company cards → public profile → follow / request access / chat.

### Trade-side

User control is **Buying** or **Selling** only (`?side=`). Dual presence (I buy + I sell) defaults to **Buying**; last filter row is **Explore Buyers** (→ Selling) or **Explore Suppliers** (→ Buying). Buy-only / sell-only stay in that side; the row is hidden. Old `?side=all` is treated as Buying for dual (Buying for buy-only; Selling for sell-only).

| Side | Intent |
|------|--------|
| **Buying** | Ranked feed: **allowed follows first**, then **connected + your categories**, then **category matches**; **Received** packs by UTC day then business (directed audience or broadcast — not Everyone-market); Stories for allowed-follow / connected publishers who posted |
| **Selling** | **Buyers for you** — companies whose buy interests match what you sell. Not My Catalog. Requires sell categories on your profile. |

## Business rules

| Rule | Detail |
|------|--------|
| Visibility | Blocked companies never appear; audience (`everyone` / `connections` / `followers` / `selected`) enforced server-side |
| Designs on Explore | Published designs with `postedToMarketAt` (Publish sets both). On Explore home and the mixed feed, if that design is already a member of a **live pack in the same result**, hide the solo tile — the pack is the album. Solo Publish still shows when the design is not on a visible live pack. **Designs Only** still lists posted designs. |
| Collections on Explore | Published albums with activity / live-window rules — see [collections](./collections.md) |
| Follow | Ask; Buying side prioritizes **allowed** followed publishers’ posts. Pending never ranks as a follow. |
| Ranking (feed) | Interest / opportunity matching (`feed-rank`, `interest-match`) — not likes/viral scores. **Seen posts** sink within a tier until the post has newer activity (device-local for now; server sync later at scale). Explore home shows **12 posts** then **More posts** so discovery shelves are not buried. |
| Stories | Company appears when viewer is an **allowed** follower or is connected and company has **published** to feed (own or curated). Rank by recent publish; hide rail when empty; not Instagram personal stories |
| Role opacity | No Trader / Seller badges on Stories or cards |
| Businesses directory | Filter square → **Businesses Only**. Not mixed into the buying post feed. |
| Businesses tab | Directory = **2-col grid** of company tiles (one cover). Companies with live Explore posts (not self, not blocked). Rank: **interest match first**, then **newest post activity** |
| Why-lines | Ranking may still use Connected / match internally. **On screen** the shop line is city · sell categories. GST is a tick by the name. |
| Curated packs | Publish curated collections (multi-supplier, within original seller forward/audience). Capability `relist`. See [saved](./saved.md) |

## Edge cases / empty states

- Cold start: **Find in Explore** / **Find on Ekum** from empty Chats and Share sheets → browse or look up businesses.
- **Share** (Selection / album / collection): multi-select connected companies (select · deselect · **Clear**), **Find on Ekum**, primary **Share** / **Share with N** → posts collection cards and design cards into each chat (`POST /threads/direct` then messages). Share is **not** an access check: published pack-only designs (no Explore tile) share like market posts. If the recipient cannot open a design, they **Ask the supplier** on that design — same as a gated pack. **2+ designs** post as **one** chat collage (`design_album`, **View designs →** → `/designs/set?ids=…` — not a Collection). That path opens the set page (tiles), not a photo strip. Tap a design for photos; from chat, **Quote** one design (same as photo Quote) so they can discuss it in the thread. Set page = Feed/Grid (same pill as Saved / shop) + **Select** (same as album). PhotoViewer only after a tap, in share order. While Selecting, **N selected · Select all · Clear** is a pill under Select (same as shop) — not a second header bar. Visible designs go on the traveling pile; Order / Ask rates on the floater. Locked tiles stay out. Each design shows available facts (rate, photos, min, tags, **From {business}**). Opens that chat when exactly one recipient. Buyer groups stay on Publish / Network — not on this sheet. **Share a link · 48 hours** for every shareable unit (same cards as chat): each album, one leftover design, or **2+ leftover designs** as one `designs` door. A mix (e.g. 1 collection + 1 design) does **not** hide 48h — one tap mints **N** links and puts every URL in the message body. If Share or clipboard cannot run, the sheet keeps the URLs to select and copy. After join, each token opens that pack, design, or virtual set.
- Share with no connections yet → **Find on Ekum** + **Find in Explore** (not a dead end); 48h still offered whenever there is a shareable unit (solo, designs-only, or mix).
- Buying + no follows → empty followed shelf; still offer supplier discovery.
- Post feed: **See new packs** on the card when a stranger is not already seeing packs; hidden when pending, following, connected, own post, or select mode. Date under the post.
- Selected-audience posts hidden from non-selected viewers.
- Story with no posts in current shelves → Open shop → company profile.
- **Explore Buyers** with no sell categories → explain why the shelf is empty and link to **Business profile** (`/settings/profile?focus=sell`) — already editing; scrolls to **Categories you sell** and keeps that field highlighted until Update.

## Seed walkthrough

1. As **Meena**: Explore → Stories / feed → Surat Silk House / Wedding Edit. Directory: filter → **Businesses Only**.
2. Seed Meena already has an allowed follow of Ravi; confirm **I see theirs** under **You → Network**. A new Follow tap asks — not instant.
3. As **Ravi**: Explore → Stories / feed → Ahmedabad Loom Co (peer fabric supplier); **Buyers for you** → Jaipur Emporium.
4. As **Ravi**: post a design to Explore → confirm Meena can see it when audience is connections/everyone.

## Automated verification

- Functional: `pnpm test:e2e:functional` — `@explore` browse, filter dismiss, open collection
- Regression: `omit-covered-design-feed-rows.spec.ts`; `cards.selectOpen.spec.tsx` (first photo + name opens); `exploreProductChrome.spec.ts` (dock visitors only)
- Completeness: `docs/superpowers/reviews/completeness/2026-08-11-explore-completeness.md`; Slice C `2026-08-22-explore-trade-side-completeness.md`; filter panels `2026-08-23-explore-filter-panels-completeness.md`; pack-covered `2026-09-25-explore-pack-covered-designs-completeness.md`

## Where it lives

- Web: `apps/web/src/features/explore/`
- API: `apps/api/src/discovery/` (`ExploreHomeView.stories`, `receivedByDay`, `receivedCurated`)
- Contracts: `packages/domain-types/src/discovery.ts`
- Platform / trader decisions: [mvp-garmenthub-gap-matrix.md](../superpowers/reviews/mvp-garmenthub-gap-matrix.md)
