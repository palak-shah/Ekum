# Catalog (designs)

## Purpose

The **design library** is first-class: create, edit, publish (live on Explore for the chosen audience), and archive. Designs can also sit in [collections](./collections.md).

## Who uses it

Sellers (selling enabled). First publish requires consent; then `canPublish` stays on. Entry via **You → My designs & collections** (`/catalog`), **＋ → My designs**, Home **My designs** (when selling), or **＋ → Add designs** / **New collection**.

## User flows

### Browse library

1. Open `/catalog` → **Designs** tab (`?tab=products` default; Collections via `?tab=collections`).
2. Filters: All / Draft / Published / Archived. Tiles show rate · SKU · photo count · `Published · who` (or Draft/Archived), plus a short staff audit line when known.
3. **Long-press** a tile → floating **Select all** + **Clear** (this filter) → dock: **Publish** (drafts) / **Hide · draft** (published) / **Archive** / **Restore** (archived), plus quiet **To selection**. **To selection** sends **published** picks into traveling Selection and opens **Your selection** (`/selection`) for **Order** (for buyer) · **Curate** · **Bookmark** · **Share**. Drafts and archived cannot go to Selection (toast). Selecting on My designs does **not** auto-fill Selection. Shell title **My designs** (like Chats). Content chrome: **Designs / Collections** mode pills + quiet **Add** (opens New post sheet); status **All / Draft / Published / Archived** on a `FilterRail` of kit `Chip`s — not a second pill row. Create/edit screens hide the shell band so **PageHeader** sits at the top.
4. Open a design → editor. Back returns to Designs tab. After **Publish** or **Save in Draft** from Add designs batch, app opens **My designs** (Designs tab with **Published** or **Draft** filter) without the leave-without-saving prompt. Add designs photo grid shows a top-right camera button to add more (same as photo order).

### Batch add designs

**＋ → Add designs** — opens **Add designs** (`/catalog/products/new`): phone continuous camera or gallery multi-select; desktop file multi-select. Empty dashed CTA: **One photo per design** (why-line: each photo is its own design, not more shots of the same one). Grid heading is **N design(s)** (not “photos”), with a quiet tip: **Tap a design to edit details or add more photos.** Each thumb gets a session-unique **SKU** (`EK-` + 8 hex — same as Edit design **Reference / SKU**), not the file name; that value is saved as both `sku` and `name`. After a design is created, a second Save/Publish in the same batch skips re-create; if the server still reports the SKU taken (retry after a partial success), the UI says **Designs already added** — not a raw SKU clash. Tap photo → **Update this design** sheet: **Add** opens fullscreen camera on phone (Gallery from that chrome) or the file picker on desktop — more photos stay on that design (not new designs). The update sheet dismisses while the camera is open and returns after **Done** / **Cancel** so the viewfinder is not covered. Category/rate/unit/MOQ/notes always open. **Done** keeps this design’s details when they differ from shared. With two or more designs, a ghost **Use same as all designs** resets this one to the shared card. Page details: one design → **This design**; two or more → **Same for all designs** (category, rate, unit, MOQ, notes — category/unit pre-filled from last save). **Save N designs in Draft** or **Publish** (audience sheet). One photo ≈ one design; each becomes a single catalog row (`draft` or `published`, never two copies). Single-design editor: `/catalog/products/:id`.

### Edit & publish a design

1. Open design → photos first; **Name**, rate, unit, MOQ; **More details** for SKU / categories / notes.
2. Status line under title (tap → Visibility when published). Sticky dock: **Update** · **Publish** / **Visibility**.
3. Publish sheet: Who (Everyone / Followers / Selected) / rates / forward. First time: consent. Publish = Explore for that audience.
4. **⋯**: Hide → draft, Archive. Restore from archived.

## Business rules

| Rule | Detail |
|------|--------|
| Lifecycle | `draft` → `published` → `archived` |
| Publish = Explore | Publish sets audience + `postedToMarketAt`. See [concepts](./00-concepts.md). |
| First publish | `consentToSell` grants `canPublish` |
| Rates | Nullable / on request by default; units from domain `Unit` enum |
| SKU | Optional on API; batch add assigns a session-unique `EK-` code and sends it so Edit design **Reference / SKU** matches. Server still assigns if omitted elsewhere |
| Selling presence | Creating products calls `ensureSellingEnabled` |
| Unpublish | Clears Explore post when design leaves published |
| Unarchive | Archived → draft (`POST /products/:id/unarchive`) |
| Bulk Select | Same visibility sheet for many drafts → publish each |
| Staff audit | `createdBy` / `updatedBy` on product views |

## Edge cases / empty states

- Empty Designs tab: “Your design library. Group any of them into a collection.”
- Batch session caps (e.g. 120 designs) and parallel upload progress.
- Archived designs are out of the active picker for new collection membership (non-archived only).

## Seed walkthrough

1. As Ravi: **＋ → Add designs** → save drafts → open one → **Publish** → Connections.
2. Confirm My Catalog tile shows `Published · My followers` (or the audience chosen) and Explore shows the design for an allowed viewer.
3. Hide → draft; tile shows Draft (not “not on Explore”).

## Where it lives

- API: `apps/api/src/catalog/`
- Web: `apps/web/src/features/catalog/`
- Types: `packages/domain-types/src/catalog.ts`
