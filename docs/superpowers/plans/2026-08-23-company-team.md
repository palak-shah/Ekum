# Company team — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an owner invite staff under one company, set five caps, share company chats, and keep owner-only chats hidden from staff.

**Architecture:** Reuse `CompanyMembership` (owner/staff + `canUploads|canChats|canOrders|canPayments|canTeam`). JWT guard loads those flags. New `TeamInvite` + `/t/:token` join (phone-bound; reject if the user already has a company). Chat list/detail already 404 staff on `owner_only`; fix `findDirect` to key on visibility so Only you does not steal the shared trade thread.

**Tech Stack:** NestJS + Prisma, `@ekum/domain-types`, React Query + React Router, Vitest.

**Spec:** [docs/superpowers/specs/2026-08-23-company-team-design.md](../specs/2026-08-23-company-team-design.md)  
**Completeness:** [docs/superpowers/reviews/completeness/2026-08-23-company-team-completeness.md](../reviews/completeness/2026-08-23-company-team-completeness.md)

## Global Constraints

- Company is the trading actor; users are memberships. Counterparties see the **business name**.
- Copy: **Team** · **Invite** · **Staff** · **Team can see** · **Only you**. No employee / admin / DM / Seller / Buyer on chat cards.
- Phone that already has a business **cannot** join (same spirit as `COMPANY_EXISTS`).
- Last owner cannot be removed or demoted.
- Groups stay **shared**. Owner-only is 1:1 only this slice.
- Reuse kit: `Sheet`, `Field`, `TextInput`, accent-border rows, `ConnectionPicker` language. Team lives under **You**, not a nav tab.
- `ensureTradeThread` always **shared**.
- No People tab, no person-to-person inbox, no company switcher, no SMS gateway.
- Completeness Proceed; update living `docs/features` before claiming done.
- Commit only when the user asks. Stay on `main`.

## File map

| Area | Files |
|------|--------|
| Living docs | `docs/features/00-concepts.md`, `chat.md`, `company.md`; gap matrix |
| Contracts | `packages/domain-types/src/company.ts`, `auth.ts` (session), new `team.ts` |
| Schema | `apps/api/prisma/schema.prisma` + `TeamInvite` migration |
| Auth | `apps/api/src/auth/auth.types.ts`, `jwt-auth.guard.ts`, `auth.service.ts` (`/auth/me`) |
| Team API | `apps/api/src/identity/team.service.ts`, `team.controller.ts`, identity module |
| Permissions | `apps/api/src/auth/require-permission.ts` (or guard) + wire controllers |
| Chat | `apps/api/src/conversation/thread.service.ts` (`findDirect` + visibility) |
| Web Team | `apps/web/src/features/team/TeamPage.tsx`, `TeamInviteLandingPage.tsx` |
| Chat UI | `apps/web/src/features/chats/StartChatSheet.tsx` |
| Session chrome | `useMyCompany` / `useTeamCaps`, `MorePage.tsx`, `AppShell.tsx` |
| Router | `apps/web/src/app/router.tsx` (`/team`, `/t/:token`) |
| Invite return | `apps/web/src/lib/inviteReturn.ts` (allow `/t/`) |
| Seed | `apps/api/prisma/seed.ts` optional staff user |

## Locked shapes

```prisma
model TeamInvite {
  id               String    @id @default(cuid())
  companyId        String
  invitedByUserId  String
  token            String    @unique
  name             String
  phone            String    // 10-digit stored canonical
  expiresAt        DateTime
  usedAt           DateTime?
  createdAt        DateTime  @default(now())

  company Company @relation(...)
  @@index([companyId])
  @@index([phone])
}
```

```ts
// AuthPrincipal additions
permissions: CompanyPermissions | null; // null when no company

// OwnCompanyProfile additions
role: 'owner' | 'staff';
permissions: CompanyPermissions;

// TeamMemberView
{ userId, name, phoneMasked, role, permissions, contactRole }

// POST /team/invites { name, phone }
// GET  /team/members
// PATCH /team/members/:userId { permissions?, role? }  // cannot demote last owner
// DELETE /team/members/:userId
// GET  /team/invites/:token   (auth optional for landing copy)
// POST /team/invites/:token/join
```

