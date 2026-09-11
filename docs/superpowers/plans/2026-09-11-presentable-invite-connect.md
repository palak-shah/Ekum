# Presentable invite to connect — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trusted WhatsApp invite share (one URL, branded OG) and a focused `/r/:token` landing without bottom nav.

**Architecture:** Reuse catalog share-link OG HTML + Vite bot middleware for `/r/`. Fix `shareOrCopyInvite` so WhatsApp does not duplicate the URL. Move referral landing outside AppShell like `/s/` and `/t/`.

**Tech Stack:** NestJS public card route, Vite middleware, React landing, Vitest.

## Global Constraints

- Copy: `{Business} invites you to connect on Ekum`; title `Ekum · Connect with {Business}`.
- Share: URL once in text; do not pass `url` when already in text.
- OG image: referrer logo if absolute http(s), else `/brand/app-icon-512.png`.
- Landing: outside AppShell; no bottom nav; trust ladder unchanged.
- No PNG attachment in share sheet.

## File map

| File | Role |
|------|------|
| `apps/web/src/lib/shareInvite.ts` | Share API + invite copy |
| `apps/web/src/lib/shareInvite.spec.ts` | Unit tests |
| `apps/api/src/referral/referral-og.ts` | OG HTML builder |
| `apps/api/src/referral/referral.controller.ts` | `GET :token/card` public |
| `apps/api/src/referral/referral.service.ts` | Resolve for card |
| `apps/web/vite.config.ts` | Bot middleware for `/r/` |
| `apps/web/src/features/referrals/ReferralLandingPage.tsx` | Focused UI |
| `apps/web/src/app/router.tsx` | Route outside shell |
| Call sites FindOnEkum / Referrals / Compose | Pass company name |
| `docs/features/referrals.md` | Shipped behaviour |

---

### Task 1: Share payload — no double URL + B copy

**Files:**
- Modify: `apps/web/src/lib/shareInvite.ts`
- Modify: `apps/web/src/lib/shareInvite.spec.ts`
- Modify call sites that use `inviteShareCopy`

- [ ] **Step 1:** Failing tests for `inviteShareCopy` (connect with business name; vouch) and `shareOrCopyInvite` omits `url` when message contains it.

- [ ] **Step 2:** Implement:
  - `inviteShareCopy({ kind, companyName, targetName? })`
  - `shareOrCopyInvite`: `navigator.share({ title, text: message })` without `url` when `message.includes(url)`; clipboard still copies `url`.

- [ ] **Step 3:** Pass referrer name from FindOnEkumBlock, ReferralsPage, ReferralComposePage.

- [ ] **Step 4:** Run `pnpm --filter @ekum/web exec vitest run src/lib/shareInvite.spec.ts`

---

### Task 2: Public referral OG card

**Files:**
- Create: `apps/api/src/referral/referral-og.ts` (+ spec)
- Modify: `apps/api/src/referral/referral.controller.ts`
- Modify: `apps/api/src/referral/referral.service.ts` if needed for card summary
- Modify: `apps/web/vite.config.ts` — extend middleware for `/r/:token`

- [ ] **Step 1:** Failing test: OG HTML title/description/image for open invite and vouch.

- [ ] **Step 2:** Implement `referralOgHtml` + `@Public() GET :token/card` (HTML Content-Type). Reuse escape helpers from share-link-og or share a tiny shared util.

- [ ] **Step 3:** Vite: bots on `/r/:token` fetch `${apiBase}/referrals/${token}/card`.

- [ ] **Step 4:** Run API vitest for referral-og.

---

### Task 3: Focused `/r/:token` landing

**Files:**
- Modify: `apps/web/src/app/router.tsx` — move `r/:token` next to `/s/:token` / `/t/:token`
- Modify: `apps/web/src/features/referrals/ReferralLandingPage.tsx`
- Possibly `@Public()` on resolve OR use publicGet for preview + authed redeem (team invite uses publicGet)

- [ ] **Step 1:** Make `GET /referrals/:token` public for landing resolve (card already public) — redeem stays authed. Or publicGet only for unauthenticated preview; if resolve is already used after login, keep authed resolve and use public card JSON… Prefer: `@Public()` on `resolve` like team invites (read-only summary).

- [ ] **Step 2:** Redesign landing: InviteShell (no nav), Ekum mark, large Avatar, headline/why-line/CTA per spec; guest → login stash; onboard → onboarding; ready → redeem/request.

- [ ] **Step 3:** Update `docs/features/referrals.md` + gap matrix line.

- [ ] **Step 4:** Run web tests touched; smoke mentally guest vs authed paths.

---

### Task 4: Spec status + verify

- [ ] Mark design status **Approved / shipped** when done.
- [ ] Run: shareInvite + referral-og unit tests PASS.
