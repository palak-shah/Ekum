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
4. Open **Saved** from the **Explore header bookmark**, **＋ → Saved**, or More → Saved (`/saved`). Tabs **Designs** | **Collections** (default Designs; `?tab=collections`). Grid/Feed toggle on the active tab. Tap design → photo sheet (tap main photo → **PhotoViewer**); tap collection → collection viewer; **×** to remove that bookmark.
5. **Select** / long-press only on the **Designs** tab. Sticky **Select all** / **Clear** for saved designs. Switching to Collections exits select mode. Sticky bar: **Curate** / **Order**.

### Traveling browse shortlist

Selection is a **session** set of design ids (not the same as Saved). It survives Explore ↔ albums ↔ Saved until Clear, successful Order / Curate (new or add to existing), or session end. **Select design** on a collection sheet adds to this shortlist only — not to Saved Designs.

### Curate pack / To collection

1. Select designs (any suppliers) → sticky **Curate** → sheet **Curate pack**:
   - **New** — name (**required, empty by default**; no auto name) → **Save Collection in Draft** / **Publish to Collection** (creates a pack).
   - **Existing** — pick an owned album (draft first, then published) → members are **merged** (union); toast **Added to …**. Draft opens the album editor; **Published** applies immediately (toast only, stay put).
2. **＋ → Curate pack** opens Saved in select mode on Designs (or curates the current shortlist via `/catalog/curate`).
3. Publish uses the same audience / rates / forward sheet as own collections. Ceiling failures show plain copy (e.g. “This seller doesn’t allow sharing.”).
4. Sellers use the same sheet for own designs → own albums; traders need **Trading** on for foreign designs (select bar already gates Curate).
5. **Explore:** long-press albums and/or designs together → **Share** / **Bookmark** cover both; **Order** / **Curate** use designs only.

## Business rules

| Rule | Detail |
|------|--------|
| References only | Saved rows and curated membership point at supplier `Product` / `Collection` IDs — no duplicate catalog rows |
| Independent bookmarks | Album bookmark ≠ member design bookmarks; each is its own Saved row |
| Discoverability | Bookmark requires the actor can discover the source (audience, block, live rules) |
| Team audit | Saved rows show staff name in the card meta line (internal only) |
| Ceiling | Curate add + publish require source `allowForward` and discoverability; publish audience must not outrun source intent |
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
2. Sticky bar → **Curate** → name → **Save Collection in Draft** → **Publish to Collection**.
3. Same shortlist → **Order** → qty → confirmation lists **one chat link per supplier** (`POST /orders/batch`).
4. As **Meena** (`+919800000002`, connected to Ravi): see the curated pack when audience allows. No trader badge.

## Automated verification

- Unit: `browseShortlist.spec.ts`, `order.service.batch.spec.ts`, `curation-ceiling.spec.ts`, `saved.service.spec.ts`, `trade-access.spec.ts`
- Design: [browse-select-curate-order](../superpowers/specs/2026-08-19-browse-select-curate-order-design.md)

## Where it lives

- API: `apps/api/src/saved/`, `POST /orders/batch`, ceiling helpers in `apps/api/src/catalog/curation-ceiling.ts`
- Web: `apps/web/src/features/saved/`, `apps/web/src/features/browse/`
- Types: `packages/domain-types` (saved + catalog + orders batch)
