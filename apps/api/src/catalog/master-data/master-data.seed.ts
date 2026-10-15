import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MasterOptionKind,
  sheetUnitToUnit,
  type MasterOptionKind as OptionKind,
} from '@ekum/domain-types';
import type { PrismaClient } from '@prisma/client';

type SheetCategory = {
  slug: string;
  label: string;
  sortOrder: number;
  units: string[];
  itemTypes: string[];
  qualities: string[];
  sizes: string[];
};

type SheetFile = {
  categories: SheetCategory[];
};

function loadSheet(): SheetFile {
  const candidates = [
    join(__dirname, 'sheet-2026-10-14.json'),
    // nest watch may run from dist before assets copy — fall back to src
    join(process.cwd(), 'src', 'catalog', 'master-data', 'sheet-2026-10-14.json'),
    join(process.cwd(), 'apps', 'api', 'src', 'catalog', 'master-data', 'sheet-2026-10-14.json'),
  ];
  for (const path of candidates) {
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as SheetFile;
    } catch {
      /* try next */
    }
  }
  throw new Error(`Master sheet JSON not found. Tried: ${candidates.join(', ')}`);
}

function stableId(prefix: string, ...parts: string[]): string {
  const h = createHash('sha1').update(parts.join('\0')).digest('hex').slice(0, 20);
  return `${prefix}_${h}`;
}

async function ensureOption(
  prisma: PrismaClient,
  kind: OptionKind,
  label: string,
): Promise<string> {
  const trimmed = label.trim();
  const id = stableId('opt', kind, trimmed.toLowerCase());
  const existing = await prisma.masterOption.findFirst({
    where: {
      kind,
      label: { equals: trimmed, mode: 'insensitive' },
    },
  });
  if (existing) {
    if (!existing.active) {
      await prisma.masterOption.update({
        where: { id: existing.id },
        data: { active: true, label: trimmed },
      });
    }
    return existing.id;
  }
  await prisma.masterOption.upsert({
    where: { id },
    create: { id, kind, label: trimmed, active: true },
    update: { label: trimmed, active: true },
  });
  return id;
}

/**
 * Idempotent upsert of Master Categories / options / units from the sheet JSON.
 * Safe to run on every API boot.
 */
export async function seedMasterDataFromSheet(prisma: PrismaClient): Promise<number> {
  const sheet = loadSheet();
  let optionLinks = 0;

  for (const cat of sheet.categories) {
    const categoryId = stableId('cat', cat.slug);
    await prisma.masterCategory.upsert({
      where: { slug: cat.slug },
      create: {
        id: categoryId,
        slug: cat.slug,
        label: cat.label,
        active: true,
        sortOrder: cat.sortOrder,
      },
      update: {
        label: cat.label,
        active: true,
        sortOrder: cat.sortOrder,
      },
    });

    const row = await prisma.masterCategory.findUniqueOrThrow({
      where: { slug: cat.slug },
    });

    const pushKind = async (kind: OptionKind, labels: string[]) => {
      for (const label of labels) {
        if (!label.trim()) continue;
        const optionId = await ensureOption(prisma, kind, label);
        await prisma.masterOptionLink.upsert({
          where: {
            categoryId_optionId: { categoryId: row.id, optionId },
          },
          create: {
            id: stableId('lnk', row.id, optionId),
            categoryId: row.id,
            optionId,
          },
          update: {},
        });
        optionLinks += 1;
      }
    };

    await pushKind(MasterOptionKind.ItemType, cat.itemTypes);
    await pushKind(MasterOptionKind.Quality, cat.qualities);
    await pushKind(MasterOptionKind.Size, cat.sizes);

    for (const rawUnit of cat.units) {
      const unit = sheetUnitToUnit(rawUnit);
      if (!unit) continue;
      await prisma.categoryUnit.upsert({
        where: {
          categoryId_unit: { categoryId: row.id, unit },
        },
        create: {
          id: stableId('unt', row.id, unit),
          categoryId: row.id,
          unit,
        },
        update: {},
      });
    }
  }

  return optionLinks;
}
