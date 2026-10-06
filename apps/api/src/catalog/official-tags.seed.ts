import { flattenOfficialTagSeeds, type OfficialTagSeed } from '@ekum/domain-types';
import type { PrismaClient } from '@prisma/client';

export type { OfficialTagSeed };

/** Official catalog tags flattened from the nested drill-down taxonomy. */
export const OFFICIAL_TAG_SEEDS: OfficialTagSeed[] = flattenOfficialTagSeeds();

function seedId(parentKey: string, label: string): string {
  const slug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
  return `seed-tag-${slug(parentKey)}-${slug(label)}`;
}

/** Upsert all official taxonomy tags. Safe to call repeatedly. */
export async function seedOfficialCatalogTags(prisma: PrismaClient): Promise<number> {
  let n = 0;
  for (const row of OFFICIAL_TAG_SEEDS) {
    const id = seedId(row.parentKey, row.label);
    await prisma.catalogTag.upsert({
      where: { id },
      create: {
        id,
        scope: 'official',
        companyId: null,
        label: row.label,
        parentKey: row.parentKey,
        status: 'verified',
      },
      update: {
        label: row.label,
        parentKey: row.parentKey,
        scope: 'official',
        status: 'verified',
        companyId: null,
      },
    });
    n += 1;
  }
  return n;
}
