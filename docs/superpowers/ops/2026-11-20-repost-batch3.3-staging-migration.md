# Batch 3.3 — Staging migration & smoke (ops report)

**Date:** 2026-11-20  
**Scope:** Staging only. No production migrate. No schema/code changes. No data cleanup. No Batch 4.  
**Disposition: STOPPED before backup/apply** — staging `DATABASE_URL` is not available in this workspace.

---

## 1. Migration order & dependencies (audit)

| Order | Migration | Depends on | Risk |
|------:|-----------|------------|------|
| 1 | `20261120120000_repost_membership_mesh` | Existing `Collection` / `CollectionProduct` / lineage cols from earlier repost migrations; `repostSyncedProductIds` for M6 delete | **One-shot data backfill** + `DROP INDEX` root automatic unique |
| 2 | `20261120140000_collection_view_grant_expiry` | `CollectionViewGrant` + `grantedAt` | Adds `expiresAt`, backfills `grantedAt + 48h`, then `NOT NULL` |
| 3 | `20261120160000_repost_pricing` | `Collection` / `CollectionProduct` | Nullable calc columns only — no value backfill |

**Order is correct** (timestamp + logical): mesh provenance before grant clock; pricing is additive and independent of mesh/expiry.

**Prisma schema alignment:** `schema.prisma` already declares `membershipOrigin` / `excluded` / `explicitlyAddedAt`, `CollectionViewGrant.expiresAt`, and Collection + CollectionProduct pricing columns. Deploying these three migrations brings DB in line with that schema.

**Sibling pending on local inspect only (not staging):** `20261119120000_thread_participant_last_delivered` sits before the trio. Staging `migrate deploy` will apply any pending earlier migrations first — confirm that is expected on staging before deploy.

### Mesh backfill — safe exactly once

`20261120120000` comments and [`2026-11-20-repost-batch1-migration-audit.md`](./2026-11-20-repost-batch1-migration-audit.md) lock this:

- UPDATEs stamp `synced` / `local` from **source membership at migrate time** (no `excluded = false` filter on source).
- After exclusions exist, re-running those UPDATEs can treat source **tombstones** as live and mis-stamp children; M6 `DELETE` predicates also assume first-pass `local` + watermark.
- Prisma `_prisma_migrations` prevents automatic re-apply after success. **Never** paste the UPDATE/DELETE blocks into a later migration or resolve a failed migrate by re-executing the SQL file blindly.
- `ADD COLUMN IF NOT EXISTS` / index creates are idempotent; the **data** statements are not.

### Other two — re-run posture

| Migration | Re-run of SQL file |
|-----------|--------------------|
| `…140000…expiry` | Mostly safe: `expiresAt IS NULL` backfill no-ops after first pass; `SET NOT NULL` stays. Still prefer one Prisma apply. |
| `…160000…pricing` | Safe: nullable `ADD COLUMN IF NOT EXISTS` only. |

---

## 2. Staging backup

**Not taken.** Workspace env points at local Postgres only (`127.0.0.1`, database `ekum` on port seen via Prisma as `5433`). No `.env.staging`, no `STAGING_DATABASE_URL`, no remote host in checked env files.

**Required before any staging apply:**

```bash
pg_dump "$STAGING_DATABASE_URL" --format=custom -f "ekum-staging-pre-repost-batch3-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_restore --list "ekum-staging-pre-repost-batch3-….dump" | head
```

Verify dump size > 0 and list shows `Collection` / `CollectionProduct` / `CollectionViewGrant` / `Order` / `_prisma_migrations`.

---

## 3. Apply pending migrations (staging)

**Not applied.** Applying against the only available URL would mutate **local** DB, which violates “staging only.”

When staging URL is confirmed **and** backup verified:

```bash
# Confirm host is staging (not prod, not 127.0.0.1)
# Then:
pnpm --filter @ekum/api exec prisma migrate deploy
pnpm --filter @ekum/api exec prisma migrate status
pnpm --filter @ekum/api exec prisma validate
```

Expect the three `20261120*` migrations (and any earlier pending) recorded in `_prisma_migrations` with no failed rows.

