# Mutual connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One Approve creates one mutual Connected pair; either side can Pause/Block; Network shows one card per company.

**Architecture:** Replace directed `ownerCompanyId`/`viewerCompanyId` with an unordered pair (`companyLowId`/`companyHighId`, `low < high`). Centralize “are these two Connected (active)?” in `VisibilityService` (and a small pure helper for Prisma OR clauses). Migrate existing dual edges. Web drops role labels and owner-only actions.

**Tech Stack:** Prisma/Postgres, NestJS access module, `@ekum/domain-types`, React Connections page, Playwright `@functional @network`

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-12-mutual-connection-design.md`
- Completeness Proceed: `docs/superpowers/reviews/completeness/2026-09-12-mutual-connection-completeness.md`
- Feature docs already updated: `00-concepts.md`, `access-and-connections.md`
- Status merge on migrate: **Blocked > Paused > Active**
- Approve never clears Block — **only the blocker** Unblocks
- Either side may Pause/Block from `active`; **only that actor** Resume/Unblock (`statusSetByCompanyId`)
- Silent: other side does **not** see the paused/blocked row
- Selected audience unchanged; Everyone unchanged
- Plain copy: **Connected** — no They buy / You buy
- Commit only when the user asks

---

## File map

| File | Responsibility |
|------|----------------|
| `apps/api/prisma/schema.prisma` + migration | Mutual pair columns + unique |
| `apps/api/prisma/seed.ts` | One Ravi↔Meena connection |
| `apps/api/src/access/connection-pair.ts` | `orderCompanyPair(a,b)`, status merge helper |
| `apps/api/src/access/visibility.service.ts` | Mutual active / blocked lookups |
| `apps/api/src/access/connection.service.ts` | List one row; either-side actions |
| `apps/api/src/access/access.service.ts` | Approve upserts mutual pair |
| `apps/api/src/catalog/audience-visibility.ts` (+ callers) | `connected` already boolean — ensure callers pass mutual |
| Prisma filters across discovery/catalog/orders/saved/chat | Replace directed `connectionsAsOwner` checks with mutual active/blocked helpers |
| `packages/domain-types/src/access.ts` | `ConnectionView` without `role` (or optional deprecated) |
| `apps/web/.../ConnectionsPage.tsx` | Connected + either-side actions |
| `apps/e2e/tests/functional/…` | One-row + mutual visibility journey |

---

### Task 1: Pair helpers + VisibilityService (TDD)

**Files:**
- Add `statusSetByCompanyId` (nullable when active).
- Create: `apps/api/src/access/connection-pair.ts`
- Create: `apps/api/src/access/connection-pair.spec.ts`
- Modify: `apps/api/src/access/visibility.service.ts`
- Modify: `apps/api/src/access/visibility.service.spec.ts`

- [ ] **Step 1: Failing tests** — `orderCompanyPair` sorts ids; `mergeConnectionStatuses` prefers Blocked > Paused > Active; Visibility `canViewCatalog(A,B)` true when only B→A directed row exists **until** schema lands — write tests for **mutual** intent: either orientation active ⇒ true; blocked either way ⇒ `isBlocked` true.
- [ ] **Step 2: Implement helpers** — pure functions only.
- [ ] **Step 3: Implement VisibilityService** against current schema temporarily with OR findFirst on both orientations **or** wait for Task 2 and implement after migrate (prefer Task 2 first if tests need new schema — then reorder: do Task 2 schema before finishing Visibility).
- [ ] **Step 4: Run** `pnpm --filter @ekum/api exec vitest run src/access/connection-pair.spec.ts src/access/visibility.service.spec.ts` — PASS.

---

### Task 2: Schema migrate + seed

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (`Connection` model)
- Create: Prisma migration SQL (data migrate + drop old unique)
- Modify: `apps/api/prisma/seed.ts`

**Schema target:**

```prisma
model Connection {
  id            String   @id @default(cuid())
  companyLowId  String
  companyHighId String
  status            String
  statusSetByCompanyId String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  companyLow        Company  @relation("ConnectionLow", fields: [companyLowId], references: [id], onDelete: Cascade)
  companyHigh       Company  @relation("ConnectionHigh", fields: [companyHighId], references: [id], onDelete: Cascade)
  @@unique([companyLowId, companyHighId])
  @@index([companyLowId, status])
  @@index([companyHighId, status])
}
```

- [ ] **Step 1: Migration SQL** — add new columns nullable; backfill: for each old row, set low/high = ordered(owner, viewer); merge duplicates by status priority + min(createdAt); delete extras; set NOT NULL; drop owner/viewer FKs/indexes/unique; add new FKs/unique; rename relations on Company.
- [ ] **Step 2: Update Company relations** in schema (`connectionsLow` / `connectionsHigh` or equivalent).
- [ ] **Step 3: Seed** — single upsert for Ravi↔Meena ordered pair; remove second directed create.
- [ ] **Step 4: `pnpm --filter @ekum/api exec prisma validate` + migrate locally — PASS.

---

### Task 3: Access approve + connection list/actions

**Files:**
- Modify: `apps/api/src/access/access.service.ts` (+ spec)
- Modify: `apps/api/src/access/connection.service.ts` (+ spec)
- Modify: `packages/domain-types/src/access.ts`

- [ ] **Step 1: Update `ConnectionView`** — remove `role`; keep `company`, `status`, `id`, `createdAt`.
- [ ] **Step 2: Failing tests** — approve creates one pair; pause from A → only A can resume, B list omits row; block from B → only B can unblock; A cannot unblock B’s block; blocked peer cannot be approved until blocker unblocks.
- [ ] **Step 3: Approve** — upsert mutual pair with `orderCompanyPair(requester, target)`; if existing Blocked → keep CONFLICT `CONNECTION_BLOCKED`.
- [ ] **Step 4: List** — find pairs involving me; if status is paused/blocked and `statusSetByCompanyId !== me`, omit; if active, include for both.
- [ ] **Step 5: `applyAction`** — authorize: Pause/Block only from `active` and me ∈ pair; Resume only if paused && me === statusSetBy; Unblock only if blocked && me === statusSetBy. Set/clear `statusSetByCompanyId`.
- [ ] **Step 6: Run access + connection specs — PASS.**

---

### Task 4: Sweep connected? / blocked? call sites

**Files (representative — grep and fix all):**
- `audience-visibility` callers (explore, search, company shop)
- `visibility.service` consumers
- Prisma raw filters using `connectionsAsOwner` / `viewerCompanyId` for Connection
- `trade-access.ts`, `product-viewer-access.ts`, `explore.service.ts`, `search.service.ts`, `company.service.ts`, saved/chat as needed

- [ ] **Step 1: Grep** `connectionsAsOwner|ownerCompanyId_viewerCompanyId|ConnectionOwner` — replace with helpers that check mutual active or mutual blocked.
- [ ] **Step 2: Prefer** `VisibilityService.canViewCatalog` / `isBlocked` or exported Prisma `where` fragment from `connection-pair.ts` e.g. `activeConnectionWhere(a,b)`.
- [ ] **Step 3: Unit tests** that previously assumed directed-only still pass with mutual (add case: only reverse orientation would have failed before).
- [ ] **Step 4: Run targeted API vitest packs — PASS.

---

### Task 5: Web Connections UI

**Files:**
- Modify: `apps/web/src/features/network/ConnectionsPage.tsx`
- Spec/unit if any connection label helpers exist

- [ ] **Step 1:** Subtitle **Connected** (or status-aware muted line); remove buy-from labels.
- [ ] **Step 2:** Actions from server flags or status+actor: active → Pause/Block; paused by me → Resume; blocked by me → Unblock. Never show Unblock to the other party.
- [ ] **Step 3:** Empty copy stays trader-plain.
- [ ] **Step 4:** Typecheck web against new `ConnectionView`.

---

### Task 6: Functional e2e + gap matrix

**Files:**
- Add/modify: `apps/e2e/tests/functional/network.connections.mutual.journey.spec.ts` (or extend existing network journey)
- Modify: `docs/superpowers/reviews/feature-gap-matrix.md`

- [ ] **Step 1: Journey** — login Ravi → Connections → expect **one** Jaipur Emporium (or Meena company) card, text Connected, no duplicate name; login Meena → one Surat card.
- [ ] **Step 2: Optional** — Meena Connections-audience pack visible to Ravi after single seed pair (if seed audience allows).
- [ ] **Step 3: Update gap matrix** — Network Connections → Redesign→Works / Partial until green; note Completeness 2026-09-12-mutual-connection.
- [ ] **Step 4: Run** `pnpm exec playwright test --grep "@network"` (or the new file) — PASS.

---

## Verification (done criteria)

- [ ] API unit: pair helpers, visibility mutual, approve/list/actions  
- [ ] Seed: one Ravi↔Meena connection  
- [ ] Web: one card, either-side Pause  
- [ ] e2e: no dual Jaipur/Surat rows  
- [ ] Docs already aligned (concepts + access)

## Notes for implementer

- Do **not** leave a compatibility dual-row UI.
- Chat activate-on-approve stays.
- Follow unchanged.
