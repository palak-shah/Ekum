# Catalog (designs)

## Purpose

The **design library** is first-class: create, edit, publish (live on Explore for the chosen audience), and archive. Designs can also sit in [collections](./collections.md).

## Who uses it

Sellers (selling enabled). First publish requires consent; then `canPublish` stays on. Entry via **You** (library on the page — **Add** on My designs / collections), Home **My designs** (when selling; `/catalog` opens You), or bottom-nav **＋** (sell+upload → **Collection** sheet: **Create new collection** or **Update existing collection** → You Collections). **＋** never a dead tap: buy-only → Orders; otherwise a why-line toast. Add designs is not on nav ＋.

## User flows

### Browse library

1. Open **You** (or `/catalog`, which lands on You) → **Collections** tab by default. **Designs** writes `?tab=products` (a tap that omits `tab` stays on Collections).
2. The list **is** published — no **Published** chip. **Find** opens a field with a **filter square** beside it (same as Orders / Explore). The menu is **Draft · Archived · Saved**. Close Find returns to published and clears the query. **Showing Draft** (etc.) + **Clear** while a filter is on. Find still filters **this tab** in place (design: name, SKU, notes, tags, pack names; packs: name, description, tags, **original mill shop names**, and member name / SKU / notes / tags). Keep the list until they type — not Explore search. Same find text stays when switching Designs ↔ Collections or Saved. **Designs is your catalog only** — curated mill photos are not extra rows there; they live on the pack. Pack photos that are yours: draft pack → **Find → Draft**; after pack publish → **In your packs** (own line on the tile). Solo publish → **On Explore · who**. A design in several collections is **one** library row. Empty Draft while pack designs are live points at **Show live**. No match: **No designs match** / **No collections match**, not the empty-library line.
3. On You: **Designs / Collections** parent underline tabs; **Find** + **Feed / Grid** + filled teal **Add** on that row. **Add** stays when **Saved** is the Find chip (Saved is a filter, not a different create rule). Last Feed/Grid choice remembered with album + Saved; **Ekum default Feed**. **Feed** matches Explore (inset mosaic, name, one muted line). A single photo is **4∶5** so a model or full print loses only a little top and bottom — not a short `h-64` crop. **Grid** stays compact (`h-32` / 2-col). **Long-press** a tile → floating **Select all** + **Clear** (this filter) → dock by filter (bottom nav hidden while selecting): published list = **Order for buyer** · **Share** (equal teal) · **Hide · draft** · **Archive** · **Curate** last (selling or trading); **Draft** = **Publish** · **Archive**; **Archived** = **Restore**. Order / Curate send **published** picks into traveling Selection (`/selection` with `openOrder` / `openCurate`). **Share** opens the same chat sheet as album Share (no need to open the tile). Header Share stays the shop. Drafts and archived have no trade verbs. Share / Bookmark stay on **Your selection** (mixed piles). Selecting on My designs does **not** auto-fill Selection. Create/edit screens keep **PageHeader** at the top.
4. Open a design → editor. Back returns to Designs tab. After **Publish** or **Save in Draft** from Add designs batch, app opens **My designs** (published list, or **Find → Draft**) without the leave-without-saving prompt. Add designs photo grid shows a top-right camera button to add more (same as photo order).

### Batch add designs

**You → Add** (or Home **My designs**) — opens **Add designs** (`/catalog/products/new`): phone continuous camera or gallery multi-select; desktop file multi-select. Empty dashed CTA: **One photo per design** (why-line: each photo is its own design, not more shots of the same one). Grid heading is **N design(s)** (not “photos”), with a quiet tip: **Tap a design to edit details or add more photos.** Grid caps at **9** with blurred **Load more / +n**. Each thumb gets a session-unique **SKU** (`EK-` + 8 hex — same as Edit design **Reference / SKU**), not the file name; that value is saved as both `sku` and `name`. After a design is created, a second Save/Publish in the same batch skips re-create; if the server still reports the SKU taken (retry after a partial success), the UI says **Designs already added** — not a raw SKU clash. Tap photo → **Update this design** sheet: **Add photos** opens fullscreen camera on phone (Gallery from that chrome) or the file picker on desktop — more photos stay on that design (not new designs); **no per-design photo cap**. The update sheet dismisses while the camera is open and returns after **Done** / **Cancel** so the viewfinder is not covered. Tags/rate/unit/MOQ/notes always open (batch TagsField sheet; collection create/edit uses **Item tags** / **Quality / work tags** multi typeaheads and **Size**). Rate is one field by default; quiet **Add range** reveals optional To (stored as `rate` + optional `rateMax`; hyphen text still parses). **Done** keeps this design’s details when they differ from shared. With two or more designs, a ghost **Use same as all designs** resets this one to the shared card. Page details: one design → **This design**; two or more → **Same for all designs** (tags, rate, unit, MOQ, notes — unit pre-filled from last save). Primary **Publish N** or secondary **Save in Draft**. One photo ≈ one design; each becomes a single catalog row (`draft` or `published`, never two copies). Single-design editor: `/catalog/products/:id`.

