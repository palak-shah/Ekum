import {
  CollectionStatus,
  PublishAudience,
  RepostOrigin,
} from '@ekum/domain-types';
import type { Prisma } from '@prisma/client';
import { prismaModelHasField } from '../common/prisma-model-fields';
import { isAutomaticOrigin } from './collection-lineage';
import { effectivePublishAudience } from './audience-visibility';

type AudienceClient = {
  collection: {
    findMany: Prisma.TransactionClient['collection']['findMany'];
    update: Prisma.TransactionClient['collection']['update'];
  };
};

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function sameIdSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const other = new Set(right);
  return left.every((id) => other.has(id));
}

async function millSourceIds(
  prisma: AudienceClient,
  millCompanyId: string,
): Promise<string[]> {
  const rows = await prisma.collection.findMany({
    where: { companyId: millCompanyId },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

async function automaticSelectedPacks(
  prisma: AudienceClient,
  traderCompanyId: string,
  millCompanyId: string,
): Promise<Array<{ id: string; audienceCompanyIds: string[] }>> {
  if (!prismaModelHasField('Collection', 'repostOrigin')) return [];
  const sourceIds = await millSourceIds(prisma, millCompanyId);
  if (sourceIds.length === 0) return [];
  const rows = await prisma.collection.findMany({
    where: {
      companyId: traderCompanyId,
      repostOrigin: RepostOrigin.Automatic,
      audience: PublishAudience.Selected,
      status: CollectionStatus.Published,
      OR: [
        { repostSourceCollectionId: { in: sourceIds } },
        { repostRootCollectionId: { in: sourceIds } },
      ],
    },
    select: { id: true, audienceCompanyIds: true },
  });
  return rows;
}

export async function unionDirectLinkBuyer(
  prisma: AudienceClient,
  input: { traderCompanyId: string; millCompanyId: string; buyerCompanyId: string },
): Promise<void> {
  const packs = await automaticSelectedPacks(
    prisma,
    input.traderCompanyId,
    input.millCompanyId,
  );
  for (const pack of packs) {
    const next = uniqueIds([...pack.audienceCompanyIds, input.buyerCompanyId]);
    if (sameIdSet(pack.audienceCompanyIds, next)) continue;
    await prisma.collection.update({
      where: { id: pack.id },
      data: { audienceCompanyIds: next },
    });
  }
}

export async function removeDirectLinkBuyer(
  prisma: AudienceClient,
  input: { traderCompanyId: string; millCompanyId: string; buyerCompanyId: string },
): Promise<void> {
  const packs = await automaticSelectedPacks(
    prisma,
    input.traderCompanyId,
    input.millCompanyId,
  );
  for (const pack of packs) {
    const next = pack.audienceCompanyIds.filter((id) => id !== input.buyerCompanyId);
    if (sameIdSet(pack.audienceCompanyIds, next)) continue;
    if (next.length === 0) {
      await prisma.collection.update({
        where: { id: pack.id },
        data: { status: CollectionStatus.Draft, exploreActivityAt: null },
      });
      continue;
    }
    await prisma.collection.update({
      where: { id: pack.id },
      data: { audienceCompanyIds: next },
    });
  }
}

export async function removeDirectLinkBuyersForLanes(
  prisma: AudienceClient,
  lanes: Array<{
    traderCompanyId: string;
    sellerCompanyId: string;
    buyerCompanyId: string;
  }>,
): Promise<void> {
  for (const lane of lanes) {
    await removeDirectLinkBuyer(prisma, {
      traderCompanyId: lane.traderCompanyId,
      millCompanyId: lane.sellerCompanyId,
      buyerCompanyId: lane.buyerCompanyId,
    });
  }
}

export function mergeSelectedBuyers(
  existing: string[] | null | undefined,
  incoming: string[],
): string[] {
  return uniqueIds([...(existing ?? []), ...incoming]);
}

export function canUnionAutomaticSelected(dest: {
  audience?: string | null;
  repostOrigin?: string | null;
}): boolean {
  return (
    isAutomaticOrigin(dest.repostOrigin) &&
    effectivePublishAudience(dest.audience ?? '') === PublishAudience.Selected
  );
}
