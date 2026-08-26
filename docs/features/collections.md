# Collections

## Purpose

Collections are **named albums** that group designs. Own albums use the seller’s library; **curated packs** may also reference other companies’ designs (see [Saved & Curate pack](./saved.md)). They are not a second photo store — membership is always designs (products).

## Who uses it

Sellers building packs for shop / Explore. Buyers view published albums via Explore or company profile (`/collections/:id`) when the album is **inside its live window**.

## User flows

### Create & edit (seller)

1. **＋ → New collection** — **Photos** and/or **Designs** (library opens as a sheet; album grid = what’s in the pack) → **name (required, empty by default)** → **Save Collection in Draft** or **Create & Publish**. First item is cover. New photos become draft designs; library picks join as-is. Designs-only is fine. After create, opens **My designs → Collections** with **Draft** or **Published** filter.
2. On edit: one plain **status line** under the title (`Published · who` / schedule; tap → Visibility when published). Sticky **Update** · **Publish** / Visibility · **Share** (broadcast). **Open** (header) or tap album photos opens the buyer album (`/collections/:id`). Back returns to My Catalog **Collections** tab. Rare actions (**Archive**, Hide) live under header **⋯** only — no status chip pile.
3. Lifecycle: **Draft → Published → Archived** (same mental model as designs). New collection CTAs: **Save Collection in Draft** / **Create & Publish**. Publish from draft.
4. Publish sheet (progressive): **Who** → **Rules** (rates / forward / **When they order** Direct vs I handle when curating others’ designs). Schedule (**When** / starts / evergreen) deferred for later — packs go live on publish. Who = Everyone / Connections / **Followers** / **Selected** (multi-select **Buyer groups** with clear selected state + member preview, or **Pick companies**). Multiple groups = member union; rates/forward use company usual then group overrides with **strictest wins** if they disagree. **Create group** / **Add group** without leaving Publish. Published packs: **Visibility** restores chosen groups (`audienceGroupIds`) so you can add another group tomorrow without a new album.
5. My Catalog → Collections: filters (Draft / Published / Archived). Each tile: name · photo count · design count · status; collage shows up to 4 previews with **`+N`** on the 4th cell when `productCount > 4` (same as Explore). Tap album → viewer; **Edit** on viewer returns to editor. **Select** (header or **long-press** a tile) → multi-publish / archive / restore.

### View (buyer)

1. Open album from Explore, company profile, or chat card → `/collections/:id` only when status is published **and** now is within `startsAt`/`endsAt`.
2. Browse member designs; **Select** / long-press → traveling shortlist (survives opening another album) → **Bookmark** / **Curate** / **Order** (multi-supplier Order splits via batch). Once **Select** / long-press starts, sticky **Select all** / **Clear** stays under the header (this album’s designs only; other-album shortlist members stay). **Selecting** with picks → clears shortlist; with none → exits select mode. Tap a design → sheet; tap the **main photo** → shared **PhotoViewer** (pinch / swipe within that design).
3. Respect connection / audience for full detail.

## Business rules

| Rule | Detail |
|------|--------|
| Membership | Many-to-many; any owned non-archived design may be added |
| Publish album | Requires ≥1 design; **auto-publishes** draft members to Explore with the pack audience, then publishes the collection |
| Forward lock | `allowForward` snapshot on publish; uncheck **Buyers can forward** → buyers cannot re-share the card (owner still can) |
| 48h share link | Share sheet: pinned then recent; quiet **Share a link · 48 hours**. Guest `/s/:token` is public. **Everyone** (live): look-only cover + name + designs; **Open on Ekum** → join → this pack. Closed: cover + name + **Request access**. Already on Ekum: skip to the real pack. Expires 48h. Not a guest shop. |
| Selected groups | `audienceGroupIds` remembered for Visibility restore; visibility still gated by `audienceCompanyIds` (union of members) |
| Multi-group rules | One pack = one rates/forward snapshot; if selected groups disagree → strictest (on_request / no-forward) |
| Live window | `startsAt` null = live on publish; `endsAt` null = Evergreen; past `endsAt` → Hide → draft (job + read guards) |
| Seller status line | List + Edit show current truth (phase · who · when) — not a chip pile or activity log |
| Unique names | Non-archived packs per company must have unique names (case-insensitive). Restore blocked if name is taken |
| Explore resurface | `exploreActivityAt` bumps on first publish / republish after hide — not on audience-only tweaks while already published |
| Hide / archive | Hide → draft (edit quietly); Archive ends the season; **Restore** (⋯ or dock) → draft again |
| Quick add photos | Creates draft **Product** rows (name from filename), not orphan photos |
| Designs vs collections | Tabs stay separate — see [concepts](./00-concepts.md) |

## Edge cases / empty states

- Collections empty: “Albums of designs from your library.”
- Publish disabled until at least one design is in the album.
- Pre-start published albums: sellers see **Starts…**; buyers do not see them.

## Seed walkthrough

1. As **Ravi**: open **Wedding Edit 2026** under Collections — published album with seeded products; badges show Live / Evergreen.
2. Create a draft album → Publish with a Buyer group → drafts become catalog-published with the album.
3. As **Meena**: open the album from Explore / notification “New drop from Surat Silk House”.

## Automated verification

- Functional: `pnpm test:e2e:functional` — `@collections` shortlist → Ask rates clears selection
- Unit: `collectionCreateHelpers`, `collectionStatusSummary`, `collection-schedule`, collection ready/publish specs
- Completeness: `2026-08-13-buyer-groups-ready-live-window-completeness.md`

## Where it lives

- Web: `apps/web/src/features/catalog/CollectionEditorPage.tsx`, `MyCatalogPage.tsx`, `collectionStatusSummary.ts`; viewer `apps/web/src/features/collections/`
- API: `apps/api/src/catalog/collection.service.ts`, `collection-schedule.ts`
- Contracts: `packages/domain-types/src/catalog.ts`
