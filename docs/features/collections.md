# Collections

## Purpose

Collections are **named albums** that group designs. Own albums use the seller’s library; **curated packs** may also reference other companies’ designs (see [Saved & Curate pack](./saved.md)). They are not a second photo store — membership is always designs (products).

## Who uses it

Sellers building packs for shop / Explore. Buyers view published albums via Explore or company profile (`/collections/:id`) when the album is **inside its live window**.

## User flows

### Create & edit (seller)

1. **＋ → New collection** — Bottom nav hidden; sticky one row **Create & Publish** (primary) · **Save in Draft** (secondary). Empty: one **Designs** invite (camera). After shots: grid (cap **9** + **Load more**) + compact **Add designs**. Phone/desktop camera: shutter, **Gallery**, **Designs**. Identity on the page: **Name this pack**, Description, pack **Tags**. Those tags apply to every design in the pack (appended, no duplicates); a design can already have its own. **Same for all designs** is a chevron expandable (not a sheet): rate, unit, MOQ, notes. **Pieces in one set** only when unit is **set**. **Who can see this?** is a chevron on the page (not a sheet; Settings prefilled). **Create & Publish** publishes from the dock — if Who is incomplete, that row opens. **Save in Draft** leaves. No pack cover. After create → You → Collections. Edit keeps identity + Same-for-all expandable; Visibility / Publish for a saved pack still uses the sheet.
2. On edit: status line under the title; sticky **Update** · **Publish** / Visibility · **Share**. Same always-visible fields + three expandables. **Open** / album photos → buyer album. Rare actions under **⋯**.
3. Lifecycle: **Draft → Published → Archived**. Path is **Your paths** / TradeLane — not on pack fields. Schedule (**When**) deferred — packs go live on publish. Who = **Followers** / **Selected** (buyer groups or pick companies). **Everyone** removed. Multiple groups = member union; rates/relist strictest wins.
4. My Catalog → Collections **and** Designs: filters **Published / Draft / Archived** only (no All; default Published). Pack member designs always live under **Designs** (Draft until pack publish, then **In packs** without solo Explore tiles). Each collection tile: name · photo count · design count · status; collage shows up to 4 **design** thumbs (first photo each, never a pack cover) with **`+N`** leftover designs on the 4th cell when `productCount > 4` (`+1` for 5 designs). Same on Explore and shop. Owner-only quiet line when members include others (*From {shop}* / *From 3 shops* / *Yours and {shop}*). No Curated chip. Tap album → viewer; **Edit** on viewer returns to editor. **Select** (header or **long-press** a tile) → multi-publish / **Hide · draft** (published) / archive / restore. On the **owner’s** curated viewer: same quiet pack line plus *From {shop}* on foreign design tiles; buyers still see only the pack owner.

### Album viewer chrome (uniform action language)

Header is one tight row — not five equal pills:

| Control | Who | Where |
|---------|-----|--------|
| **Select** / **Selecting** | — | No header pill on album. **Long-press** a design to start; float shows **Select all** + **Clear** |
| **Edit** | Owner | Header pill → editor |
| **Bookmark** | Visitor | Header pill (album save) |
| **⋯** | Everyone | Share; Feed/Grid; **Bookmark** when owner |
| Sticky dock | Selecting | **Share** · Curate · Order (same verbs as Explore) |

Default layout is the trader’s last **Feed / Grid** choice (device-local); **Ekum default is Feed** when never set. Same preference is shared with Saved and My designs. Library home is **You**; `/catalog` opens You. Also Home **My designs** when selling — no Catalog bottom tab. **＋** creates (Add designs / New collection); it does not open the library.

### View (buyer)

1. Open album from Explore, company profile, or chat card → `/collections/:id` only when status is published **and** now is within `startsAt`/`endsAt`.
2. Browse member designs. Header **Search** (not a permanent field) finds in this pack by design name, tags, notes, SKU, shop, unit, or rate; close clears. **Long-press** the photo → traveling shortlist → dock **Share** / **Bookmark** / **Curate** / **Order**. **Curated pack (visitor):** **Order goes to {pack shop} · You chat with them. They send the mill lots on** only when Your paths ticket for this buyer × those mills is **me** (I handle). Ticket **mill** (Direct) hides that line. Place is still from-pack with the pack owner. **Ask for rates** · **Order** sit in a sticky dock like a design page for any **visitor** on a **published** pack with designs (origin or curated; hidden while this album is selecting). `/collections/new` opens create (`/catalog/collections/new`). **1 design** when the pack has one. Select on this album starts only from **long-press**, **Select design** in the photo sheet, **Select all**, or **Choose designs** from Your selection / shop dock — a pile from the shop or Explore does **not** lock the album. Once this album is selecting, sticky **Select all** + **Clear** under the header (this album’s designs). Photo tap **toggles** pick; the **name always opens** the design sheet (more photos). In the sheet, tap the **main photo** → shared **PhotoViewer**.
3. Respect connection / audience / **Granted on request** for full detail. Gated packs: **Ask to see this pack** (Allow/Deny in owner chat) — look through only; not Connect; not Curate unlock.

