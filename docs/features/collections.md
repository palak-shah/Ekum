# Collections

## Purpose

Collections are **named albums** that group designs from the library. They are not a second photo store — membership is always designs (products).

## Who uses it

Sellers building packs for shop / Explore. Buyers view published albums via Explore or company profile (`/collections/:id`).

## User flows

### Create & edit (seller)

1. **＋ → New collection** or Catalog → Collections → new.
2. Set cover, name, description → **Create collection**.
3. On edit: pick designs (draft + published, not archived); search by name; **Add photos as designs** (quick path: upload → draft products → join album).
4. Sticky bar: **Save** (details) · **Publish** (or Visibility when already live). Membership autosaves.
5. Publish sheet: audience + rate visibility + first-time consent if needed.

### View (buyer)

1. Open album from Explore, company profile, or chat card → `/collections/:id`.
2. Browse member designs; respect connection / audience for full detail.

## Business rules

| Rule | Detail |
|------|--------|
| Membership | Many-to-many; any owned non-archived design may be added |
| Publish album | Requires ≥1 design; **auto catalog-publishes** draft members, then publishes the collection |
| Explore resurface | `exploreActivityAt` bumps on first publish / republish after hide — not on audience-only tweaks while already published |
| Hide / archive | Hide → draft (edit quietly); Archive ends the season |
| Quick add photos | Creates draft **Product** rows (name from filename), not orphan photos |
| Designs vs collections | Tabs stay separate — see [concepts](./00-concepts.md) |

## Edge cases / empty states

- Collections empty: “Albums of designs from your library.”
- No designs in library: empty card + Add designs / quick-add photos.
- Publish disabled until at least one design is in the album.

## Seed walkthrough

1. As **Ravi**: open **Wedding Edit 2026** under Collections — published album with seeded products.
2. Create a draft album → quick-add photos → Publish → drafts become catalog-published with the album.
3. As **Meena**: open the album from Explore / notification “New drop from Surat Silk House”.

## Automated verification

- Functional: `pnpm test:e2e:functional` — `@collections` shortlist → Ask rates clears selection
- Completeness: `docs/superpowers/reviews/completeness/2026-08-11-collections-completeness.md`

## Where it lives

- Web: `apps/web/src/features/catalog/CollectionEditorPage.tsx`, `MyCatalogPage.tsx`; viewer `apps/web/src/features/collections/`
- API: `apps/api/src/catalog/collection.service.ts`
- Contracts: `packages/domain-types/src/catalog.ts`
