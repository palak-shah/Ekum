# Catalog (designs)

## Purpose

The **design library** is first-class: create, edit, publish (live on Explore for the chosen audience), and archive. Designs can also sit in [collections](./collections.md).

## Who uses it

Sellers (selling enabled). First publish requires consent; then `canPublish` stays on. Entry via **You → My designs** (`/catalog`) or **＋ → Add designs**.

## User flows

### Browse library

1. Open `/catalog` → **Designs** tab (`?tab=products` default; Collections via `?tab=collections`).
2. Filters: All / Draft / Published / Archived. Tiles show rate · SKU · photo count · `Published · who` (or Draft/Archived), plus a short staff audit line when known.
3. **Select** / long-press → floating **Select all** / **Clear** (this filter) → Publish / Archive / Restore on the dock.
4. Open a design → editor. Back returns to Designs tab. After **Publish** or **Save in Draft** from Add Design batch, app opens **My designs** (Designs tab with **Published** or **Draft** filter). Add Design photo grid shows a top-right camera button to add more (same as photo order).

### Batch add designs

**＋ → Add designs** — opens **Add Design** (`/catalog/products/new`): phone continuous camera or gallery multi-select; desktop file multi-select. Photo grid (auto name under each thumb — focus selects default text for easy replace; tap photo → **Update this design** sheet with **More photos for this design** and chips **Details for this design** / **Same details for all**) → page **Same for all designs** (category, rate, unit, MOQ, notes — category/unit pre-filled from last save) → **Save N designs in Draft** or **Publish** (audience sheet). One photo ≈ one design; each becomes a single catalog row (`draft` or `published`, never two copies). Single-design editor: `/catalog/products/:id`.

### Edit & publish a design

1. Open design → photos first; **Name**, rate, unit, MOQ; **More details** for SKU / categories / notes.
2. Status line under title (tap → Visibility when published). Sticky dock: **Update** · **Publish** / **Visibility**.
3. Publish sheet: Who (Everyone / Connections / Followers / Selected) / rates / forward. First time: consent. Publish = Explore for that audience.
4. **⋯**: Hide → draft, Archive. Restore from archived.

## Business rules

| Rule | Detail |
|------|--------|
| Lifecycle | `draft` → `published` → `archived` |
| Publish = Explore | Publish sets audience + `postedToMarketAt`. See [concepts](./00-concepts.md). |
| First publish | `consentToSell` grants `canPublish` |
| Rates | Nullable / on request by default; units from domain `Unit` enum |
| SKU | Optional; server assigns a stable company-unique code if omitted |
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
2. Confirm My Catalog tile shows `Published · My connections` and Explore shows the design for a connected buyer.
3. Hide → draft; tile shows Draft (not “not on Explore”).

## Where it lives

- API: `apps/api/src/catalog/`
- Web: `apps/web/src/features/catalog/`
- Types: `packages/domain-types/src/catalog.ts`
