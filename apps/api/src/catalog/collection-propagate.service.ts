import { Injectable, Logger } from '@nestjs/common';
import {
  CollectionStatus,
  JobType,
  MembershipRole,
  ProductStatus,
  PublishAudience,
  RateVisibility,
  RepostOrigin,
  TradeLaneTicket,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { JobQueue } from '../jobs/job-queue.service';
import { FollowStatus } from '../discovery/follow-access';
import { canDiscoverCollection } from './audience-visibility';
import { CollectionService } from './collection.service';
import { pickRootSurvivor, resolveRepostRootId } from './collection-lineage';
import {
  canUnionAutomaticSelected,
  mergeSelectedBuyers,
} from './direct-link-repost-audience';
import { isGeneralKind } from './general-collection';
import { prismaModelHasField } from '../common/prisma-model-fields';

type SourceRow = {
  id: string;
  companyId: string;
  name: string;
  kind?: string | null;
  coverImage: string | null;
  status: string;
  audience: string;
  audienceCompanyIds: string[];
  allowForward: boolean;
  allowDownload: boolean;
  rateVisibility: string;
  categories: string[];
  exploreActivityAt: Date | null;
  updatedAt: Date;
  createdAt?: Date;
  repostSourceCollectionId: string | null;
};

function asIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === 'string');
}

function sourceToken(row: { exploreActivityAt: Date | null; updatedAt: Date }): Date {
  return row.exploreActivityAt ?? row.updatedAt;
}

function conflictCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const row = err as { code?: string; getResponse?: () => unknown };
  if (typeof row.getResponse === 'function') {
    const body = row.getResponse();
    if (body && typeof body === 'object' && (body as { code?: string }).code) {
      return (body as { code?: string }).code;
    }
  }
  return row.code;
}

function isUniqueConflict(err: unknown): boolean {
  const code = conflictCode(err);
  return code === 'P2002' || code === 'ALREADY_REPOSTED';
}

