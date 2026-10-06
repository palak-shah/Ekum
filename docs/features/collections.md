# Collections

## Purpose

Collections are **named albums** that group designs. Own albums use the seller’s library; **curated packs** may also reference other companies’ designs (see [Saved & Curate pack](./saved.md)). They are not a second photo store — membership is always designs (products).

## Who uses it

Sellers building packs for shop / Explore. Buyers view published albums via Explore or company profile (`/collections/:id`) when the album is **inside its live window**.

## User flows

### Create & edit (seller)

1. **＋** (bottom nav) opens a **Collection** sheet: **Create new collection** → **New collection**; **Update existing collection** → You **Collections** (tap a pack → viewer → **Edit** to add/remove designs). Buy-only ＋ still opens Orders; no upload cap → why-line toast. New collection: bottom nav hidden; sticky one row **Create & Publish** (primary) · **Save in Draft** (secondary). Empty and after members: one **Add designs** control (dashed foam tile) that opens **Designs** · **Photos** in that same tile (same palette; not a floating sheet). **Designs** = library picker (no camera permission). **Photos** = ContinuousCamera (stream ready before shell; **Gallery** on chrome — OS picker, including Android; must not retake via camera). Each new photo becomes a **new design**; more angles of the same design = tap tile → **Add photos**. After members: grid (cap **9** + **Load more**) + the same in-tile **Designs** · **Photos**. Camera Done = **Add N designs**. New photos get a session **SKU** (`EK-…`) as the design name until they type one (not the file name). Identity on the page, in order: **Name this pack**; **Rate** (one field; quiet **Add range** for optional To — live ₹ caption, or On request); Description; **Product description** three typeaheads (**Item** · **Quality / work** · **Size**) from official drill-down (`GET /v1/catalog/taxonomy`, filtered by what they deal in; same tree is upserted as official CatalogTags on API boot) — custom allowed at every slot; official pick narrows the next slot, custom widens to those mains only. Pack tags are the union of filled slots (appended onto members, no duplicates). **Who can see this?** is a chevron on the page (Settings prefilled). Quiet row **Apply this info to all designs** with a checkbox (selected-row chrome when on). First pack: off. After they tick or untick, the next pack on this device remembers that choice. On: stamp rate / units / MOQ / notes onto members; tags union; if a library design already has a different filled rate (including in another pack), confirm **Change** or **Keep as is**. Off: do not stamp existing members; new photos still inherit session defaults. **Order and dispatch** (optional, always visible, prefilled): Order taken in · 1 set contains · Dispatch unit · Minimum order · preview `10 sets (= 40 pcs)`. Platform usual is **set** until Catalog defaults; first official Item tag can suggest dispatch unit. **Create & Publish** publishes from the dock — if Who is incomplete, that row opens. **Save in Draft** leaves. No pack cover. After create → You → Collections. Edit keeps identity + Same-for-all expandable **below the design photos** (same order as New collection: images first). Visibility / Publish for a saved pack still uses the sheet.
2. On edit **and** own album viewer: bottom nav hidden. **Viewer** sticky dock **Add designs** · **Replace whole collection**. **Edit** sticky dock **Update collection** only (filled primary — submit name, tags, and unpublished members). **Add designs** stays on the page (not a second dock button). **Replace** is in **⋯** (before Archive). Header on Edit is **Select** · **⋯** (not a ghost **Update** next to Open). **New designs** (Photos or library) go **on top** of the album; existing keep their order. **Select** / long-press → float **Select all** · **Clear**; tiles use the same Photos-style teal check + scale as Explore (× hide while selecting); dock becomes **Delete** · **Remove from this collection**. Remove = leave this pack only. Delete on **your** designs = remove from the library when it is only in this pack; if it sits in other packs, confirm **Delete from all collections** or **Only this collection**. Delete on a **mill design you curated** = drop it from **this pack** (your curation) — it does not delete the mill’s library. Own shop name card is **hidden** on your packs (visitors still see the shop row). Publish / Visibility / Hide stay under header **⋯**. Identity fields + expandables stay on Edit, **under the design grid** (images first, like Add designs). **Open** is **⋯** → buyer album.
3. Lifecycle: **Draft → Published → Archived**. Path is **Your paths** / TradeLane — not on pack fields. Schedule (**When**) deferred — packs go live on publish. Who = **Followers** / **Selected** (buyer groups or pick companies). **Everyone** removed. Multiple groups = member union; rates/relist strictest wins.
4. My Catalog → Collections **and** Designs: the list is **published** (no Published chip). **Draft / Archived / Saved** are the Find **filter menu** (square beside search, like Orders / Explore). Pack member designs live under **Designs** as **Published** (In your packs, no solo Explore tiles) as soon as they join the pack. **Save in Draft** on New collection is the quiet exception. **Curated mill designs are not extra Designs rows** — only packs you own show on Collections; mill identity is **From {shop}** on that pack. **Grid** tile: name · then **From {shop}** / **Yours and {shop}** / **From N shops** as its own semibold line when members are foreign · then muted density. Collage shows up to 4 **design** thumbs (first photo each, never a pack cover) with **`+N`** leftover designs on the 4th cell when `productCount > 4` (`+1` for 5 designs). **Feed** on **Explore** still has the shop row. **You** and **shop catalog** Feed omit it (name is already on the page / under shell **You**). Mosaic → name → owner mill caption (when foreign members) → **N designs · date**. Up to 3 pack **tags** stay muted. No Curated chip. Collections Find matches pack name, tags, member SKU/notes, and **original mill shop names**. Tap album → viewer; **Edit** on viewer returns to editor. **Select** (header or **long-press** a tile) → multi-publish / **Hide · draft** (published) / archive / restore. On the **owner’s** curated viewer: **From {shop}** under the pack title (semibold) plus **From {shop}** on foreign design tiles; buyers still see only the pack owner. In-pack Search also matches mill shop names.