Invite TTL: **7 days**, one use. Join requires OTP user whose digits match `phone`.

Default staff caps: `{ uploads: false, chats: true, orders: true, payments: false, team: false }`.

`requirePermission('chats' | 'orders' | 'uploads' | 'payments' | 'team')` → 403 `{ code: 'NOT_ALLOWED', message: 'You cannot do this.' }`. Owner role still must have the flag (owners default all true).

---

### Task 0: Lock living docs

**Files:**
- Modify: `docs/features/00-concepts.md` (Phase 1 “treat company as sole actor” → Team is now in product)
- Modify: `docs/features/chat.md` (Team can see / Only you; owner_only is shipped)
- Modify: `docs/features/company.md` (You → Team)
- Modify: `docs/superpowers/reviews/feature-gap-matrix.md`

- [ ] **Step 1:** Write the three doc updates to match the spec (no new IA).
- [ ] **Step 2:** Confirm Completeness disposition is **Proceed** and G-001/G-003 are written.

---

### Task 1: Principal carries caps

**Files:**
- Modify: `apps/api/src/auth/auth.types.ts`, `jwt-auth.guard.ts`
- Modify: `apps/api/src/auth/auth.service.ts` (`me` payload)
- Create: `apps/api/src/auth/require-permission.ts` + `require-permission.spec.ts`
- Modify: `packages/domain-types` session / `OwnCompanyProfile` + serializer

```ts
// jwt-auth.guard — select role + five can* columns
permissions: membership
  ? {
      uploads: membership.canUploads,
      chats: membership.canChats,
      orders: membership.canOrders,
      payments: membership.canPayments,
      team: membership.canTeam,
    }
  : null;
```

- [ ] **Step 1:** Unit: staff with `canChats: false` fails `assertPermission(principal, 'chats')`.
- [ ] **Step 2:** Implement guard load + helper. Owner with all flags true passes.
- [ ] **Step 3:** Expose `role` + `permissions` on `GET /companies/me` and `/auth/me`.
- [ ] **Step 4:** Run `pnpm --filter @ekum/api test -- require-permission jwt-auth`

---

### Task 2: Team invite + members API

**Files:**
- Create: migration `apps/api/prisma/migrations/20260823010000_team_invite/`
- Create: `apps/api/src/identity/team.service.ts`, `team.controller.ts`, `team.service.spec.ts`
- Modify: `schema.prisma` (`TeamInvite` + `Company.teamInvites`)
- Modify: `identity.module.ts`

Rules to test first:

1. Invite creates token; phone normalized like order-invite (`phoneDigits`).  
2. Join: matching phone, unused, unexpired → staff membership + `usedAt` + reissued tokens.  
3. Join rejected: wrong phone, expired, already used, user already has **any** membership (`ALREADY_HAS_BUSINESS`), already on this company (`ALREADY_MEMBER`).  
4. Patch caps: actor needs `team`; cannot strip last owner; cannot edit another owner unless actor is owner.  
5. Delete staff: same; cannot delete last owner.

- [ ] **Step 1:** Write failing specs for the five rules.
- [ ] **Step 2:** `prisma migrate` locally; implement service/controller.
- [ ] **Step 3:** `pnpm --filter @ekum/api test -- team`

---

### Task 3: Enforce caps on write APIs

**Files (add `requirePermission` beside existing company/user decorators):**
- Chats: `conversation.controller.ts` — list/send/start/group need `chats`
- Orders: `order.controller.ts`, `buy-for-buyer` — create/accept/dispatch/for-buyer need `orders`; payment routes need `payments`
- Catalog / media writes: `product.controller.ts`, `collection.controller.ts`, `media.controller.ts` — `uploads`
- Team routes: `team` cap (Task 2)

Read-only Explore / company shop stay open (no extra cap).

- [ ] **Step 1:** Spec or controller-level unit: staff `canOrders: false` gets 403 on `POST /orders`.
- [ ] **Step 2:** Wire decorators. Do not hide GET order detail if they have chats or orders (if both off, 403 on orders list).
- [ ] **Step 3:** `pnpm --filter @ekum/api test -- team order conversation`

---

### Task 4: Direct thread = pair + visibility