### Edit & publish a design

1. Open design → photos first; **tap a photo** opens PhotoViewer (swipe between shots); **×** removes that photo. **Name** (blank uses the SKU), rate, unit, MOQ; **More details** for SKU / **tags** / notes.
2. Status line under title (tap → Visibility when published). Sticky dock: **Update** · **Publish** / **Visibility**. Leaving with unsaved edits → **Save changes?** · **Save** (keeps what they typed) · **Discard** (last, danger) — Cancel / close stays. Clean form: no prompt.
3. Publish sheet: Who (**Followers** / **Selected** — no Everyone) / rates / forward. First time: consent. Publish = Explore for that audience.
4. **⋯**: Hide → draft, Archive. Restore from archived.

## Business rules

| Rule | Detail |
|------|--------|
| Lifecycle | `draft` → `published` → `archived` |
| Publish = Explore | Solo **Publish design** sets audience + `postedToMarketAt` (Explore tile — tile line **On Explore · who**). **Publish collection** puts the pack on Explore and marks member designs **Published** in My designs **without** separate Explore design tiles (`postedToMarketAt` stays null — tile line **In your packs**). |
| First publish | `consentToSell` grants `canPublish` |
| Rates | Nullable / on request by default; optional `rateMax` for display ranges (`1200–1400`); units from domain `Unit` enum; orders snapshot `rate` only |
| Pack size | How they sell lives on **each design**: **order unit** (`unit`) + **dispatch unit** (`dispatchUnit`) + `piecesPerPack` (how many dispatch units in one order unit). Shop usual only for *new* photos (Settings Catalog defaults, then pack). Not one company-wide overwrite of library. Order qty is in the order unit. How many each shows a quiet `10 sets = 40 pcs` preview. Order lines snapshot order unit, dispatch unit, and pack size. |
| Download | `allowDownload` on design (and pack); buyers cannot export when false. |
| SKU | Optional on API; batch add assigns a session-unique `EK-` code and sends it so Edit design **Reference / SKU** matches. Server still assigns if omitted elsewhere. **Blank design name** (You → Add, new pack photos, upload/edit save) → name is that SKU. Typed name wins. |
| Selling presence | Creating products calls `ensureSellingEnabled` |
| Unpublish | Clears Explore post when design leaves published. The pack stays **Published** until they **Hide from Explore**. Explore omits packs with no published members. |
| Unarchive | Archived → draft (`POST /products/:id/unarchive`) |
| Bulk Select | Same visibility sheet for many drafts → publish each |
| Staff audit | `createdBy` / `updatedBy` on product views. **You** library tiles and the collection editor status line show the **date only** (no own name). Saved still may show staff. |

## Edge cases / empty states

- Empty Designs tab: “Your design library. Group any of them into a collection.”
- Batch session caps (e.g. 120 designs) and parallel upload progress.
- Archived designs are out of the active picker for new collection membership (non-archived only).

## Seed walkthrough

1. As Ravi: **You → Add** → save drafts → open one → **Publish** → Connections.
2. Confirm My Catalog tile shows `Published · My followers` (or the audience chosen) and Explore shows the design for an **allowed** follower (pending asks do not see it).
3. Hide → draft; tile shows Draft (not “not on Explore”).

## Where it lives

- API: `apps/api/src/catalog/`
- Web: `apps/web/src/features/catalog/`
- Types: `packages/domain-types/src/catalog.ts`
