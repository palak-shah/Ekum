# Trader curation Slice A — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Saved (design/collection references) plus Curate pack (multi-supplier product refs in the curator’s collection) with permission ceiling and `canRelist` on first curated publish.

**Architecture:** New `SavedItem` rows store references only. `CollectionProduct` may point at foreign `Product`s when ceiling checks pass. Collection `setProducts` / `publish` enforce `allowForward` + discoverability + audience-not-wider-than-sources. Web: You → Saved hub; ＋ → Curate pack; Save actions on explore/shop surfaces.

**Tech Stack:** NestJS + Prisma, `@ekum/domain-types`, React Query + React Router (apps/web), Vitest.

**Spec:** [docs/superpowers/specs/2026-08-19-trader-curation-slice-a-design.md](../specs/2026-08-19-trader-curation-slice-a-design.md)

## Global Constraints

- Provenance = **Reference** only (no product copies).
- No Trader/Seller badges; WhatsApp-simple copy.
- Save if discoverable; **curate/publish** requires `allowForward === true` on each foreign source.
- Audience ceiling (v1): ordinal `selected=0 < connections=1 < followers=2 < everyone=3`. Curated pack publish audience rank must be ≤ **min** rank of all foreign members’ `audience` (own-company members ignored for the min). If any foreign member fails discoverability or `allowForward`, reject add/publish with plain errors.
- Out of scope: order split / dual-trade linking (B), Explore All/Buying/Selling (C), anonymity (D).
- Prefer infer curated (`any product.companyId !== collection.companyId`) over new collection flag unless needed for queries.

## File map

| Area | Files |
|------|--------|
| Schema | `apps/api/prisma/schema.prisma`, new migration |
| Domain types | `packages/domain-types/src/` (saved + company capabilities already has `relist`) |
| Ceiling helper | Create `apps/api/src/catalog/curation-ceiling.ts` (+ spec) |
| Collections | `apps/api/src/catalog/collection.service.ts` (`setProducts`, `publish`) |
| Saved API | Create `apps/api/src/saved/` module (controller, service, specs) |
| Relist grant | `apps/api/src/catalog/publish-capability.ts` or sibling `grantRelistCapability` |
| Web Saved | `apps/web/src/features/saved/`, router, `MorePage.tsx` |
| Web Curate | `apps/web/src/features/catalog/CuratePackPage.tsx` (or extend collection create), `AppShell.tsx` ＋ sheet |
| Save CTA | Explore/company/collection/design detail entry points (minimal: design + collection preview) |
| Docs | `docs/features/catalog.md` or new `saved.md` + concepts already updated |

---

### Task 1: SavedItem schema + domain types

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: migration under `apps/api/prisma/migrations/`
- Modify: `packages/domain-types/src/` (new `saved.ts`, export from index)
- Test: typecheck / build domain-types

**Interfaces:**
- Produces: `SavedItemView { id, kind: 'product' \| 'collection', productId?, collectionId?, company: PublicCompanySummary-ish thumb fields, createdAt }`
- Produces: `SavedListView = SavedItemView[]`

- [ ] **Step 1: Add Prisma model**

```prisma
model SavedItem {
  id           String   @id @default(cuid())
  companyId    String
  productId    String?
  collectionId String?
  createdAt    DateTime @default(now())

  company    Company     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  product    Product?    @relation(fields: [productId], references: [id], onDelete: Cascade)
  collection Collection? @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@index([companyId, createdAt])
  @@unique([companyId, productId])
  @@unique([companyId, collectionId])
}
```

Wire `SavedItem[]` on `Company`, `Product`, `Collection`. Note: Postgres allows multiple NULLs in unique — enforce XOR in service (exactly one of productId/collectionId).

- [ ] **Step 2: Migrate**

Run: `pnpm --filter @ekum/api exec prisma migrate dev --name saved_items`

- [ ] **Step 3: Domain types**

