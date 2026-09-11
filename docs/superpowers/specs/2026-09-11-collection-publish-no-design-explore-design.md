# Collection publish does not Explore-post member designs — design

**Date:** 2026-09-11  
**Status:** Approved  

**Anchors:** `docs/features/collections.md`, `docs/features/00-concepts.md` (Publish = Explore), `CollectionService.publish`

## Job

Publishing a **collection** puts **one pack** on Explore — not dozens/hundreds of separate design posts. Buyers must still **Order / Share / Curate** individual designs **from inside** that pack.

## Rules

| Action | Result |
|--------|--------|
| Publish collection | Collection → Published (+ Explore activity). Own **draft** members → `Published` with pack audience/rates/forward, but **`postedToMarketAt` left null** (no standalone Explore design tile). |
| Explore home | Pack appears. Member designs do **not** appear as separate design posts. |
| Open pack (buyer) | Sees designs inside; can select → Order / Share / Curate. |
| Publish design (My designs) | Sets `postedToMarketAt` → optional standalone Explore tile. |
| Foreign curated members | Unchanged (already published by source). |

## Why not leave drafts

Explore product open, Selection, chat share, and trade paths require `ProductStatus.Published`. Draft-only would block Order/Share/Curate from the pack.

## Out of scope

- Clearing `postedToMarketAt` on designs that already had a solo Explore post before joining the pack  
- Hiding designs from pack viewers  
- Changing Explore shelf ranking  