// #region agent log
function agentLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
): void {
  fetch('http://127.0.0.1:7359/ingest/c3df85ff-1820-4af4-9a7f-aa6252617829', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '097f3c' },
    body: JSON.stringify({
      sessionId: '097f3c',
      runId: 'pre-fix',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion


@Injectable()
export class CollectionPropagateService {
  private readonly logger = new Logger(CollectionPropagateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly collections: CollectionService,
    private readonly jobs: JobQueue,
  ) {}

  async propagate(collectionId: string): Promise<void> {
    const source = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });
    if (!source) {
      this.logger.warn(`collection.propagate skipped missing ${collectionId}`);
      return;
    }
    if (isGeneralKind(source.kind)) {
      // #region agent log
      agentLog('H5', 'collection-propagate.service.ts:propagate', 'skip general kind', {
        collectionId,
        kind: source.kind,
      });
      // #endregion
      return;
    }
    if (source.status !== CollectionStatus.Published) {
      await this.hideImmediateChildren(source.id);
      return;
    }
    const traders = await this.prisma.tradeLane.findMany({
      where: { sellerCompanyId: source.companyId, ticket: TradeLaneTicket.Mill },
      select: { traderCompanyId: true },
      distinct: ['traderCompanyId'],
    });
    // #region agent log
    agentLog('H1', 'collection-propagate.service.ts:propagate', 'propagate start', {
      collectionId,
      millCompanyId: source.companyId,
      allowForward: source.allowForward,
      audience: source.audience,
      createdAt: source.createdAt?.toISOString?.() ?? null,
      traderIds: traders.map((row) => row.traderCompanyId),
    });
    // #endregion
    for (const row of traders) {
      try {
        await this.deliverToTrader(source, row.traderCompanyId);
      } catch (err) {
        // #region agent log
        agentLog('H1', 'collection-propagate.service.ts:propagate', 'deliver threw', {
          collectionId,
          traderCompanyId: row.traderCompanyId,
          code: conflictCode(err) ?? 'failed',
        });
        // #endregion
        this.logger.warn(
          `auto-repost skipped ${source.id} for ${row.traderCompanyId}: ${conflictCode(err) ?? 'failed'}`,
        );
      }
    }
  }

  private async hideImmediateChildren(sourceId: string): Promise<void> {
    const children = await this.prisma.collection.findMany({
      where: {
        repostSourceCollectionId: sourceId,
        status: CollectionStatus.Published,
      },
      select: { id: true },
    });
    if (children.length === 0) return;
    await this.prisma.collection.updateMany({
      where: { id: { in: children.map((row) => row.id) } },
      data: { status: CollectionStatus.Draft, exploreActivityAt: null },
    });
    for (const child of children) {
      await this.jobs.enqueue(JobType.CollectionPropagate, { collectionId: child.id });
    }
  }

  private async deliverToTrader(source: SourceRow, traderCompanyId: string): Promise<void> {
    // #region agent log
    const skip = (reason: string, extra: Record<string, unknown> = {}) => {
      agentLog('H1', 'collection-propagate.service.ts:deliverToTrader', 'skip', {
        reason,
        sourceId: source.id,
        traderCompanyId,
        ...extra,
      });
    };
    // #endregion
    if (traderCompanyId === source.companyId) {
      skip('self');
      return;
    }
    if (await this.companyOnSourceChain(source, traderCompanyId)) {
      skip('onSourceChain');
      return;
    }
    if (!source.allowForward) {
      skip('allowForwardOff');
      return;
    }
    const following = await this.prisma.follow.findUnique({
      where: {
        followerCompanyId_followedCompanyId: {
          followerCompanyId: traderCompanyId,
          followedCompanyId: source.companyId,
        },
      },
      select: { status: true },
    });
    if (following?.status !== FollowStatus.Allowed) {
      skip('followNotAllowed', { followStatus: following?.status ?? null });
      return;
    }
    if (
      !canDiscoverCollection(traderCompanyId, source, {
        connected: false,
        following: true,
      })
    ) {
      skip('notDiscoverable', {
        audience: source.audience,
        audienceCompanyIds: source.audienceCompanyIds,
      });
      return;
    }
    const lanes = await this.prisma.tradeLane.findMany({
      where: {
        traderCompanyId,
        sellerCompanyId: source.companyId,
        ticket: TradeLaneTicket.Mill,
      },
      select: { buyerCompanyId: true, createdAt: true },
    });
    const buyers = [
      ...new Set(
        lanes
          .map((row) => row.buyerCompanyId)
          .filter((id) => id && id !== traderCompanyId && id !== source.companyId),
      ),
    ];
    if (buyers.length === 0) {
      skip('noBuyers');
      return;
    }

    const rootId = await resolveRepostRootId(this.prisma, source.id);
    const existing = await this.prisma.collection.findMany({
      where: {
        companyId: traderCompanyId,
        OR: [
          ...(prismaModelHasField('Collection', 'repostRootCollectionId')
            ? [{ repostRootCollectionId: rootId }]
            : []),
          { repostSourceCollectionId: source.id },
          { repostSourceCollectionId: rootId },
        ],
        status: { not: CollectionStatus.Archived },
      },
      orderBy: { createdAt: 'asc' },
    });
    const survivor = pickRootSurvivor(existing);
    const ownerUserId = await this.ownerUserId(traderCompanyId);
    if (!ownerUserId) {
      this.logger.warn(`No owner for ${traderCompanyId}; skip propagate ${source.id}`);
      return;
    }

    if (survivor) {
      // #region agent log
      agentLog('H3', 'collection-propagate.service.ts:deliverToTrader', 'survivor reuse', {
        sourceId: source.id,
        traderCompanyId,
        survivorId: survivor.id,
        survivorStatus: survivor.status,
        survivorAudience: survivor.audience,
        survivorOrigin: survivor.repostOrigin,
        buyers,
      });
      // #endregion
      const changed = await this.syncMembership(source, survivor.id, traderCompanyId, ownerUserId);
      await this.syncSelectedBuyers(survivor.id, buyers);
      if (changed) {
        await this.jobs.enqueue(JobType.CollectionPropagate, { collectionId: survivor.id });
      }
      return;
    }

    const linkStartedAt = lanes.reduce<Date | null>((earliest, row) => {
      if (!row.createdAt) return earliest;
      if (!earliest || row.createdAt < earliest) return row.createdAt;
      return earliest;
    }, null);
    if (linkStartedAt && source.createdAt && source.createdAt <= linkStartedAt) {
      // #region agent log
      agentLog('H2', 'collection-propagate.service.ts:deliverToTrader', 'future-only skip', {
        sourceId: source.id,
        traderCompanyId,
        sourceCreatedAt: source.createdAt.toISOString(),
        linkStartedAt: linkStartedAt.toISOString(),
        buyers,
      });
      // #endregion
      return;
    }

    try {
      const created = await this.collections.create(traderCompanyId, ownerUserId, {
        name: await this.uniquePackName(traderCompanyId, source.name, source.id),
        categories: source.categories ?? [],
        coverImage: source.coverImage ?? undefined,
        repostSourceCollectionId: source.id,
      });
      const sourceIds = await this.publishedMemberIds(source.id);
      if (sourceIds.length > 0) {
        await this.collections.setProducts(traderCompanyId, ownerUserId, created.id, sourceIds);
      }
      await this.stampLineage(created.id, {
        rootId,
        origin: RepostOrigin.Automatic,
        token: sourceToken(source),
        productIds: sourceIds,
      });
      await this.collections.publish(traderCompanyId, ownerUserId, created.id, {
        audience: PublishAudience.Selected,
        companyIds: buyers,
        showSourceShops: true,
        allowForward: source.allowForward,
        allowDownload: source.allowDownload,
        rateVisibility:
          source.rateVisibility === RateVisibility.Visible
            ? RateVisibility.Visible
            : RateVisibility.OnRequest,
      });
      // #region agent log
      agentLog('H3', 'collection-propagate.service.ts:deliverToTrader', 'created hop', {
        sourceId: source.id,
        traderCompanyId,
        hopId: created.id,
        buyers,
      });
      // #endregion
    } catch (err) {
      if (!isUniqueConflict(err)) {
        throw err;
      }
      const retry = await this.prisma.collection.findMany({
        where: {
          companyId: traderCompanyId,
          OR: [
            ...(prismaModelHasField('Collection', 'repostRootCollectionId')
              ? [{ repostRootCollectionId: rootId }]
              : []),
            { repostSourceCollectionId: source.id },
            { repostSourceCollectionId: rootId },
          ],
          status: { not: CollectionStatus.Archived },
        },
        orderBy: { createdAt: 'asc' },
      });
      const existing = pickRootSurvivor(retry);
      if (!existing) throw err;
      await this.syncMembership(source, existing.id, traderCompanyId, ownerUserId);
      await this.syncSelectedBuyers(existing.id, buyers);
    }
  }

  private async syncSelectedBuyers(destId: string, buyers: string[]): Promise<void> {
    if (buyers.length === 0) return;
    const dest = await this.prisma.collection.findUnique({ where: { id: destId } });
    if (!dest || !canUnionAutomaticSelected(dest)) {
      // #region agent log
      agentLog('H3', 'collection-propagate.service.ts:syncSelectedBuyers', 'union skipped', {
        destId,
        buyers,
        destStatus: dest?.status ?? null,
        destAudience: dest?.audience ?? null,
        destOrigin: dest?.repostOrigin ?? null,
      });
      // #endregion
      return;
    }
    const next = mergeSelectedBuyers(dest.audienceCompanyIds, buyers);
    if (
      next.length === dest.audienceCompanyIds.length &&
      next.every((id) => dest.audienceCompanyIds.includes(id))
    ) {
      return;
    }
    await this.prisma.collection.update({
      where: { id: destId },
      data: { audienceCompanyIds: next },
    });
  }

  private async syncMembership(
    source: SourceRow,
    destId: string,
    traderCompanyId: string,
    userId: string,
  ): Promise<boolean> {
    const dest = await this.prisma.collection.findUnique({ where: { id: destId } });
    if (!dest) return false;
    const incoming = sourceToken(source);
    const watermark = dest.repostSyncedSourceAt;
    const sourceIds = await this.publishedMemberIds(source.id);
    const destRows = await this.prisma.collectionProduct.findMany({
      where: { collectionId: destId },
      select: { productId: true },
    });
    const destIds = destRows.map((row) => row.productId);
    const previouslySynced = asIdList(dest.repostSyncedProductIds);
    const sourceSet = new Set(sourceIds);
    const prevSet = new Set(previouslySynced);
    const extras = destIds.filter((id) => !sourceSet.has(id) && !prevSet.has(id));
    const nextIds = [...new Set([...sourceIds, ...extras])];
    const membershipChanged =
      nextIds.length !== destIds.length || nextIds.some((id) => !destIds.includes(id));

    if (watermark && incoming.getTime() < watermark.getTime()) {
      return false;
    }
    if (watermark && incoming.getTime() === watermark.getTime() && !membershipChanged) {
      return false;
    }
    if (!membershipChanged && watermark && incoming.getTime() <= watermark.getTime()) {
      return false;
    }

    if (membershipChanged) {
      await this.collections.setProducts(traderCompanyId, userId, destId, nextIds);
    }
    const bump = membershipChanged && dest.status === CollectionStatus.Published;
    await this.prisma.collection.update({
      where: { id: destId },
      data: {
        ...(prismaModelHasField('Collection', 'repostRootCollectionId')
          ? {
              repostRootCollectionId: await resolveRepostRootId(this.prisma, source.id),
              repostSyncedSourceAt: incoming,
              repostSyncedProductIds: sourceIds,
            }
          : {}),
        ...(bump ? { exploreActivityAt: incoming } : {}),
      },
    });
    return bump;
  }

  private async stampLineage(
    collectionId: string,
    input: { rootId: string; origin: string; token: Date; productIds: string[] },
  ): Promise<void> {
    if (!prismaModelHasField('Collection', 'repostRootCollectionId')) return;
    await this.prisma.collection.update({
      where: { id: collectionId },
      data: {
        repostRootCollectionId: input.rootId,
        repostOrigin: input.origin,
        repostSyncedSourceAt: input.token,
        repostSyncedProductIds: input.productIds,
      },
    });
  }

  private async publishedMemberIds(collectionId: string): Promise<string[]> {
    const rows = await this.prisma.collectionProduct.findMany({
      where: {
        collectionId,
        product: { status: ProductStatus.Published },
      },
      select: { productId: true },
      orderBy: { position: 'asc' },
    });
    return rows.map((row) => row.productId);
  }

  private async companyOnSourceChain(source: SourceRow, companyId: string): Promise<boolean> {
    let current: string | null = source.id;
    const seen = new Set<string>();
    while (current && !seen.has(current)) {
      seen.add(current);
      const row: { companyId: string; repostSourceCollectionId: string | null } | null =
        await this.prisma.collection.findUnique({
          where: { id: current },
          select: { companyId: true, repostSourceCollectionId: true },
        });
      if (!row) break;
      if (row.companyId === companyId) return true;
      current = row.repostSourceCollectionId;
    }
    return false;
  }

  private async uniquePackName(
    companyId: string,
    base: string,
    sourceId: string,
  ): Promise<string> {
    const trimmed = base.trim() || 'Collection';
    const clash = await this.prisma.collection.findFirst({
      where: {
        companyId,
        name: { equals: trimmed, mode: 'insensitive' },
        status: { not: CollectionStatus.Archived },
      },
      select: { id: true },
    });
    if (!clash) return trimmed;
    return `${trimmed} · ${sourceId.slice(-6)}`;
  }

  private async ownerUserId(companyId: string): Promise<string | null> {
    const row = await this.prisma.companyMembership.findFirst({
      where: { companyId, archivedAt: null, role: MembershipRole.Owner },
      select: { userId: true },
    });
    return row?.userId ?? null;
  }
}
