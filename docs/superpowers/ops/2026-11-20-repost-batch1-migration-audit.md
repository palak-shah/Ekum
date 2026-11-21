# Batch 1 / 1.1 — Repost membership migration ops notes

**Do not apply blindly to production without a backup.** These queries are read-only audits plus notes for the one-shot migration `20261120120000_repost_membership_mesh`.

## One-shot backfill (M7)

The `UPDATE` / `DELETE` blocks in that migration are **one-shot**. After exclusions exist:

- Re-running “synced if on source” would treat source **tombstones** as live source members.
- Do **not** copy those UPDATEs into a later migration without rewriting predicates (`excluded = false` on source, and never clearing child exclusions).

## M5 — Historical root-merged mesh duplicates (audit only)

Before/after dropping `Collection_companyId_repostRoot_automatic_key`, find traders with more than one **automatic** pack sharing a root (legacy unique prevented most of these; manuals were never under that unique):

```sql
SELECT
  c."companyId",
  c."repostRootCollectionId" AS root_id,
  COUNT(*) AS automatic_packs,
  ARRAY_AGG(c.id ORDER BY c."createdAt") AS collection_ids,
  ARRAY_AGG(c."repostSourceCollectionId" ORDER BY c."createdAt") AS immediate_sources
FROM "Collection" c
WHERE c."repostOrigin" = 'automatic'
  AND c."repostRootCollectionId" IS NOT NULL
  AND c.status <> 'archived'
GROUP BY c."companyId", c."repostRootCollectionId"
HAVING COUNT(*) > 1;
```

**Remediation:** Do **not** auto-delete. If two rows share a root but have **different** `repostSourceCollectionId`, they are the desired mesh (keep both). If two rows share the **same** immediate source, keep the oldest published survivor (see `pickImmediateSourceSurvivor`) and archive extras only after product sign-off.

Immediate-source uniqueness (still in DB):

```sql
-- Should return zero rows if the partial unique is healthy
SELECT "companyId", "repostSourceCollectionId", COUNT(*)
FROM "Collection"
WHERE "repostSourceCollectionId" IS NOT NULL
  AND status <> 'archived'
GROUP BY "companyId", "repostSourceCollectionId"
HAVING COUNT(*) > 1;
```

## M6 — Watermark vs local

`repostSyncedProductIds` (JSON array) is reliable evidence a product was last stamped as source-synced. The migration **deletes** child rows that:

1. Are `membershipOrigin = local` after backfill,
2. Appear in that watermark, and
3. Are **not** on the immediate source pack.

**Ambiguity remaining:** Local extras that were **never** watermarked stay `local` (correct). Watermark missing/`null` on old manuals → orphans that left the source before stamps existed stay `local` and will survive future sync as extras. Manual remediation: compare child vs source membership and drop with trader consent.

```sql
-- Suspect sticky orphans (watermarked, not on source, still local after migrate)
SELECT c.id AS collection_id, cp."productId", c."repostSourceCollectionId"
FROM "CollectionProduct" cp
JOIN "Collection" c ON c.id = cp."collectionId"
WHERE c."repostSourceCollectionId" IS NOT NULL
  AND cp."membershipOrigin" = 'local'
  AND c."repostSyncedProductIds" IS NOT NULL
  AND jsonb_typeof(c."repostSyncedProductIds"::jsonb) = 'array'
  AND c."repostSyncedProductIds"::jsonb ? cp."productId"
  AND NOT EXISTS (
    SELECT 1 FROM "CollectionProduct" sp
    WHERE sp."collectionId" = c."repostSourceCollectionId"
      AND sp."productId" = cp."productId"
  );
```