### Album viewer chrome (uniform action language)

Header is one tight row — not five equal pills:

| Control | Who | Where |
|---------|-----|--------|
| **Select** / **Selecting** | Pack with designs | Header pill. Owner: pack-manage select (Delete / Remove). Visitor: traveling shortlist. Float **Select all** + **Clear** |
| **Edit** | Owner | Header pill → editor |
| **Bookmark** | Visitor | Header pill (album save) |
| **⋯** | Everyone | Share; Feed/Grid; **Bookmark** when owner; owner also Publish / Visibility / Hide |
| Sticky dock | Owner viewer | **Add designs** · **Replace whole collection**; selecting → **Delete** · **Remove from this collection** (nav hidden) |
| Sticky dock | Owner Edit | **Update collection** only; **Add designs** on the page; **Replace** in **⋯**. Selecting → Delete · Remove |
| Sticky dock | Visitor selecting / trade | Shortlist floater / Ask · Order (unchanged) |

Default layout is the trader’s last **Feed / Grid** choice (device-local); **Ekum default is Feed** when never set. Same preference is shared with Saved and My designs. Library home is **You**; `/catalog` opens You. Also Home **My designs** when selling — no Catalog bottom tab. **＋** chooses create vs You Collections; Add designs is on You. Nav ＋ does not open Add designs.

### View (buyer)

1. Open album from Explore, company profile, or chat card → `/collections/:id` only when status is published **and** now is within `startsAt`/`endsAt`.
2. Browse member designs. Pack **Description** (if any) sits under the shop row and **above the designs** — same for visitors and the owner. Four lines; longer gets a quiet **View more** (expands in place). Header **Search** (not a permanent field) finds in this pack by design name, tags, notes, SKU, shop, unit, or rate; close clears. **Select** in the header (or long-press the photo) → traveling shortlist → dock **Share** / **Bookmark** / **Curate** / **Order**. **Curated pack (visitor):** **Order goes to {pack shop} · You chat with them. They send the mill lots on** only when Your paths ticket for this buyer × those mills is **me** (I handle). Ticket **mill** (Direct) hides that line. Place is still from-pack with the pack owner. **Ask for rates** · **Order** sit in a sticky dock (portaled above the tab bar, nav hidden while the dock is up) for any **visitor** on a **published** pack with designs (origin or curated; hidden while this album is selecting). Both open **How many each** on origin packs too — not only curated I-handle packs. `/collections/new` opens create (`/catalog/collections/new`). **1 design** when the pack has one. Select on this album starts from **Select**, **long-press**, **Select design** in the photo sheet, **Select all**, or **Choose designs** from Your selection / shop dock — a pile from the shop or Explore does **not** lock the album. Once this album is selecting, sticky **Select all** + **Clear** under the header (this album’s designs). Photo tap **toggles** pick; the **name always opens** the design sheet (more photos). In the sheet, tap the **main photo** → shared **PhotoViewer**.
3. Respect connection / audience / **Granted on request** for full detail. Gated packs: **Ask to see this pack** (Allow/Deny in owner chat) — look through only; not Connect; not Curate unlock.

## Business rules

