# Batch 4D F-12 — Multi-hop performance instrumentation

**Date:** 2026-11-20  
**Mode:** Instrument + measure only (no permission / fail-closed / pricing behaviour change)

## What was added

Safe debug samples via `RepostHopPerf` (`apps/api/src/catalog/repost-hop-instrument.ts`):

| Field | Meaning |
|-------|---------|
| `op` | `lineage_credit` · `availability` · `pricing_resolve` |
| `hopCount` | Ancestor packs loaded / visited packs |
| `queryRounds` | BFS rounds or recursive resolve steps |
| `durationMs` | Wall time for that root call |
| `failure` | `none` · `incomplete_chain` · `cycle` · `missing_source` · `unknown` |
| `packCount` | Roots / feed packs in the batch (when known) |

Payloads **never** include company ids, product ids, shop names, or rates.

Wired into:

- `loadSourceCreditHopRows` (credit lineage BFS)
- `loadUpstreamPackRows` (soft-unavailable BFS)
- `resolvePackMemberBuyerRates` (root call only; recursion shares visited set)

## Measured / inspected hotspots (do not optimize in 4D)

1. **Dual unbounded BFS on Explore / shop / search**  
   Each feed page runs `packIdsSoftUnavailable` → `loadUpstreamPackRows`, then separately `loadSourceCreditHopRows` over the same `repostSourceCollectionId` set. Same ancestry walked twice with different selects.  
   **Evidence:** `explore.service` feed / `toCollectionCardPage`; `company.service` shelf; `search.service`.  
   **Sample shape:** two `availability` + `lineage_credit` logs per page with matching `packCount` / similar `hopCount`.

2. **Per-pack pricing resolve (N root walks)**  
   `resolvedBandsForPacks` fans out `resolvePackMemberBuyerRates` once per calc-mode pack (`Promise.all`). Each root does `collectionProduct.findMany` + optional `collection.findUnique` + recurse. Overlapping upstream packs are **not** shared across siblings.  
   **Evidence:** `repost-pricing-resolve.ts` `resolvedBandsForPacks`.  
   **Sample shape:** N × `pricing_resolve` with `packCount: 1` and `hopCount` = chain depth.

3. **Album detail double load**  
   Soft-unavail check + credit hops + pricing resolve on the same album can each walk ancestors again. Fail-closed behaviour must stay; merge only after measuring.

## Intentional non-changes

- No depth caps restored (fail-closed full chain stays).
- No query merging / caching in this batch.
- No schema / migrations.

## Next (out of scope)

If production logs show high `durationMs` with `hopCount` ≫ 4 or large `packCount` on dual BFS, consider one shared ancestor load (credit + availability fields) and a pricing resolve cache keyed by pack id within a request — behind a Completeness note, not silent.