Add `packages/domain-types/src/saved.ts` with views + zod create body `{ productId?: string, collectionId?: string }` (exactly one required). Export from package index. Build: `pnpm --filter @ekum/domain-types build`

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma packages/domain-types
git commit -m "feat(saved): add SavedItem schema and domain types"
```

---

### Task 2: curation-ceiling helper (unit-tested)

**Files:**
- Create: `apps/api/src/catalog/curation-ceiling.ts`
- Create: `apps/api/src/catalog/curation-ceiling.spec.ts`

**Interfaces:**
- Produces:
  - `audienceRank(audience: string): number`
  - `assertProductsCuratable(input: { curatorCompanyId; products: Array<{ id; companyId; audience; allowForward; status; postedToMarketAt }>; publishAudience?: string }): void` throws `BadRequestException` with codes `FORWARD_NOT_ALLOWED` | `NOT_DISCOVERABLE` | `CURATED_AUDIENCE_TOO_WIDE` | `INVALID_PRODUCTS`
- Discoverability for this helper: caller passes only products already filtered as discoverable OR helper accepts a `discoverableIds: Set<string>` from caller.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { audienceRank, assertProductsCuratable } from './curation-ceiling';

describe('audienceRank', () => {
  it('orders selected < connections < followers < everyone', () => {
    expect(audienceRank('selected')).toBeLessThan(audienceRank('connections'));
    expect(audienceRank('connections')).toBeLessThan(audienceRank('followers'));
    expect(audienceRank('followers')).toBeLessThan(audienceRank('everyone'));
  });
});

describe('assertProductsCuratable', () => {
  const base = {
    id: 'p1',
    companyId: 'other',
    audience: 'everyone',
    allowForward: true,
    status: 'published',
  };

  it('rejects locked forward on foreign product', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        products: [{ ...base, allowForward: false }],
      }),
    ).toThrow(/allow/i);
  });

  it('allows own-company products without forward check', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        products: [{ ...base, companyId: 'me', allowForward: false }],
      }),
    ).not.toThrow();
  });

  it('rejects everyone publish when a foreign member is connections-only', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        publishAudience: 'everyone',
        products: [{ ...base, audience: 'connections' }],
      }),
    ).toThrow(/audience/i);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `pnpm --filter @ekum/api exec vitest run src/catalog/curation-ceiling.spec.ts`

- [ ] **Step 3: Implement helper**

Implement ranks and rules per Global Constraints. Own-company rows skip `allowForward` and skip min-audience contribution.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/catalog/curation-ceiling.ts apps/api/src/catalog/curation-ceiling.spec.ts
git commit -m "feat(catalog): curation permission ceiling helper"
```

---

### Task 3: setProducts allows foreign products + publish ceiling + canRelist

**Files:**
- Modify: `apps/api/src/catalog/collection.service.ts` (`setProducts` ~355–418, `publish` ~180–268)
- Modify: `apps/api/src/catalog/publish-capability.ts` (add `grantRelistCapability`)
- Modify: `apps/api/src/catalog/collection.service.spec.ts`
- Test: extend collection.service.spec.ts

**Interfaces:**
- Consumes: `assertProductsCuratable` from Task 2
- Produces: `setProducts` accepts foreign ids when curatable; `publish` re-validates members + grants `canRelist` when any foreign member present and consent path succeeds

- [ ] **Step 1: Failing specs**

Add cases:
1. `setProducts` with other company’s published forwardable product → succeeds (mock prisma).
2. `setProducts` with `allowForward: false` foreign → `FORWARD_NOT_ALLOWED` / BadRequest.
3. `publish` curated pack with `audience: everyone` while member is `connections` → `CURATED_AUDIENCE_TOO_WIDE`.
4. First curated publish sets `canRelist: true` (and `canPublish` if needed via existing consent).

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm --filter @ekum/api exec vitest run src/catalog/collection.service.spec.ts`

- [ ] **Step 3: Implement**

Replace owned-only count in `setProducts` with: load products by ids; ensure all found; call discoverability (reuse explore/`canDiscoverCollection` patterns on product via existing visibility — if product detail uses `canDiscoverCollection` on product row, mirror that); then `assertProductsCuratable`.

On `publish`, after loading members’ products, call `assertProductsCuratable({ ..., publishAudience: dto.audience })`. If any `product.companyId !== companyId`, call `grantRelistCapability` after successful publish (and existing publish consent).

Update explore bump: newly added foreign published products may bump `exploreActivityAt` when collection already published (same as owned).

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/catalog/collection.service.ts apps/api/src/catalog/collection.service.spec.ts apps/api/src/catalog/publish-capability.ts
git commit -m "feat(catalog): allow curated foreign collection members with ceiling"
```

---

### Task 4: Saved API module

**Files:**
- Create: `apps/api/src/saved/saved.module.ts`, `saved.controller.ts`, `saved.service.ts`, `saved.service.spec.ts`
- Modify: `apps/api/src/app.module.ts` (register module)

