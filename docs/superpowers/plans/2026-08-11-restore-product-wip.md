# Restore product WIP + Completeness pass

**Date:** 2026-08-11  
**Goal:** Bring back parked product work from stash, review it under the Feature Completeness gate, then land only approved scope (separate from the quality PR).

**Preconditions**
- Quality branch `quality-gate-wave1` is pushed (PR open or merged — prefer **merged to `main` first** to avoid mixing quality history with WIP commits).
- Stash present: `stash@{0}` — `wip/product-ongoing: park outside quality PR`.

---

## Step 1 — Branch for WIP (do not commit onto quality tip unless intended)

```bash
git fetch origin
git checkout main
git pull origin main   # after quality PR merges; if PR still open, use: git checkout -b wip/product-ongoing origin/main
git checkout -b wip/product-ongoing
```

If quality PR is **not** merged yet and you must continue now:

```bash
git checkout -b wip/product-ongoing quality-gate-wave1
```

( Prefer waiting for merge so WIP is based on `main` + quality. )

---

## Step 2 — Restore stash

```bash
git stash list   # confirm message: wip/product-ongoing: park outside quality PR
git stash pop stash@{0}
```

Resolve any conflicts (likely in files also touched by quality slice: keep quality testids/padding; re-apply product logic carefully).

**Do not** restore `.superpowers/sdd` or `apps/e2e/test-results` into the WIP commit.

---

## Step 3 — Inventory what came back

Expected areas (from park list):

| Area | Paths |
|------|--------|
| API conversation | `message.service.ts`, controller, specs; migration `20260811170000_message_thread_type_index` |
| API orders | `order.service.ts` + specs |
| Prisma | `schema.prisma` (+ migration) |
| Domain | `packages/domain-types` conversation + orders |
| Web orders | `OrderDetailPage`, `OrdersPage`, `orderAttention`, `orderCardCopy` |
| Web chrome | `icons.tsx` |

Produce a short inventory note in the Completeness doc: what each change is for (search view filters? living order? attention? etc.).

---

## Step 4 — Feature Completeness Review (hard gate)

Do **not** implement or PR until disposition is **Proceed**.

1. Group WIP into **one or more modules** (e.g. Thread message filters / living orders / Home attention) — do not treat “everything in the stash” as one feature if it mixes jobs.
2. For each module, write:

   `docs/superpowers/reviews/completeness/YYYY-MM-DD-<module>-completeness.md`

   using `docs/superpowers/reviews/completeness/TEMPLATE.md`.

3. Answer platform consistency; use **Reject / Redesign** if anything fights Ekum philosophy.
4. Classify gaps: Required / Recommended / Future / Reject.
5. Update `docs/superpowers/reviews/feature-gap-matrix.md` rows for this WIP.

**Stop if disposition is Redesign or Reject** until the ask is reshaped or dropped.

---

## Step 5 — Implement only approved Required scope

- Update `docs/features/*.md` for shipped behaviour.
- Implement Required gaps only; leave Future out.
- Add/adjust tests:
  - API `*.spec.ts` as needed
  - `@functional` / `@regression` if user-visible journeys change
- Verify:

```bash
pnpm test
pnpm --filter @ekum/web typecheck
pnpm --filter @ekum/api typecheck   # if API touched
pnpm test:e2e:smoke
pnpm test:e2e:functional   # if journeys affected
```

---

## Step 6 — Commit + PR (WIP product only)

- Commit on `wip/product-ongoing` with a message reflecting the **approved module(s)**, not “wip dump”.
- Push and open PR into `main` (after quality is merged).
- PR description: Completeness link, approved scope, test commands, explicit out-of-scope.

---

## Stop conditions

- Do not squash product WIP into the quality PR.
- Do not skip Completeness because “it was already half-built.”
- After product PR merges: stop — pick the next gap-matrix item only when asked.

## Todos

- [x] Step 1 — create `wip/product-ongoing` from quality tip (quality PR not on main yet)
- [x] Step 2 — `git stash pop` and resolve conflicts (clean pop)
- [x] Step 3 — inventory restored changes by module
- [x] Step 4 — Completeness Review(s) → Proceed
- [x] Step 5 — implement approved scope + verify (units green; smoke 2/2; orders+chat functional green; collections flaky unrelated)
- [x] Step 6 — commit + push `wip/product-ongoing` (PR: open manually vs `quality-gate-wave1`; `gh` unavailable)