---

## 4. Integrity checks (SQL — run on staging after migrate)

**Not run** (no staging connection).

Use after successful deploy:

```sql
-- Membership: source-linked rows should be stamped; exclusions default false
SELECT "membershipOrigin", "excluded", COUNT(*)
FROM "CollectionProduct"
GROUP BY 1, 2;

-- Immediate-source uniqueness (must be 0 rows)
SELECT "companyId", "repostSourceCollectionId", COUNT(*)
FROM "Collection"
WHERE "repostSourceCollectionId" IS NOT NULL AND status <> 'archived'
GROUP BY 1, 2 HAVING COUNT(*) > 1;

-- Root automatic mesh duplicates (audit only — see Batch 1 ops)
SELECT c."companyId", c."repostRootCollectionId", COUNT(*)
FROM "Collection" c
WHERE c."repostOrigin" = 'automatic'
  AND c."repostRootCollectionId" IS NOT NULL
  AND c.status <> 'archived'
GROUP BY 1, 2 HAVING COUNT(*) > 1;

-- View grants: expiresAt NOT NULL; none null
SELECT COUNT(*) FILTER (WHERE "expiresAt" IS NULL) AS null_expires,
       COUNT(*) FILTER (WHERE "expiresAt" <= NOW()) AS already_elapsed,
       COUNT(*) AS total
FROM "CollectionViewGrant";

-- Pricing columns exist and stay null on historical packs
SELECT COUNT(*) FILTER (WHERE "repostPricingMode" IS NOT NULL) AS priced_packs,
       COUNT(*) AS packs
FROM "Collection";

SELECT COUNT(*) FILTER (WHERE "pricingMode" IS NOT NULL) AS priced_members,
       COUNT(*) AS members
FROM "CollectionProduct";

-- Orders / historical rates untouched by these migrations (spot)
SELECT COUNT(*) FROM "Order";
SELECT COUNT(*) FROM "OrderItem";
```

Also re-run Batch 1 watermark orphan audit from the Batch 1 ops doc if staging has legacy manuals.

---

## 5. Smoke journeys (staging accounts)

**Not run.** Needs Mill → Trader A → Trader B → Buyer on staging after migrate + app deploy that includes Batch 1–3 code.

Checklist (when unblocked):

1. Pack / Look permissions + forward  
2. Supplier identity hiding on multi-hop  
3. Same / margin / Edit + `on_request`  
4. Place order: buyer-facing parent rate vs mill supplier-hop rate  
5. Upstream restriction + restoration  

---

## 6. Local observe-only (not staging)

`prisma migrate status` against workspace `.env` reported pending:

- `20261119120000_thread_participant_last_delivered`
- `20261120120000_repost_membership_mesh`
- `20261120140000_collection_view_grant_expiry`
- `20261120160000_repost_pricing`

**No local `migrate deploy` was run** for this batch.

---

## 7. Unresolved risks / blockers

1. **Staging credentials / host missing** — hard stop.  
2. **Production guard** — operator must name host explicitly before deploy; do not reuse local `.env`.  
3. **Mesh one-shot** — if staging already partially applied `…120000…` and failed mid-file, do not re-run UPDATEs; restore from backup and investigate.  
4. **Grant backfill** — existing grants get `grantedAt + 48h`; already-old grants become inert immediately (product-intended).  
5. **Pricing** — null modes mean “no calc”; app must treat Ask via `rateVisibility = on_request` only.  
6. **Earlier pending migration** (`…19120000…`) may apply on the same staging deploy — confirm intentional.

---

## Verdict

| Step | Result |
|------|--------|
| Audit order + mesh one-shot | **PASS** (docs + SQL review) |
| Staging backup | **BLOCKED** — no staging DB URL |
| Apply on staging | **NOT RUN** (stopped) |
| Integrity SQL | **NOT RUN** |
| Smoke | **NOT RUN** |
| Production | **Untouched** |

**Next operator action:** provide staging `DATABASE_URL` (or SSH/Compose access to the live-server Postgres), take verified `pg_dump`, then resume from §2–§5 only.
