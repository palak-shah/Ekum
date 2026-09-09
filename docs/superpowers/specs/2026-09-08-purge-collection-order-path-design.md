# Purge collection orderPathPreference reads/writes — design

**Date:** 2026-09-08  
**Status:** Approved (conversation)  
**Anchors:** unified main+linked lots, remove Profile path, TradeLane / Your paths  
**Completeness:** `docs/superpowers/reviews/completeness/2026-09-08-purge-collection-order-path-completeness.md`

## Problem

`Collection.orderPathPreference` outlived Publish path radios. Publish still stamps it; pack viewer still reads it. Path is TradeLane / Your paths; curated Place is always from-pack.

## Product promise

1. **Stop writing** `orderPathPreference` on collection create/update/publish from web (and stop sending it in publish DTOs).  
2. **Stop reading** it for pack Order UI / shortlist path / resolve path preview — curated pack ⇒ handle / from-pack behaviour.  
3. **Keep** Prisma column + API field for now (may still return stale values; clients ignore). Drop column later.  
4. Chat/share metadata: stop stamping new `orderPathPreference` when sharing packs; old meta ignored for place (lane wins).  
5. Company `tradeDefaults.orderPathPreference` residual resolver can remain (unused for packs).

## Out of scope

- DB migration dropping the column.  
- Reworking order DTO `orderPathPreference` on `POST /orders` (e2e still may pass handle).  
- Your paths / TradeLane behaviour.

## Tests

- Publish DTO / restore state no longer requires path field for behaviour.  
- Curated pack viewer Order CTA does not depend on collection.orderPathPreference.  
- Unit where path helpers ignore collection stamp.
