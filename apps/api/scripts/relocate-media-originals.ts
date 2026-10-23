/**
 * Copy legacy `{companyId}/{file}` image blobs into `{companyId}/original/{file}`
 * then UPDATE stored URL strings. Does not delete legacy files. Not a Prisma migration.
 *
 * Before --apply on a real database:
 *   pg_dump "$DATABASE_URL" --format=custom -f ekum-media-relocate.dump
 *   pg_restore --list ekum-media-relocate.dump
 * Restore: pg_restore -d "$DATABASE_URL" ekum-media-relocate.dump
 *
 * Run dry-run first, on staging DB + storage, then production.
 *
 *   pnpm --filter @ekum/api exec tsx scripts/relocate-media-originals.ts
 *   pnpm --filter @ekum/api exec tsx scripts/relocate-media-originals.ts --apply
 */
import { PrismaClient } from '@prisma/client';
import { resolveLocalMediaRoot } from '../src/media/local-media-root';
import { AzureBlobDriver } from '../src/media/storage/azure-blob.driver';
import { LocalStorageDriver } from '../src/media/storage/local-storage.driver';
import { resolvePublicMediaBaseUrl } from '../src/media/storage/public-media-base';
import type { StorageDriver } from '../src/media/storage/storage.types';
import { relocateOriginals } from '../src/media/relocate-originals';

function storageFromEnv(): StorageDriver {
  const account = process.env.AZURE_STORAGE_ACCOUNT?.trim();
  const accountKey = process.env.AZURE_STORAGE_KEY?.trim();
  const container = process.env.AZURE_STORAGE_CONTAINER?.trim() || 'media';
  if (account && accountKey) {
    return new AzureBlobDriver({ account, accountKey, container });
  }
  const originHint = process.env.CORS_ORIGINS;
  const rawBase = process.env.PUBLIC_MEDIA_BASE_URL ?? 'http://127.0.0.1:3000/media';
  const baseUrl = resolvePublicMediaBaseUrl(rawBase, { originHint });
  return new LocalStorageDriver(baseUrl, resolveLocalMediaRoot());
}

function localMediaRoot(): string | undefined {
  const account = process.env.AZURE_STORAGE_ACCOUNT?.trim();
  const accountKey = process.env.AZURE_STORAGE_KEY?.trim();
  if (account && accountKey) return undefined;
  return resolveLocalMediaRoot();
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  if (!apply) {
    console.error(
      'Dry-run (no writes). Backup first, then re-run with --apply.\n' +
        '  pg_dump "$DATABASE_URL" --format=custom -f ekum-media-relocate.dump\n' +
        '  pg_restore --list ekum-media-relocate.dump',
    );
  } else {
    console.error('APPLY: copying blobs then updating URL strings. Legacy files are kept.');
  }
  const prisma = new PrismaClient();
  try {
    const report = await relocateOriginals({
      prisma,
      storage: storageFromEnv(),
      apply,
      mediaRoot: localMediaRoot(),
    });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
