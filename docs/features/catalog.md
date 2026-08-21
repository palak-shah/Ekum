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
4. Open a design → editor. Back returns to Designs tab.

### Batch add designs

**＋ → Add designs** — phone: continuous in-app camera (torch/zoom when supported) or gallery multi-select; desktop: file multi-select. Then photo grid (name under each thumb; tap photo → update sheet) → **Same for all** (category, rate, unit, MOQ, notes — category/unit pre-filled from last save) → **Save drafts** or **Save & publish…** (audience sheet). One photo ≈ one design. (Single-design path: `/catalog/products/new`.)

### Edit & publish a design

1. Open design → photos first; **Name**, rate, unit, MOQ; **More details** for SKU / categories / notes.
2. Status line under title (tap → Visibility when published). Sticky dock: **Save** · **Publish** / **Visibility**.
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
