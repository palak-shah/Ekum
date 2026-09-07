# Publish audience Followers default — Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide **My connections** on Publish/Visibility; default **My followers** for designs and collections.

**Architecture:** Centralize selectable Who options + default in `PublishAudienceFields` helpers so design, collection, and bulk sheets stay consistent. Keep API `connections` for legacy rows; badge labels unchanged.

**Tech Stack:** React web (`apps/web`), Vitest, feature docs under `docs/features`.

## Global Constraints

- Do not remove `PublishAudience.Connections` from domain/API enums.
- Do not migrate existing published rows.
- Selected picker still uses connections as the company pool.
- Copy voice: plain trader words (My followers, Everyone, Selected).

---

### Task 1: Helpers + unit tests (defaults & Who list)

**Files:**
- Create: `apps/web/src/features/catalog/publishAudienceOptions.ts`
- Create: `apps/web/src/features/catalog/publishAudienceOptions.spec.ts`
- Modify: `apps/web/src/features/catalog/PublishAudienceFields.tsx`

**Interfaces:**
- Produces: `PUBLISH_WHO_OPTIONS`, `DEFAULT_PUBLISH_AUDIENCE`, `normalizePublishAudienceForSheet(audience: string): string`

- [x] **Step 1:** Add failing tests for Followers default, Who list excludes Connections, normalize maps Connections → Followers for sheet selection.

- [x] **Step 2:** Implement helpers; wire `emptyPublishAudienceState` / `restorePublishAudienceState` / Who chips to use them.

- [x] **Step 3:** Fix call sites that hardcode `PublishAudience.Connections` as fallback default (`ProductEditorPage`, `CollectionEditorPage`, bulk sheets) to `DEFAULT_PUBLISH_AUDIENCE` / Followers.

- [x] **Step 4:** Run `pnpm --filter @ekum/web exec vitest run src/features/catalog/publishAudienceOptions.spec.ts`

---

### Task 2: Docs + gap matrix

**Files:**
- Modify: `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`
- Modify: `docs/superpowers/reviews/feature-gap-matrix.md` (brief note if catalog row exists)

- [x] **Step 1:** Default audience = Followers; Publish Who omits Connections; legacy badge still valid.

- [x] **Step 2:** Run related status-summary tests that still expect Connections labels for legacy data (should keep passing).
