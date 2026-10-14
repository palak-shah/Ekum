-- Trust fix: Publish UI shows My followers for legacy everyone/connections,
-- but discovery still treated those rows as open/connected until Visibility save.
-- Align stored audience + column defaults with Followers (Selected unchanged).

UPDATE "Product"
SET "audience" = 'followers'
WHERE "audience" IN ('everyone', 'connections');

UPDATE "Collection"
SET "audience" = 'followers'
WHERE "audience" IN ('everyone', 'connections');

ALTER TABLE "Product" ALTER COLUMN "audience" SET DEFAULT 'followers';
ALTER TABLE "Collection" ALTER COLUMN "audience" SET DEFAULT 'followers';
