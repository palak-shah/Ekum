# Collections

## Purpose

Collections are **named albums** that group designs. Own albums use the seller’s library; **curated packs** may also reference other companies’ designs (see [Saved & Curate pack](./saved.md)). They are not a second photo store — membership is always designs (products).

## Who uses it

Sellers building packs for shop / Explore. Buyers view published albums via Explore or company profile (`/collections/:id`) when the album is **inside its live window**.

## User flows

### Create & edit (seller)

1. **＋ → New collection** — **Photos** and/or **Designs** (library opens as a sheet; album grid = what’s in the pack) → **name (required, empty by default)** → **Save Collection in Draft** or **Create & Publish**. First item is cover. **Photos** uses the same capture as **Add designs**: phone ContinuousCamera (Gallery on that chrome); desktop file multi-select. New photos become draft designs; library picks join as-is. Designs-only is fine. After create, opens **My designs → Collections** with **Draft** or **Published** filter.
2. On edit: one plain **status line** under the title (`Published · who` / schedule; tap → Visibility when published). Sticky **Update** · **Publish** / Visibility · **Share** (broadcast). **Open** (header) or tap album photos opens the buyer album (`/collections/:id`). Back returns to My Catalog **Collections** tab. Rare actions (**Archive**, Hide) live under header **⋯** only — no status chip pile.
3. Lifecycle: **Draft → Published → Archived** (same mental model as designs). New collection CTAs: **Save Collection in Draft** / **Create & Publish**. Publish from draft.
4. Publish sheet (progressive): **Who** → **Rules** (rates / **Buyers can add these designs to their collections**). Path is **Your paths** / TradeLane — not on Publish or pack fields (first pair I handle + no group; see [orders Dual trade](./orders.md)). `Collection.orderPathPreference` is legacy (API returns null; column may remain). Schedule (**When** / starts / evergreen) deferred for later — packs go live on publish. Who = Everyone / **Followers** / **Selected** (multi-select **Buyer groups** with clear selected state + member preview, or **Pick companies**). **My connections** is not offered (connections include suppliers). Multiple groups = member union; rates/relist use company usual then group overrides with **strictest wins** if they disagree. **Create group** / **Add group** without leaving Publish. Published packs: **Visibility** restores chosen groups (`audienceGroupIds`) so you can add another group tomorrow without a new album.
5. My Catalog → Collections: filters (Draft / Published / Archived). Each tile: name · photo count · design count · status; collage shows up to 4 previews with **`+N`** on the 4th cell when `productCount > 4` (same as Explore). Owner-only quiet line when members include others (*From {shop}* / *From 3 shops* / *Yours and {shop}*). No Curated chip. Tap album → viewer; **Edit** on viewer returns to editor. **Select** (header or **long-press** a tile) → multi-publish / **Hide · draft** (published) / archive / restore. On the **owner’s** curated viewer: same quiet pack line plus *From {shop}* on foreign design tiles; buyers still see only the pack owner.

### Album viewer chrome (uniform action language)

Header is one tight row — not five equal pills:

| Control | Who | Where |
|---------|-----|--------|
| **Select** / **Selecting** | — | No header pill on album. **Long-press** a design to start; float shows **Select all** + **Clear** |
| **Edit** | Owner | Header pill → editor |
| **Bookmark** | Visitor | Header pill (album save) |
| **⋯** | Everyone | Share; Feed/Grid; **Bookmark** when owner |
| Sticky dock | Selecting | **Share** · Curate · Order (same verbs as Explore) |

Default layout is **grid**. Library home stays **You → My designs** (`/catalog`); also **＋ → My designs** and Home **My designs** when selling — no Catalog bottom tab.

### View (buyer)

1. Open album from Explore, company profile, or chat card → `/collections/:id` only when status is published **and** now is within `startsAt`/`endsAt`.
2. Browse member designs; **long-press** → traveling shortlist → dock **Share** / **Bookmark** / **Curate** / **Order**. Once selecting starts, sticky **Select all** + **Clear** under the header (this album’s designs). Tap a design → sheet; tap the **main photo** → shared **PhotoViewer**.
3. Respect connection / audience / **Granted on request** for full detail. Gated packs: **Ask to see this pack** (Allow/Deny in owner chat) — look through only; not Connect; not Curate unlock.

## Business rules

| Rule | Detail |
|------|--------|
| Membership | Many-to-many; any owned non-archived design may be added |
| Publish album | Requires ≥1 design; publishes the **collection** on Explore. Own draft members become **Published** for Order / Share / Curate **inside** the pack, but do **not** get `postedToMarketAt` (no separate Explore design tiles — avoids flooding buyers when a pack has many designs). Publish a design from My designs later to put it alone on Explore. |
| Relist lock | `allowForward` snapshot (product: allowRelist). Uncheck **Buyers can add these designs to their collections** → they cannot **Curate** it. **Forward** the card is still free. View/audience checked when they open. |
| Share to chat | Share sheet posts cards into a **chat** (not broadcast). Allowed when you own it, it was already in a chat you’re in, or it’s discoverable on Explore (e.g. Followers pack you follow). |
| 48h share link | Share sheet: pinned then recent; quiet **Share a link · 48 hours**. Guest `/s/:token` is public. **Everyone** (live): look-only cover + name + designs; **Open on Ekum** → join → this pack. Closed: cover + name + **Request access**. Already on Ekum: skip to the real pack. Expires 48h. Not a guest shop. |
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

- Functional: `pnpm test:e2e:functional` — `@collections` shortlist → Ask rates clears selection
- Unit: `collectionCreateHelpers`, `collectionStatusSummary`, `collection-schedule`, collection ready/publish specs
- Completeness: `2026-08-13-buyer-groups-ready-live-window-completeness.md`

## Where it lives

- Web: `apps/web/src/features/catalog/CollectionEditorPage.tsx`, `MyCatalogPage.tsx`, `collectionStatusSummary.ts`; viewer `apps/web/src/features/collections/`
- API: `apps/api/src/catalog/collection.service.ts`, `collection-schedule.ts`
- Contracts: `packages/domain-types/src/catalog.ts`
