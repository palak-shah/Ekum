# Saved & Curate collection

## Purpose

**Saved** is a personal shortlist of **references** to designs and collections (not copies). Traders use it to hold supplier posts, then assemble a **Curate collection** — their own collection whose members may be other companies’ products — and publish that collection to their buyers under the original sellers’ share rules.

**Collection bookmark and design bookmark are independent.** Bookmarking an album does not bookmark designs inside it; bookmarking a design does not bookmark its album. They appear on separate Saved tabs.

## Who uses it

Any signed-in company. **Bookmark** is available when the design/collection is discoverable (connection not required). **Curate** appears on the select bar (and Explore design detail) for anyone who can assemble a collection; first curated publish sets `canRelist` (and `canPublish` if needed).

## User flows

### Bookmark / Unbookmark

1. **Collection:** collection viewer header → **Bookmark** / **Bookmarked** (album only). Success toast may include **Open** → Saved Collections tab.
2. **Design inside a collection:** design photo sheet → **Bookmark this design** / **Design bookmarked** (toasts: **Bookmarked this design** / **Removed design bookmark**). Success toast may include **Open** → Saved Designs. Does not affect the album bookmark.
3. **Design elsewhere:** Explore design detail → **Bookmark** / **Bookmarked** (success toast may include **Open** → Saved Designs), or **Select** / long-press → bulk **Bookmark** designs.
4. Open **Bookmark** on **You** via Find filter beside **Archived** (`/more?saved=1`; Collections + Bookmark via `/more?tab=collections&saved=1`; `/saved` lands there; old `?tab=saved` still works). **No Designs / Collections inside Bookmark.** Kind follows the page tabs: Designs → Bookmark, or Collections → Bookmark. Buyers without a library still get those two tabs (their list is Bookmark only). The same on-demand **Find** as the own library filters bookmarks by name (and shop). **Feed / Grid** toggle on the active list — last choice is remembered (device-local, shared with album viewer and My designs); **Ekum default is Feed**. Photo / mosaic tap opens, or **toggles** while Selecting. The **name always opens** (design photo sheet or collection). In the sheet, tap main photo → **PhotoViewer**. **×** removes that bookmark.
5. **Select** / long-press on **Designs** and **Collections** tabs adds to traveling **Selection** (designs → shortlist, collections → album pick). Selected tiles use the same little shrink + half-size filled check as Explore / shop / You (gap is page surface, not teal; unselected stay full color). Shared **Select** → **N selected** · **Select all** · **Clear** (Clear exits Selecting) for the active tab’s visible rows. Trade verbs (**Order** · **Repost** · **Bookmark** · **Share**) live on **Your selection** (`/selection`), not a Saved dock. A **company shop** may Order / Repost / Ask for rates for **that seller’s** selected designs without opening Your selection. Selection ≠ Saved bookmarks.

### Cart (and Explore staging)

**Cart** (`/selection`) is the parked pile of designs + collections (not the same as Saved). Explore **Select** only **stages** picks until dock **Add to cart** (add + clear checks) or **Order**. Fed from Explore, Saved, company, albums, and My designs via **Order for buyer** / **Share** / **Curate** on You (published only). Survives logout; empties on **Clear selection** or after a successful Order / Curate / Bookmark / Share. Shop-dock Order / Share removes **that seller’s** lines only — other shops stay. **Cart** UI: image-led rows (Design / Collection · company); tap the thumbnail to open the design (`/explore/products/:id`) or collection (`/collections/:id`); **no bottom nav** (focused job); dock is **Repost · Bookmark · Share** (icons) + **Order** (filled, right) — same band shape as Explore selecting — then **Clear cart**. **Bookmark** from Selection opens **Saved** (Collections tab when only albums were bookmarked) so traders never land on **Nothing selected** next to a success toast. **Order** / **Ask for rates** from Selection leave the same way: open the **first successful ticket** in **chat** (or the order page if there is no thread). Several shops still toast how many — do not dump on the Orders list. Toast still names what happened — no Open chat chip when we already left. **Clear** is the only path that stays on empty **Nothing selected**. Unavailable rows stay visible (faded + reason). Open via selection dock (**Message** · **Share** · **Order**) on **Explore** / another shop / collection Selecting, or `/selection`. Hidden on Home, Chats, Orders, You, Settings. Pile stays. Dock **Order** opens Your selection and starts Order. Dock **Message** compose → Send cards (+ note) to the owning shop; stays on page (pile stays — not cleared like Share).

### Curate collection / To collection

1. Select designs (any suppliers) → sticky **Repost** → sheet **Repost**:
   - **Choose first** (icons): **Add to existing collection** · **Add new** — not name-first.
   - **Add to existing** — searchable list of **published** owned collections → tap row → members are **merged** (union); toast **Added to …** → **You → Collections** (published list). None published → muted line + **Add new instead**.
   - **Add new** — name (**required**; may prefill from one source album or single design) → footer: quiet **Save** (bookmark, left) + primary filled **Publish** (right). **Save** → draft → **You → Collections → Draft**. **Publish** opens whom / audience (same sheet as own collections); after a successful live publish → **You → Collections** (published list). Name must be unique **in your shop** (draft or published). A supplier collection with the same title is fine. If you already have that name: in-sheet **You already have this collection.** + **Add to it**.
