# Integrate Wave 1 + quality/journey work

**Date:** 2026-08-11  
**Branch:** `quality-gate-wave1` (12 commits ahead of `main` at `5cd90b4`)  
**Goal:** Land Wave 1 plus Completeness / functional journeys / BM-07 without unrelated product WIP.

---

## Step 1 — Commit only the quality slice

Stage and commit **these**:

**Include**
- `.cursor/rules/` — `feature-tests-required.mdc`, `quality-feature-gate.mdc`, `ui-quality-bar.mdc`
- `apps/e2e/` — `helpers/` (orders, persona), `package.json`, smoke retags, `tests/functional/**`, `fixtures/sample.jpg`
- `apps/web/` quality-related only:
  - `ThreadPage.tsx` (search/photo/accept testids)
  - `ExplorePage.tsx` (filter testids)
  - `CollectionViewerPage.tsx` (select bar padding BM-07 + `collection-select` testid)
- `docs/features/` — chat, orders, collections, explore, media (Automated verification)
- `docs/superpowers/` — specs update, `plans/2026-08-11-quality-gate-wave1.md`, `reviews/**` (completeness, gap matrix, close-outs)
- Root `package.json` — `test:e2e:functional`
- `pnpm-lock.yaml` only if this slice changed deps

**Exclude (leave unstaged)**
- `apps/api/**` product WIP (order/message services, schema, migration, specs)
- `packages/domain-types/**` product WIP
- `apps/web` product WIP: `orderCardCopy.ts`, `OrderDetailPage`, `OrdersPage`, `orderAttention`, `icons`
- `.superpowers/sdd/` session scratch
- `apps/e2e/test-results/`

Commit message:

```
test: add functional journeys, Completeness gate, and BM-07 chrome clearance
```

Do **not** amend Wave 1 history — new commit on top of `5cd90b4`.

---

## Step 2 — Re-verify

API + web up, DB seeded, `OTP_EXPOSE_DEV_CODE=true`:

```bash
pnpm test
pnpm --filter @ekum/web typecheck
pnpm test:e2e:smoke
pnpm test:e2e:functional
```

All must pass before Step 3. If a journey fails because it needed excluded WIP, fix inside the quality slice — do not re-include product WIP to greenwash.

---

## Step 3 — Push and open PR (preferred)

```bash
git push -u origin HEAD
gh pr create --title "…" --body "…"
```

PR summary bullets:
- Wave 1: web Vitest + Playwright smoke + CI e2e `workflow_dispatch`
- Completeness gate + platform consistency / Reject–Redesign
- `@functional` journeys (chat, orders lifecycle, collections, explore, media)
- BM-07 collection select chrome padding

PR test plan: Step 2 commands; dispatch CI e2e once after merge.

Local merge to `main` only if you choose that over PR.

---

## Step 4 — Park unrelated WIP

Keep remaining dirty API/UI files **out** of the quality PR.

Optional: `git stash -u` or branch `wip/product-ongoing` for safekeeping.

Next work on that WIP: Feature Completeness Review first, then implement.

---

## Stop conditions

- Do not merge if Step 2 fails.
- Do not include API/domain product diffs in the quality PR.
- After merge: stop — do not auto-start Requests/dispatch features unless asked.

## Todos

- [x] Step 1 — commit quality slice only (`bd38688`)
- [x] Step 2 — re-verify suites green
- [x] Step 3 — push `quality-gate-wave1` (gh CLI missing — open PR via GitHub URL)
- [x] Step 4 — park product WIP in `stash@{0}` (`wip/product-ongoing: park outside quality PR`)