## Business rules

| Rule | Detail |
|------|--------|
| Membership | Many-to-many; any owned non-archived design may be added |
| Publish album | Requires ≥1 design; publishes the **collection** on Explore. Own draft members become **Published** for Order / Share / Curate **inside** the pack, but do **not** get `postedToMarketAt` (no separate Explore design tiles — avoids flooding buyers when a pack has many designs). Publish a design from My designs later to put it alone on Explore — unless a **live pack already on that feed** still includes it (then the pack stays and the solo tile is omitted). |
| Relist lock | `allowForward` snapshot. Uncheck **Buyers can add these designs to their collections** → they cannot **Curate** it. **Forward** the card is still free. |
| Download lock | `allowDownload` on pack + member designs. Uncheck **Buyers can download these designs** → buyers must not export photos (buyer export UI may follow). Default from Settings; else off. |
| Shop defaults | Habitual Who / rates / curate / download / sell-as live in **Settings**; New collection expandables inherit until tweaked. |
| Curated member ended | Foreign (or own) member whose **design** is no longer Published: gray on viewer + editor with the same reasons as Selection. Not a live link to the source album. |
| Share to chat | Share sheet posts cards into a **chat** (not broadcast). Allowed when you own it, it was already in a chat you’re in, or it’s discoverable on Explore (e.g. Followers pack you are **allowed** to follow). |
| 48h share link | Share sheet: pinned then recent; quiet **Share a link · 48 hours**. One door per chat unit: each album, one leftover design, or **2+ leftover designs** (kind `designs` — collage of designs, not a Collection). Mix (album + design) keeps the row — one tap, N URLs in the body (not one fake pack token). WhatsApp preview: **seller · pack/design(s)**, blurred collage teaser (`/share-links/:token/og-image`). Guest `/s/:token` is public. **Everyone** (live): look-only design collage + name + designs; **Open on Ekum** → join → pack, design, or virtual set `/designs/set?ids=…` (per-design access). Closed: collage + name + **Request access** (OG may still tease thumbs). Already on Ekum: pack/design jump to live viewer; **designs** → `/designs/set` (PhotoViewer + **From {shop}** per design). Expires 48h. Not a guest shop. |
| Selected groups | `audienceGroupIds` remembered for Visibility restore; visibility still gated by `audienceCompanyIds` (union of members) |
| Multi-group rules | One pack = one rates/forward snapshot; if selected groups disagree → strictest (on_request / no-forward) |
| Live window | `startsAt` null = live on publish; `endsAt` null = Evergreen; past `endsAt` → Hide → draft (job + read guards) |
| Seller status line | List + Edit show current truth (phase · who · when) — not a chip pile or activity log |
| Unique names | Non-archived packs per company must have unique names (case-insensitive). Restore blocked if name is taken |
| Explore resurface | `exploreActivityAt` bumps on first publish / republish after hide — not on audience-only tweaks while already published |
| Hide / archive | Hide → draft (edit quietly); Archive ends the season; **Restore** (⋯ or dock) → draft again |
| Quick add photos | Creates draft **Product** rows (name from filename), not orphan photos. Capture matches Add designs (ContinuousCamera on phone). |
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

- Functional: `pnpm test:e2e:functional` — `@collections` shortlist → Ask rates; create publish; same-for-all row
- Unit: `collectionCreateHelpers`, `collectionSameForAll`, `rateInput`, `collectionStatusSummary`, collection ready/publish specs
- Completeness: `2026-09-18-collection-same-for-all-completeness.md`

## Where it lives

- Web: `apps/web/src/features/catalog/CollectionEditorPage.tsx`, `MyCatalogPage.tsx`, `collectionStatusSummary.ts`; viewer `apps/web/src/features/collections/`
- API: `apps/api/src/catalog/collection.service.ts`, `collection-schedule.ts`
- Contracts: `packages/domain-types/src/catalog.ts`