**Files:**
- Modify: `apps/api/src/conversation/thread.service.ts` (`findDirectThread`)
- Modify: `thread.service.spec.ts`

```ts
private findDirectThread(a: string, b: string, visibility = ThreadVisibility.Shared) {
  return this.prisma.thread.findFirst({
    where: {
      type: ThreadType.Direct,
      visibility,
      AND: [
        { participants: { some: { companyId: a } } },
        { participants: { some: { companyId: b } } },
      ],
    },
    include: { participants: true },
  });
}
```

- `startDirect` uses `dto.visibility`.  
- `ensureTradeThread` / activate-on-order keep **shared**.  
- Staff `create` with `owner_only` → 403 (owner only).

- [ ] **Step 1:** Failing test: shared exists; `startDirect({ visibility: owner_only })` creates a second thread.
- [ ] **Step 2:** Implement; confirm staff list still excludes owner_only (already in `list`).
- [ ] **Step 3:** `pnpm --filter @ekum/api test -- thread.service`

---

### Task 5: You → Team UI + invite landing

**Files:**
- Create: `apps/web/src/features/team/TeamPage.tsx`, `TeamInviteLandingPage.tsx`
- Modify: `MorePage.tsx` (link **Team**), `router.tsx`
- Modify: `inviteReturn.ts` — stash `/t/:token` like `/r/`
- Modify: `LoginPage.tsx` / `OnboardingPage.tsx` — if return is `/t/…`, go there instead of company create
- Modify: `RequireAuth.tsx` — public-ish `/t/:token` still needs auth to join (same as `/r/`)

UI:

- List: `h-12` initial + name + role line (Staff / Owner). Tap row (owner or `team`) → sheet of five accent-border caps + Remove.  
- Header **Invite** → name + 10-digit + Share / Copy (`shareOrCopyInvite`).  
- Landing: business name, **Join {name}**. Success → `/`.

- [ ] **Step 1:** Wire routes and You link (hide Team if `!permissions.team` unless we still show read-only list — **show list to all members; Invite/edit only if team**).
- [ ] **Step 2:** Sheets match kit; last row clears sheet chrome (BM-07).
- [ ] **Step 3:** `pnpm --filter @ekum/web test` not required if no new pure helpers; add `phoneDigits` reuse from existing util if extracted.

---

### Task 6: Chrome hides work they cannot do

**Files:**
- Create: `apps/web/src/lib/teamCaps.ts` — `useTeamCaps()` from `useMyCompany()`
- Modify: `AppShell.tsx` (＋ items: Add designs / New collection need uploads; Photo order needs orders)
- Modify: `StartChatSheet` / Chats ＋ — disable if `!chats`
- Modify: catalog / orders entry points that would 403

Owner-only start:

```ts
// StartChatSheet — after picking a company, if role === owner:
// two rows: Team can see → POST /threads/direct { companyId, visibility: 'shared' }
// Only you → visibility: 'owner_only'
// Staff: existing single POST (shared).
```

- [ ] **Step 1:** Helper `can(caps, 'chats')` unit (owner/staff fixtures).
- [ ] **Step 2:** Wire ＋ and Chats. Staff never sees **Only you**.
- [ ] **Step 3:** `pnpm --filter @ekum/web test -- teamCaps`

---

### Task 7: Seed + verify

**Files:**
- Modify: `apps/api/prisma/seed.ts` — optional `seed-user-ravi-staff` membership on Ravi’s company (`canPayments: false`)
- Tests as above + `pnpm --filter @ekum/api test -- team thread.service require-permission`

- [ ] **Step 1:** Seed staff if cheap; document login phone in seed comment.  
- [ ] **Step 2:** Manual: owner Invite → second OTP → Join → staff sees shared chat, not Only you; ＋ Add designs hidden if uploads off.  
- [ ] **Step 3:** No new Playwright required this slice (Unit-only + one manual path). Say so in gap matrix.

---

## Verify (before claiming done)

```
pnpm --filter @ekum/api test -- team thread.service require-permission
pnpm --filter @ekum/web test -- teamCaps
```

Living docs from Task 0 updated. Completeness scope only.

## Out of this plan

How many each one-search / remember logged buyers. People suggestions. Company switcher. Owner-only groups.
