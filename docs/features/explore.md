# Explore & search

## Purpose

Discovery surface for posts (collections and designs), businesses, and federated search. Ranking is **opportunity / interest**, not engagement vanity metrics.

## Who uses it

Primarily buyers (and dual-role companies browsing). Sellers appear as the source of posts, not as the primary Explore operator.

## User flows

1. Open **Explore** (`/explore`) — tabs/sections for All, Collections, Designs, Businesses (as implemented).
2. Filter by category / city where offered.
3. Follow suppliers; open album or design detail (`/explore/products/:id`, `/collections/:id`).
4. Search (`/search`) — federated company / collection / design; feed stays until the user types (UX rule).
5. From company cards → public profile → follow / request access / chat.

## Business rules

| Rule | Detail |
|------|--------|
| Visibility | Blocked companies never appear; audience (`everyone` / `connections` / `selected`) enforced server-side |
| Designs on Explore | Need catalog publish **and** post-to-market (`postedToMarketAt`) |
| Collections on Explore | Published albums with activity rules — see [collections](./collections.md) |
| Follow | Permissionless; does not replace access for trade |
| Ranking | Interest / opportunity matching (`feed-rank`, `interest-match`) — not likes/viral scores |
| Why-lines | Cards may show relevance / posted-time cues for clarity |

## Edge cases / empty states

- Cold start: prompt to browse businesses.
- Following filter empty until the user follows someone.
- Selected-audience posts hidden from non-selected viewers.

## Seed walkthrough

1. As **Meena**: Explore → find Surat Silk House / Wedding Edit.
2. Follow Ravi’s company if not already; confirm Following feed on Home / Explore.
3. As **Ravi**: post a design to Explore → confirm Meena can see it when audience is connections/everyone.

## Automated verification

- Functional: `pnpm test:e2e:functional` — `@explore` browse, filter dismiss, open collection
- Completeness: `docs/superpowers/reviews/completeness/2026-08-11-explore-completeness.md`

## Where it lives

- Web: `apps/web/src/features/explore/`
- API: `apps/api/src/discovery/`
- Contracts: `packages/domain-types/src/discovery.ts`