2. Entry is **Cart → Repost** (Trading on), or Saved/Explore select → same sheet. Deep link `/catalog/curate` still opens Repost for the current shortlist or opens Saved in select mode.
3. Publish uses the same audience / rates / relist sheet as own collections. Designs the shop cannot curate stay **in the Curate sheet** (muted why: **Can't see this now** / **Ask to put in a collection**) with **Ask** on the row and **Ask for all N** when several need it. **Save** uses the rest (**Save M**). Zero allowed: no Save — Ask or close; never a red dump of *One or more products are not visible to you.* Your selection list uses muted lock copy + Ask (not danger red). If create wrote a collection and members then fail, that empty draft is deleted.
4. Sellers use the same sheet for own designs → own albums; traders need **Trading** on for foreign designs (select bar already gates Curate).
5. **Explore / Saved:** long-press albums and/or designs into Selection → act from **Cart** (**Order** · **Repost** · **Bookmark** · **Share**). Share/Bookmark keep album + design types. Order resolves collections (All / Choose) into design lines first. **Repost** with albums uses the same resolve pattern (**Use whole collection** | **Pick designs**); designs-only skips resolve. Primary after expand: **Save draft**. Locked lines stay muted with reason (**Can't put in a collection**). **Ask to put in my collection** only when Trading is on, it is not your shop, the supplier locked **buyers can add to collections**, and follow is not look-only. Several such rows → **Ask for all N**. Look-only / not-visible stay listed with why and **no** Ask (view Ask stays on the gated collection page). Curate sheet lists blocked + saves the rest. **Desk chain:** Ask from a design in **your** collection goes to **you** (under your publish allow); Ask from the mill’s own listing goes to the mill — you are not in between. Mill Allow does not auto-free your buyers. Zero allowed → stay on the sheet. Distinct from **Ask to see this collection**; see [curate-album-as-is](../superpowers/specs/2026-09-04-curate-album-as-is-design.md) + [relist-ask Slice B](../superpowers/specs/2026-09-08-relist-ask-slice-b-design.md) + [desk chain](../superpowers/specs/2026-09-09-relist-desk-chain-design.md).

## Business rules

| Rule | Detail |
|------|--------|
| References only | Saved rows and curated membership point at supplier `Product` / `Collection` IDs — no duplicate catalog rows |
| Source ended | Mill **archives / unpublishes** after you already Saved, shared, or put it on Your selection → the leftover row stays faded with **No longer available**. Explore / shop / album do not show that design. Mill only **edits their album** (add/remove members) → curated lines **do not** change. |
| Independent bookmarks | Album bookmark ≠ member design bookmarks; each is its own Saved row |
| Discoverability | Bookmark requires the actor can discover the source (audience, block, live rules) |
| Team audit | Saved rows show staff name in the card meta line (internal only) |
| Ceiling | Curate add + publish require source relist (`allowForward`) and discoverability; publish audience must not outrun source intent. **Forward** and **Bookmark** do not use this lock. |
| Collection name | Unique among **your** live albums (not Archived). Supplier names do not block. |
| Own collections | Own-product-only albums unchanged; curated collections are inferable when any member `product.companyId !== collection.companyId` |
| Consent | First curated publish grants `canRelist` |
| Opaque businesses | No Trader/Seller badges on cards |

See [collections](./collections.md) for album publish/live-window rules and [concepts](./00-concepts.md) for trust / Forward vs Curate.

## Edge cases / empty states

- Designs empty: “No bookmarked designs” — Bookmark from Explore or inside a collection.
- Collections empty: “No bookmarked collections” — Bookmark from Explore or a collection page.
- Load failure on Saved: error state (not treated as empty).
- Locked (`allowForward: false`) design: may still be savable if discoverable; cannot curate/publish into someone else’s Explore collection.
- Album bookmarks are not order/curate lines — open the album and select designs.

## Seed walkthrough

Prereq: `pnpm --filter @ekum/api db:seed`. Seeded Kavita/Ravi designs and albums are **Followers** + **allowForward** (Meena follows Ravi; Ravi follows Kavita).

1. As **Ravi** (`+919800000001`): Explore bookmark → Saved, or Explore → select designs from Meena + Kavita albums (selection survives album changes).
2. Sticky bar → **Repost** (albums → **Use whole collection** / **Pick designs**). For Pick designs: select on the album, then **Continue Repost** (or **Next collection** if more albums remain) → **Add new** → name → **Publish**.
3. Same shortlist → **Order** → qty → confirmation lists **one chat link per supplier** (`POST /orders/batch`).
4. As **Meena** (`+919800000002`, connected to Ravi): see the curated collection when audience allows. No trader badge.

## Automated verification

- Unit: `browseShortlist.spec.ts`, `order.service.batch.spec.ts`, `curation-ceiling.spec.ts`, `saved.service.spec.ts`, `trade-access.spec.ts`
- Design: [browse-select-curate-order](../superpowers/specs/2026-08-19-browse-select-curate-order-design.md)

## Where it lives

- API: `apps/api/src/saved/`, `POST /orders/batch`, ceiling helpers in `apps/api/src/catalog/curation-ceiling.ts`
- Web: `apps/web/src/features/saved/`, `apps/web/src/features/browse/`
- Types: `packages/domain-types` (saved + catalog + orders batch)
