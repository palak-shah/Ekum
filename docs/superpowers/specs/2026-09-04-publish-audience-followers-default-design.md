# Publish audience: no Connections option (default Followers)

**Date:** 2026-09-04  
**Status:** Approved for implementation (product chat)  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`

## Problem

Publish **Who can see this?** offered **My connections**. Connections mix buyers and suppliers. Sellers want designs/collections aimed at followers (or Selected / Everyone), not the whole connection graph.

## Decision

**Approach A**

1. Publish / Visibility sheets for designs and collections (including bulk) show only: **Everyone · My followers · Selected**.
2. New / empty sheet default: **My followers** (replaces Connections).
3. API keeps `connections` for existing rows; status badges may still say **My connections** for those posts.
4. Opening Visibility on a Connections-audience item: do not offer Connections again; map the sheet’s selectable Who to an allowed option (default mapping when resetting Who: **My followers**). Persisted audience stays until they save a new choice.
5. **Selected** still picks companies/groups from the connections list — that is a picker pool, not the Connections audience mode.
6. No migration of live posts from `connections` → `followers`.

## Out of scope

- Removing `PublishAudience.Connections` from the API / domain enum  
- Auto-converting existing published items  
- Changing Explore ranking or follow/connection semantics  

## Docs to update when shipping

- `00-concepts.md` — default audience Followers; Publish UI does not offer Connections  
- `catalog.md` / `collections.md` — Who options + seed copy  

## Tests

- Unit: empty/restore defaults → Followers; Who option list excludes Connections  
- Existing Connections badge copy for legacy rows still works  