**Interfaces:**
- `GET /saved` → list for company
- `POST /saved` body `{ productId?: string, collectionId?: string }` — discoverable required; idempotent upsert
- `DELETE /saved/:id`
- Does **not** require `allowForward` (private bookmark); requires discoverability

- [ ] **Step 1: Service specs** (mock prisma) — save product, reject undiscoverable, list, delete, reject both ids / neither id

- [ ] **Step 2: Implement module** following `broadcast` or `referral` controller JWT patterns (`@CompanyId()`, etc.)

- [ ] **Step 3: Run** `pnpm --filter @ekum/api exec vitest run src/saved`

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/saved apps/api/src/app.module.ts
git commit -m "feat(saved): list/create/delete saved design and collection refs"
```

---

### Task 5: Web Saved hub + Save actions

**Files:**
- Create: `apps/web/src/features/saved/SavedPage.tsx`
- Modify: `apps/web/src/app/router.tsx` (`path: 'saved'`)
- Modify: `apps/web/src/features/settings/MorePage.tsx` — menu `{ to: '/saved', label: 'Saved' }`
- Modify: design/collection preview pages used from Explore (add Save/Unsaved toggle via `api.post/delete`)
- Optional: `apps/web/src/lib/queries.ts` helpers

- [ ] **Step 1: Route + MorePage link + empty SavedPage** (loads `GET /saved`, EmptyState “Nothing saved yet”)

- [ ] **Step 2: Save/Unsave on product explore detail and collection preview** (minimal surfaces)

- [ ] **Step 3: Manual smoke** — as Meena save Ravi design; see under You → Saved

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/saved apps/web/src/app/router.tsx apps/web/src/features/settings/MorePage.tsx
git commit -m "feat(web): Saved hub and save actions"
```

---

### Task 6: Curate pack UI

**Files:**
- Create: `apps/web/src/features/catalog/CuratePackPage.tsx` (multi-select from Saved + search/browse; create draft collection; `PUT` products; optional publish sheet reuse)
- Modify: `apps/web/src/app/router.tsx` — `catalog/curate`
- Modify: `apps/web/src/app/AppShell.tsx` — ＋ sheet button **Curate pack** when `selling` (show even before `canRelist`; consent on first publish)

**Interfaces:**
- Consumes: `POST /collections`, `PUT /collections/:id/products`, `POST /collections/:id/publish`, `GET /saved`

- [ ] **Step 1: Page skeleton** — pick from Saved list (checkboxes), name field, Save draft

- [ ] **Step 2: Wire create collection + setProducts**; show API error toast for ceiling failures (“This seller doesn’t allow sharing.”)

- [ ] **Step 3: Publish path** — reuse existing collection publish sheet/component if one exists on `CollectionEditorPage`; else navigate to editor after draft create

- [ ] **Step 4: ＋ entry** Curate pack → `/catalog/curate`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/catalog/CuratePackPage.tsx apps/web/src/app/AppShell.tsx apps/web/src/app/router.tsx
git commit -m "feat(web): Curate pack from Saved and multi-supplier refs"
```

---

### Task 7: Seed + docs verification

**Files:**
- Modify: `apps/api/prisma/seed.ts` — optional: ensure Kavita/Ravi products `allowForward: true` / audience everyone for QA
- Modify: `docs/features/` — add short `saved.md` or section under catalog; link from README
- Modify: spec status → **Approved / Implementing**
- Modify: feature-gap-matrix notes when tasks land (Verification Unit)

- [ ] **Step 1: Seed walkthrough script in docs** — Ravi saves Kavita fabric design; Curate pack with Kavita + (optional second); publish to connections; Meena sees if connected/audience allows

- [ ] **Step 2: Run API unit suites**

`pnpm --filter @ekum/api exec vitest run src/catalog/curation-ceiling.spec.ts src/catalog/collection.service.spec.ts src/saved`

- [ ] **Step 3: Commit docs**

```bash
git add docs apps/api/prisma/seed.ts
git commit -m "docs: Slice A curated pack and Saved walkthrough"
```

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| Reference provenance | 3 |
| Multi-supplier members | 3, 6 |
| Saved hub + refs | 1, 4, 5 |
| Curate from Saved | 6 |
| Permission ceiling / allowForward | 2, 3 |
| canRelist on first curated publish | 3 |
| ＋ Curate pack | 6 |
| No badges / WhatsApp-simple | 5, 6 |
| Orders / Explore trade-side out | Global Constraints |

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-08-19-trader-curation-slice-a.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — this session with executing-plans checkpoints  

Which approach?