| Rule | Detail |
|------|--------|
| Membership | Many-to-many; any owned non-archived design may be added |
| Publish album | Requires ≥1 design; publishes the **collection** on Explore. Own draft members become **Published** for Order / Share / Curate **inside** the pack, but do **not** get `postedToMarketAt` (no separate Explore design tiles — avoids flooding buyers when a pack has many designs). Publish a design from My designs later to put it alone on Explore — unless a **live pack already on that feed** still includes it (then the pack stays and the solo tile is omitted). |
| Relist lock | `allowForward` snapshot. Uncheck **Buyers can add these designs to their collections** → they cannot **Curate** it. **Forward** the card is still free. |
| Download lock | `allowDownload` on pack + member designs. Uncheck **Buyers can download these designs** → buyers must not export photos (buyer export UI may follow). Default from Settings; else off. |
| Shop defaults | Habitual Who / rates / curate / download / order-and-dispatch live in **Settings**; New collection inherits until tweaked. |
| Curated member ended | Unpublished members are **not** on Explore, shop, or the album viewer (count is live designs only). Editor still lists them. **Hide from Explore** is the only pack unpublish. Adding your own designs/photos to a pack **publishes** them with the pack’s who / rates (no Explore design tiles). **Replace** waits until the new set is saved. New photos are library designs and stay published with a live pack. |
| Share to chat | Share sheet posts cards into a **chat** (not broadcast). Allowed when you own it, it was already in a chat you’re in, or it’s discoverable on Explore (e.g. Followers pack you are **allowed** to follow). |
| 48h share link | Share sheet: pinned then recent; quiet **Share a link · 48 hours**. One door per chat unit: each album, one leftover design, or **2+ leftover designs** (kind `designs` — collage of designs, not a Collection). Mix (album + design) keeps the row — one tap, N URLs in the body (not one fake pack token). If Share or clipboard cannot run, the sheet keeps the URLs to select and copy. WhatsApp preview: **seller · pack/design(s)**, blurred collage teaser (`/share-links/:token/og-image`). Guest `/s/:token` is public. **Everyone** (live): look-only design collage + name + designs; **Open on Ekum** → join → pack, design, or virtual set `/designs/set?ids=…` (per-design access). Closed: collage + name + **Request access** (OG may still tease thumbs). Already on Ekum: pack/design jump to live viewer; **designs** → `/designs/set` (Feed/Grid first; tap a design for PhotoViewer; rate / photos / min / tags / **From {shop}** per design). Expires 48h. Not a guest shop. |
| Selected groups | `audienceGroupIds` remembered for Visibility restore; visibility still gated by `audienceCompanyIds` (union of members) |
| Multi-group rules | One pack = one rates/forward snapshot; if selected groups disagree → strictest (on_request / no-forward) |
| Live window | `startsAt` null = live on publish; `endsAt` null = Evergreen; past `endsAt` → Hide → draft (job + read guards) |
| Seller status line | List + Edit show current truth (phase · who · when) — not a chip pile or activity log |
| Unique names | Non-archived packs per company must have unique names (case-insensitive). On New collection a taken name opens a sheet: **Add to that pack** (append designs) or **I’ll use another name** — not a red error. Restore blocked if name is taken. |
| Explore resurface | `exploreActivityAt` bumps on first publish / republish after hide — not on audience-only tweaks while already published |
| Hide / archive | Hide → draft (edit quietly); Archive ends the season; **Restore** (⋯ or dock) → draft again |
| Quick add photos | Creates draft **Product** rows (name from filename), not orphan photos. Capture matches Add designs (ContinuousCamera on phone). |
| Own manage dock | Owner viewer + Edit: Add / Replace; select Delete / Remove. Replace clears members then opens Add. Delete sole-pack → product delete; multi-pack → confirm all vs this pack only. |
| Owner name card | Hidden on own packs; visitors still see shop row. |
| Designs vs collections | Tabs stay separate — see [concepts](./00-concepts.md) |

## Edge cases / empty states

- Collections empty: “Albums of designs from your library.”
- Publish disabled until at least one design is in the album.
- Pre-start published albums: sellers see **Starts…**; buyers do not see them.

## Seed walkthrough

1. As **Ravi**: open **Wedding Edit 2026** under Collections — published album with seeded products; badges show Live / Evergreen.
2. Create a draft album → Publish with a Buyer group → pack is on Explore; member drafts become Published without separate Explore design tiles.
3. As **Meena**: open the album from Explore / notification “New drop from Surat Silk House”.

## Automated verification

- Functional: `pnpm test:e2e:functional` — `@collections` shortlist → Ask rates; create publish; Add designs Designs/Photos; nav ＋ create vs You Collections
- Unit: `collectionCreateHelpers`, `collectionSameForAll`, `rateInput`, `categoryCascade`, `orderDispatchPreview`, `collectionStatusSummary`, collection ready/publish specs, `createFabIntent`, `CreateCollectionFabSheet`
- Completeness: `2026-10-06-new-collection-wireframe-completeness.md`; `2026-09-18-collection-same-for-all-completeness.md`; `2026-09-29-nav-plus-collection-choice-completeness.md`; `2026-10-04-own-pack-manage-dock-completeness.md`; `2026-10-06-collection-photo-set-live-completeness.md`
- Unit: `ownerPackManage`, `OwnerPackManageDock`, `collectionViewerChrome` (owner dock / hide name card); API `otherPackCounts`; `canSetMemberLiveInPack`; setProducts does not re-check existing members when adding a photo

## Where it lives

- Web: `apps/web/src/features/catalog/CollectionEditorPage.tsx`, `MyCatalogPage.tsx`, `collectionStatusSummary.ts`; viewer `apps/web/src/features/collections/`
- API: `apps/api/src/catalog/collection.service.ts`, `collection-schedule.ts`
- Contracts: `packages/domain-types/src/catalog.ts`
