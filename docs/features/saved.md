# Saved & Curate pack

## Purpose

**Saved** is a personal shortlist of **references** to designs and collections (not copies). Traders use it to hold supplier posts, then assemble a **Curate pack** — their own collection whose members may be other companies’ products — and publish that pack to their buyers under the original sellers’ share rules.

**Collection bookmark and design bookmark are independent.** Bookmarking an album does not bookmark designs inside it; bookmarking a design does not bookmark its album. They appear on separate Saved tabs.

## Who uses it

Any signed-in company. **Bookmark** is available when the design/collection is discoverable (connection not required). **Curate** appears on the select bar (and Explore design detail) for anyone who can assemble a pack; first curated publish sets `canRelist` (and `canPublish` if needed).

## User flows

### Bookmark / Unbookmark

1. **Collection:** collection viewer header → **Bookmark** / **Bookmarked** (album only). Success toast may include **Open** → Saved Collections tab.
2. **Design inside a collection:** design photo sheet → **Bookmark this design** / **Design bookmarked** (toasts: **Bookmarked this design** / **Removed design bookmark**). Success toast may include **Open** → Saved Designs. Does not affect the album bookmark.
3. **Design elsewhere:** Explore design detail → **Bookmark** / **Bookmarked** (success toast may include **Open** → Saved Designs), or **Select** / long-press → bulk **Bookmark** designs.
4. Open **Saved** on **You** as the chip beside **Archived** (`/more?saved=1`; Collections + Saved via `/more?tab=collections&saved=1`; `/saved` lands there; old `?tab=saved` still works). **No Designs / Collections inside Saved.** Kind follows the page tabs: Designs → Saved, or Collections → Saved. Buyers without a library still get those two tabs (their list is Saved only). The same on-demand **Find** as the own library filters Saved by name (and shop). **Feed / Grid** toggle on the active list — last choice is remembered (device-local, shared with album viewer and My designs); **Ekum default is Feed**. Photo / mosaic tap opens, or **toggles** while Selecting. The **name always opens** (design photo sheet or collection). In the sheet, tap main photo → **PhotoViewer**. **×** removes that bookmark.
5. **Select** / long-press on **Designs** and **Collections** tabs adds to traveling **Selection** (designs → shortlist, collections → album pick). Sticky **Select all** / **Clear** for the active tab’s visible rows. Trade verbs (**Order** · **Curate** · **Bookmark** · **Share**) live on **Your selection** (`/selection`), not a Saved dock. A **company shop** may Order / Curate / Ask for rates for **that seller’s** selected designs without opening Your selection. Selection ≠ Saved bookmarks.

### Traveling Selection (Your selection)

Selection is a client pile of designs + collections (not the same as Saved). Fed from Explore, Saved, company, albums, and My designs via **Order for buyer** / **Curate** on You (published only). Survives logout; empties on **Clear selection** or after a successful Order / Curate / Bookmark / Share. Shop-dock Order / Curate / Ask removes **that seller’s** lines only — other shops stay. **Your selection** UI: image-led rows (Design / Collection · company); tap the thumbnail to open the design (`/explore/products/:id`) or collection (`/collections/:id`); **no bottom nav** (focused job); dock is **Order** (primary) then **Curate** · **Bookmark** · **Share** (secondary) — no repeated label line above the buttons. **Bookmark** from Selection opens **Saved** (Collections tab when only albums were bookmarked) so traders never land on **Nothing selected** next to a success toast. Unavailable rows stay visible (faded + reason). Open via floater count / thumbs (Chats list / Explore / Orders list), or `/selection`. Hidden on **order detail** and other page docks so those buttons stay clear; the pile stays. Floater **Order** opens Your selection and starts Order.

### Curate pack / To collection

1. Select designs (any suppliers) → sticky **Curate** → sheet **Curate pack**:
   - **New** (default) — name (**required**; may prefill from one source album or single design) → **Save draft** / **Publish to Collection** (creates a pack). Quiet link **Add to existing pack** (not New\|Existing pills). Name must be unique **in your shop** (draft or published). A supplier pack with the same title is fine. If you already have that name: in-sheet **You already have this pack.** + **Add to it**.
   - **Existing** — same sheet switches to a searchable list of owned albums (draft first, then published; no Archived) → tap row → members are **merged** (union); toast **Added to …**. Draft opens the album editor; **Published** applies immediately (toast only, stay put). No owned albums → stay on New with a short muted line.
