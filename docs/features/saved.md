# Saved & Curate pack

## Purpose

**Saved** is a personal shortlist of **references** to designs and collections (not copies). Traders use it to hold supplier posts, then assemble a **Curate pack** — their own collection whose members may be other companies’ products — and publish that pack to their buyers under the original sellers’ share rules.

## Who uses it

Any signed-in company. Save is available when the design/collection is discoverable. **Curate pack** appears for selling presence (＋ sheet); first curated publish sets `canRelist` (and `canPublish` if needed).

## User flows

### Save / Unsave

1. Open a design (Explore) or collection (viewer) → **Save**.
2. **You → Saved** (`/saved`) lists thumbs with business name and Design / Collection.
3. **Remove** from the hub, or Unsave on the source surface.

### Curate pack

1. **＋ → Curate pack** (`/catalog/curate`) — or open after saving items.
2. Multi-select from **Saved** (and browse when offered) → name the pack → **Save draft** (creates collection + membership) or continue to **Publish…**.
3. Publish uses the same audience / rates / forward sheet as own collections. Ceiling failures show plain copy (e.g. “This seller doesn’t allow sharing.”).

## Business rules

| Rule | Detail |
|------|--------|
| References only | Saved rows and curated membership point at supplier `Product` / `Collection` IDs — no duplicate catalog rows |
| Discoverability | Save requires the actor can discover the source (audience, block, live rules) |
| Ceiling | Curate add + publish require source `allowForward` and discoverability; publish audience must not outrun source intent |
| Own collections | Own-product-only albums unchanged; curated packs are inferable when any member `product.companyId !== collection.companyId` |
| Consent | First curated publish grants `canRelist` |
| Opaque businesses | No Trader/Seller badges on cards |

See [collections](./collections.md) for album publish/live-window rules and [concepts](./00-concepts.md) for trust / Forward vs Curate.

## Edge cases / empty states

- Saved empty: “Nothing saved yet” — save from Explore first.
- Load failure on Saved: error state (not treated as empty).
- Locked (`allowForward: false`) design: may still be savable if discoverable; cannot curate/publish into someone else’s Explore pack.

## Seed walkthrough (Slice A)

Prereq: `pnpm --filter @ekum/api db:seed`. Seeded Kavita/Ravi designs and albums are **Everyone** + **allowForward**.

1. As **Ravi** (`+919800000001`): Explore → open Kavita’s **Cotton Grey Fabric** (or **Mill Lot — March**) → **Save**. Confirm under **You → Saved**.
2. Still Ravi: **＋ → Curate pack** → pick the saved Kavita design (optional: add a second discoverable design) → name pack → **Save draft** → **Publish…** to **Connections** (or Everyone).
3. As **Meena** (`+919800000002`, connected to Ravi): Explore / Ravi shop → see the curated pack when audience allows. No trader badge.

## Automated verification

- Unit: `curation-ceiling.spec.ts`, `collection.service.spec.ts` (foreign members / ceiling), `saved.service.spec.ts`
- Design: [trader-curation-slice-a-design](../superpowers/specs/2026-08-19-trader-curation-slice-a-design.md)

## Where it lives

- API: `apps/api/src/saved/`, ceiling helpers in `apps/api/src/catalog/curation-ceiling.ts`, membership in `collection.service.ts`
- Web: `apps/web/src/features/saved/`, `apps/web/src/features/catalog/CuratePackPage.tsx`
- Types: `packages/domain-types` (saved + catalog)
