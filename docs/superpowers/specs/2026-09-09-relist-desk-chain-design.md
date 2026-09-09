# Relist Ask — desk chain (Slice B+)

**Date:** 2026-09-09  
**Status:** Approved  
**Anchors:** [relist-ask Slice B](./2026-09-08-relist-ask-slice-b-design.md), Completeness `2026-09-09-relist-desk-chain`  
**Supersedes:** Ask always → product owner (that violated I-handle)

## Rules

| Source of the design | Who decides pack permission |
|----------------------|-----------------------------|
| Mill’s own listing / Explore product | Mill (product owner) |
| Your published pack | **You** (pack owner) — under **your** publish allow / Ask |

1. Mill Allows you → you may put in **your** pack. Does **not** free your buyers.  
2. When **you** publish: allow-to-relist on → buyers may put those lines in a pack; off → they Ask **you**.  
3. Further grants follow **your** rules; each hop is a separate Allow.  
4. Mill revoke of your grant → your downstream grants on that design drop.  
5. **Agent role** (buyer found both mill + your pack) — later.

## Copy

Unchanged: **Ask to put in my pack** · **Wants to put … in their pack** · **You can put this in your pack**

## API shape

- `POST /relist-requests` `{ productIds, sourceCollectionId? }`  
- `ProductRelistGrant.grantedByCompanyId` for cascade revoke  
