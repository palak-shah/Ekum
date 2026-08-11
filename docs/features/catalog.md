# Catalog (designs)

## Purpose

The **design library** is first-class: create, edit, catalog-publish, archive, and optionally post individual designs to Explore. Designs can also sit in [collections](./collections.md).

## Who uses it

Sellers (selling enabled). First publish requires consent; then `canPublish` stays on. Entry via **You → My designs** (`/catalog`) or **＋ → Add designs**.

## User flows

### Browse library

1. Open `/catalog` → **Designs** tab.
2. Open a design → editor; StatusPill = catalog status; **On Explore** only when `postedToMarketAt` is set.

### Batch add designs

1. **＋ → Add designs** or New post → Single design path → `/catalog/products/new`.
2. Add photos (one photo ≈ one design by default; more angles via per-design sheet).
3. Fill **Same for all** (category, rate, unit, MOQ, notes); name each design (filename-based defaults).
4. Save → draft designs in library.

### Edit & publish a design

1. Open design → edit name, images, rate (or on request), unit, MOQ, categories, notes.
2. **Publish** (shop) → audience/rates sheet; first time: **consent to sell**.
3. Optionally **Post to Explore** (separate from catalog publish).
4. Unpost from Explore / unpublish (→ draft) / archive as needed.

## Business rules

| Rule | Detail |
|------|--------|
| Lifecycle | `draft` → `published` → `archived` |
| Publish ≠ Explore | Catalog publish ≠ `postedToMarketAt`. See [concepts](./00-concepts.md). |
| First publish | `consentToSell` grants `canPublish` |
| Rates | Nullable / on request by default; units from domain `Unit` enum |
| SKU | Optional; server assigns a stable company-unique code if omitted |
| Selling presence | Creating products calls `ensureSellingEnabled` |
| Unpublish | Clears Explore post when design leaves published |

## Edge cases / empty states

- Empty Designs tab: “Your design library. Group any of them into a collection.”
- Batch session caps (e.g. 120 designs) and parallel upload progress.
- Archived designs are out of the active picker for new collection membership (non-archived only).

## Seed walkthrough

1. As **Ravi**: open My designs — seeded Banarasi / other published designs.
2. Add a draft via batch → confirm it appears without Explore badge.
3. Publish → consent if needed → optionally post to Explore; as **Meena**, find it on Explore when audience allows.

## Where it lives

- Web: `apps/web/src/features/catalog/MyCatalogPage.tsx`, `DesignBatchPage.tsx`, `ProductEditorPage.tsx`
- API: `apps/api/src/catalog/product.service.ts`, `publish-capability.ts`
- Contracts: `packages/domain-types/src/catalog.ts`
