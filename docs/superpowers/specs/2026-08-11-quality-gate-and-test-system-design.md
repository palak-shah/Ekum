# Quality gate and test system — design

**Date:** 2026-08-11  
**Status:** Wave 1 done; Functional journeys + Feature Completeness program **done** (see `docs/superpowers/reviews/2026-08-11-functional-journeys-review.md`)  
**Goal:** Every feature passes a Feature Completeness Review (PM/UX/Architect + platform consistency), then is proven with **separate** functional and regression automated coverage.

## Problem

- API has a solid Vitest suite; CI runs `pnpm test`.
- Web now has Vitest + Playwright smoke for known regressions (Wave 1), but **functional** journeys and Completeness reviews were not yet systematic.
- Recent defects clustered in chat/orders UI (order-card thumb overflow `+N`, filter menus trapped by CSS transforms, shortlist persist races, living order card / search scopes).

## Success criteria

1. **Feature gate:** Explaining a feature triggers architect/UX challenge, feature-doc update, and an explicit test matrix before implementation is called done.
2. **UI regressions (A):** Pure logic and presentational components that encode chat/orders UX rules have Vitest + Testing Library coverage; bug-mode cases are regression tests.
3. **Journeys (B):** Playwright covers critical trade paths across the platform, seeded with Ravi/Meena (and unconnected where needed).
4. **Sequencing:** Chat/orders Wave 1 is green first; the same harness expands to full platform (Waves 2–3) without a rewrite.
5. **CI:** Web unit tests join `pnpm test`; Playwright runs as a separate job once stable (seeded API + web).

## Non-goals

- Pixel-perfect visual snapshot farming as the primary strategy.
- Replacing feature docs with tests — docs remain the product contract; tests enforce them.
- 100% line coverage as a vanity metric.

## Approach (chosen)

**Layered quality system:** Feature Completeness Review (hard gate) + regression track (`@smoke @regression` / BM-* units) + functional track (`@functional` journeys) + living gap matrix. Goal is **platform coherence**, not making every request work (Reject/Redesign when philosophy conflicts).

Rejected: E2E-only (too slow/flaky for pure UI math); checklist-only (won’t scale).

### Functional vs regression

| Track | Tag / location | Purpose |
|-------|----------------|---------|
| Completeness | `docs/superpowers/reviews/completeness/` | PM/UX/Architect + platform consistency before build |
| Regression | `@smoke @regression`, BM-* web units | Known bugs don’t return |
| Functional | `@functional` + module tag | Capability works end-to-end for users |
| Gap matrix | `docs/superpowers/reviews/feature-gap-matrix.md` | Works / Partial / Missing / Later / Rejected |

Commands: `pnpm test:e2e:smoke` · `pnpm test:e2e:functional`

---

## 1. Feature gate (every feature)

When the user explains or requests a feature, before/while building:

| Step | Owner | Output |
|------|--------|--------|
| **Challenge** | Agent as senior architect + UI/UX | Better UX/data model if the ask fights platform rules; call out trade-offs |
| **Spec delta** | Agent | Update `docs/features/*.md` — flows, business rules, empty/edge cases |
| **Test matrix** | Agent | Happy path, personas, mobile viewport, bug modes from similar past bugs |
| **Definition of done** | Shared | Not done until matrix has automated coverage **or** a written manual exception with reason |

### Platform rules to challenge against (non-exhaustive)

- Living order reference (one updating chat message; rich → compact; tap → order detail)
- Actors: **You** / counterpart **business name** — never Seller/Buyer in card body
- Requests inbox vs order Accept/Decline language
- Source masking on catalog cards; owner company on cards
- Dual-company trade (Ravi / Meena) and unconnected first-contact → Requests
- Mobile-first PWA; overlays must survive transform/stacking contexts (portals)

### What “senior-tested” means

- Happy path for the feature
- At least one **cross-persona** check when trade is involved
- At least one **bug-mode** from the catalog below (or a new entry if novel)
- Explicit note of what remains manual (if any) and why

---

## 2. Test pyramid

| Layer | Tool | Location | Owns |
|-------|------|----------|------|
| API / domain | Vitest (existing) | `apps/api/**/*.spec.ts` | Orders upsert, message filters, access, quotes, serializers |
| Web logic + components | Vitest + Testing Library (**new**) | `apps/web/**/*.{test,spec}.{ts,tsx}` | `PhotoAlbum` overflow, order card copy/rich-compact helpers, `threadMessageSearch`, shortlist clear helpers, filter menu portal behavior where unit-testable |
| Journeys | Playwright (**new**) | `e2e/` or `apps/web/e2e/` | Seed login → chat → request designs → quote → accept → order detail; explore/orders filters; collection select → order/ask rates; home/auth smoke |