2. Entry is **Your selection → Curate** (Trading on), or Saved/Explore select → same sheet. Deep link `/catalog/curate` still curates the current shortlist or opens Saved in select mode.
3. Publish uses the same audience / rates / relist sheet as own collections. Designs the shop cannot curate (not discoverable, or seller lock) stay **gray in the Curate sheet** with **Can't see this now** / **Can't put in a pack**. Your selection list does not use curate-check as “can't see.” Save uses the rest. If create wrote a pack and members then fail, that empty draft is deleted.
4. Sellers use the same sheet for own designs → own albums; traders need **Trading** on for foreign designs (select bar already gates Curate).
5. **Explore / Saved:** long-press albums and/or designs into Selection → act from **Your selection** (**Order** · **Curate** · **Bookmark** · **Share**). Share/Bookmark keep album + design types. Order resolves collections (All / Choose) into design lines first. **Curate** with albums uses the same resolve pattern (**Use whole pack** | **Pick designs**); designs-only skips resolve. Primary after expand: **Save draft**. Locked lines stay gray with reason (**Can't put in a pack**); **Ask to put in my pack** → chat Allow/Deny → per-company product grant (non-blocking; Waiting for Allow on that row; unlock when Allow lands). **Desk chain:** Ask from a design in **your** pack goes to **you** (under your publish allow); Ask from the mill’s own listing goes to the mill — you are not in between. Mill Allow does not auto-free your buyers. Curate continues with allowed designs (zero allowed → stay put). Distinct from **Ask to see this pack**; see [curate-album-as-is](../superpowers/specs/2026-09-04-curate-album-as-is-design.md) + [relist-ask Slice B](../superpowers/specs/2026-09-08-relist-ask-slice-b-design.md) + [desk chain](../superpowers/specs/2026-09-09-relist-desk-chain-design.md).

## Business rules

| Rule | Detail |
|------|--------|
| References only | Saved rows and curated membership point at supplier `Product` / `Collection` IDs — no duplicate catalog rows |
| Source ended | Mill **archives / unpublishes the design** → it stays on the curated pack but **grays** (**Archived** / **Not published**); no select or order. Mill only **edits their album** (add/remove members) → curated lines **do not** change. |
| Independent bookmarks | Album bookmark ≠ member design bookmarks; each is its own Saved row |
| Discoverability | Bookmark requires the actor can discover the source (audience, block, live rules) |
| Team audit | Saved rows show staff name in the card meta line (internal only) |
| Ceiling | Curate add + publish require source relist (`allowForward`) and discoverability; publish audience must not outrun source intent. **Forward** and **Bookmark** do not use this lock. |
| Pack name | Unique among **your** live albums (not Archived). Supplier names do not block. |
| Own collections | Own-product-only albums unchanged; curated packs are inferable when any member `product.companyId !== collection.companyId` |
| Consent | First curated publish grants `canRelist` |
| Opaque businesses | No Trader/Seller badges on cards |

See [collections](./collections.md) for album publish/live-window rules and [concepts](./00-concepts.md) for trust / Forward vs Curate.

## Edge cases / empty states

- Designs empty: “No bookmarked designs” — Bookmark from Explore or inside a collection.
- Collections empty: “No bookmarked collections” — Bookmark from Explore or a collection page.
- Load failure on Saved: error state (not treated as empty).
- Locked (`allowForward: false`) design: may still be savable if discoverable; cannot curate/publish into someone else’s Explore pack.
- Album bookmarks are not order/curate lines — open the album and select designs.

## Seed walkthrough

Prereq: `pnpm --filter @ekum/api db:seed`. Seeded Kavita/Ravi designs and albums are **Everyone** + **allowForward**.

1. As **Ravi** (`+919800000001`): Explore bookmark → Saved, or Explore → select designs from Meena + Kavita albums (selection survives album changes).
2. Sticky bar → **Curate** (albums → **Use whole pack** / **Pick designs**). For Pick designs: select on the album, then **Continue Curate** (or **Next collection** if more albums remain) → name → **Save draft** → **Publish to Collection**.
3. Same shortlist → **Order** → qty → confirmation lists **one chat link per supplier** (`POST /orders/batch`).
4. As **Meena** (`+919800000002`, connected to Ravi): see the curated pack when audience allows. No trader badge.

## Automated verification

- Unit: `browseShortlist.spec.ts`, `order.service.batch.spec.ts`, `curation-ceiling.spec.ts`, `saved.service.spec.ts`, `trade-access.spec.ts`
- Design: [browse-select-curate-order](../superpowers/specs/2026-08-19-browse-select-curate-order-design.md)

## Where it lives

- API: `apps/api/src/saved/`, `POST /orders/batch`, ceiling helpers in `apps/api/src/catalog/curation-ceiling.ts`
- Web: `apps/web/src/features/saved/`, `apps/web/src/features/browse/`
- Types: `packages/domain-types` (saved + catalog + orders batch)