### Web unit conventions

- Prefer testing **exported helpers and small presentational components** over full `ThreadPage` mounts when possible.
- Use `data-testid` sparingly on stable interaction targets needed by E2E (order card, search band, accept quote).
- Mirror API Vitest setup style; add `test` script to `@ekum/web` so `pnpm -r test` picks it up.

### Playwright conventions

- Seed DB + known OTP/dev auth path used by local dual-host testing.
- Tags: `@chat`, `@orders`, `@explore`, `@collections`, `@home`, `@auth`.
- Default CI run: `@smoke` subset; full suite nightly or on-demand until flake rate is low.
- One project/config for the whole platform; waves only add specs and tags.

---

## 3. Full-platform map (waves)

### Wave 1 — Chat + orders (first green)

**Unit / component**

- `PhotoAlbum`: `itemCount > images.length` → last cell shows `+N` for 1/2/3/4 layouts
- Order card helpers: rich vs compact; copy uses You / business name
- Thread search helpers: scope browse vs typed match; hit order newest-first
- Living order dedupe helper: legacy stacks show latest only

**E2E (@chat @orders @smoke)**

1. Meena/Ravi open seeded thread; send text; unread clears  
2. Request designs (multi-design) → rich order card shows thumbs + `+N` when images < count  
3. Seller quotes → Accept quote CTA when allowed → status updates living chip/card  
4. In-thread search: Orders/Media scopes; typed query stepper  

### Wave 2 — Collections + Explore/Orders chrome

- Collection shortlist → order / ask rates clears selection (no persist ghost)
- Explore + Orders filter/more menus: open, select, dismiss (outside click / Escape) without trap

### Wave 3 — Rest of platform smoke

- Home attention / needs-you entry points that deep-link into chat or orders
- Auth OTP happy path; onboarding skipped for seed phones
- Settings smoke (open, save one non-destructive preference if applicable)
- Unconnected company → message → appears in recipient **Requests**

---

## 4. Bug-mode catalog (living)

Each new production UI bug **adds a case here** and a failing test before the fix.

| ID | Mode | Expected |
|----|------|----------|
| BM-01 | Count vs thumbs | Order/album shows `+N` on last preview when `itemCount > previewImages` |
| BM-02 | Transform stacking | Menus/popovers portaled to `document.body`; dismiss on outside / Escape |
| BM-03 | Persist race | Clearing selection after success must win over sessionStorage rehydrate |
| BM-04 | Living order stack | UI shows one reference per order; legacy duplicates collapsed |
| BM-05 | Frozen quote copy | Accept CTA gated by live `canAcceptQuote`; do not rewrite frozen quote text incorrectly |
| BM-06 | Search empty All | Empty All + search open shows hint; does not re-list whole thread as “results” |
| BM-07 | Fixed chrome clips content | With sticky/fixed bars active (select, composer, CTAs), last visible card/title is fully readable; padding clears nav + bar stack |

---

## 5. CI integration

Current CI: install → prisma generate → domain-types build → lint → typecheck → **test** → build.

Target:

1. `@ekum/web` gains `test` (Vitest); included in `pnpm test`.
2. New workflow job `e2e` (or step behind flag): start Postgres (or service container), migrate + seed, start API + web, run Playwright `@smoke`.
3. Full Playwright suite not required on every PR until Wave 1 is stable; document command for local full run.

---

## 6. Agent workflow (standing)

For future features in this repo:

1. Challenge + propose better shape when the ask is suboptimal for Ekum.  
2. Update feature doc.  
3. Write/extend test matrix (unit + E2E tags).  
4. Implement TDD-style where practical: failing test for bug modes first.  
5. Verify with `pnpm test` / Playwright smoke before claiming done.  
6. Add novel bug modes to the catalog.

Optional follow-up (separate from this design): Cursor rule under `.cursor/rules/` encoding this gate so every chat session inherits it.

---

## 7. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Playwright flake / auth complexity | Prefer API-seeded session helpers; `@smoke` small; retry once in CI |
| Over-testing ThreadPage monolith | Extract helpers; test those; E2E for wiring |
| Scope explosion | Waves are sequential; Wave 1 blocks “full platform green” claims |

## Out of scope for Wave 1 implementation plan

- Visual regression service (Percy/Chromatic)
- Load/performance testing
- Native mobile apps

