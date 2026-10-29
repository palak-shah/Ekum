import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  TradeLaneTicket,
  type AffectedTradeLanesView,
  type CreateTradeLaneDto,
  type ListTradeLanesQuery,
  type TradeLaneView,
  type UpdateTradeLaneDto,
} from '@ekum/domain-types';
import { Prisma } from '@prisma/client';
import { withPrismaField } from '../common/prisma-model-fields';
import { PrismaService } from '../core/prisma/prisma.service';
import { resolveTradePresence } from '../identity/trade-presence';
import { ThreadService } from '../conversation/thread.service';
import { FollowStatus } from '../discovery/follow-access';
import {
  removeDirectLinkBuyer,
  unionDirectLinkBuyer,
} from '../catalog/direct-link-repost-audience';
import { DEFAULT_LANE_BEHAVIORS, effectivePathFromLane, laneBehaviorsFromJson } from './trade-lane';
import { findAffectedDirectLinks, revokeAffectedDirectLinks } from './trade-lane-revoke';

@Injectable()
export class TradeLaneService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly threads: ThreadService,
  ) {}

  private async assertTrading(companyId: string): Promise<void> {
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId },
      select: { tradeDefaults: true },
    });
    if (!resolveTradePresence(settings?.tradeDefaults).trading) {
      throw new ForbiddenException({
        code: 'TRADING_REQUIRED',
        message: 'Turn on Trading in Profile to manage paths.',
      });
    }
  }

  async list(traderCompanyId: string, query: ListTradeLanesQuery): Promise<TradeLaneView[]> {
    await this.assertTrading(traderCompanyId);
    const q = query.q?.trim();
    const rows = await this.prisma.tradeLane.findMany({
      where: {
        traderCompanyId,
        ticket: TradeLaneTicket.Mill,
        ...(q
          ? {
              OR: [
                { seller: { name: { contains: q, mode: 'insensitive' } } },
                { buyer: { name: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        seller: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    return rows.map((row) => this.toView(row));
  }

  async create(traderCompanyId: string, dto: CreateTradeLaneDto): Promise<TradeLaneView> {
    await this.assertTrading(traderCompanyId);
    if (
      dto.sellerCompanyId === traderCompanyId ||
      dto.buyerCompanyId === traderCompanyId
    ) {
      throw new BadRequestException({
        code: 'INVALID',
        message: 'Pick a supplier and a buyer that are not your shop.',
      });
    }
    await this.assertFollows(traderCompanyId, dto.sellerCompanyId, 'mill');
    await this.assertFollows(dto.buyerCompanyId, traderCompanyId, 'buyer');

    const behaviors: Prisma.InputJsonValue = {
      directOrder: DEFAULT_LANE_BEHAVIORS.directOrder,
      autoRepost: DEFAULT_LANE_BEHAVIORS.autoRepost,
    };
    const behaviorFields = withPrismaField('TradeLane', 'behaviors', {}, behaviors);
    const updated = await this.prisma.tradeLane.upsert({
      where: {
        traderCompanyId_sellerCompanyId_buyerCompanyId: {
          traderCompanyId,
          sellerCompanyId: dto.sellerCompanyId,
          buyerCompanyId: dto.buyerCompanyId,
        },
      },
      create: {
        traderCompanyId,
        sellerCompanyId: dto.sellerCompanyId,
        buyerCompanyId: dto.buyerCompanyId,
        ticket: TradeLaneTicket.Mill,
        reveal: true,
        ...behaviorFields,
      },
      update: {
        ticket: TradeLaneTicket.Mill,
        reveal: true,
        ...behaviorFields,
      },
      include: {
        seller: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true } },
      },
    });
    await unionDirectLinkBuyer(this.prisma, {
      traderCompanyId,
      millCompanyId: dto.sellerCompanyId,
      buyerCompanyId: dto.buyerCompanyId,
    });
    const groupThreadId = await this.threads.ensureTradeLaneGroup(
      traderCompanyId,
      dto.sellerCompanyId,
      dto.buyerCompanyId,
      updated.groupThreadId,
    );
    if (groupThreadId !== updated.groupThreadId) {
      await this.prisma.tradeLane.update({
        where: { id: updated.id },
        data: { groupThreadId },
      });
    }
    return this.toView(updated);
  }

  async update(
    traderCompanyId: string,
    id: string,
    dto: UpdateTradeLaneDto,
  ): Promise<TradeLaneView> {
    await this.assertTrading(traderCompanyId);
    const existing = await this.prisma.tradeLane.findFirst({
      where: { id, traderCompanyId },
      include: {
        seller: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Path not found.' });
    }
    void dto;
    throw new BadRequestException({
      code: 'PATH_LOCKED',
      message: 'Direct links are supplier ticket and a group. Remove the link instead of changing it.',
    });
  }

  async remove(traderCompanyId: string, id: string): Promise<{ ok: true }> {
    await this.assertTrading(traderCompanyId);
    const existing = await this.prisma.tradeLane.findFirst({
      where: { id, traderCompanyId },
      select: {
        id: true,
        groupThreadId: true,
        sellerCompanyId: true,
        buyerCompanyId: true,
      },
    });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Path not found.' });
    }
    await this.prisma.$transaction(async (tx) => {
      if (existing.groupThreadId) {
        await tx.thread.updateMany({
          where: { id: existing.groupThreadId, messagingClosedAt: null },
          data: { messagingClosedAt: new Date() },
        });
      }
      await tx.tradeLane.delete({ where: { id: existing.id } });
      await removeDirectLinkBuyer(tx, {
        traderCompanyId,
        millCompanyId: existing.sellerCompanyId,
        buyerCompanyId: existing.buyerCompanyId,
      });
    });
    return { ok: true };
  }

  async pathForPair(
    traderCompanyId: string,
    sellerCompanyId: string,
    buyerCompanyId: string,
  ): Promise<'handle' | 'direct'> {
    const lane = await this.prisma.tradeLane.findUnique({
      where: {
        traderCompanyId_sellerCompanyId_buyerCompanyId: {
          traderCompanyId,
          sellerCompanyId,
          buyerCompanyId,
        },
      },
      select: { ticket: true },
    });
    return effectivePathFromLane(lane?.ticket);
  }

  async previewAffected(
    actorCompanyId: string,
    counterpartCompanyId: string,
  ): Promise<AffectedTradeLanesView> {
    const rows = await findAffectedDirectLinks(
      this.prisma,
      actorCompanyId,
      counterpartCompanyId,
    );
    return { lanes: rows.map((row) => this.toView(row)) };
  }

  async revokeAffected(actorCompanyId: string, counterpartCompanyId: string): Promise<void> {
    await this.prisma.$transaction((tx) =>
      revokeAffectedDirectLinks(tx, actorCompanyId, counterpartCompanyId),
    );
  }

  private async assertFollows(
    followerCompanyId: string,
    followedCompanyId: string,
    kind: 'mill' | 'buyer',
  ): Promise<void> {
    const row = await this.prisma.follow.findUnique({
      where: {
        followerCompanyId_followedCompanyId: {
          followerCompanyId,
          followedCompanyId,
        },
      },
      select: { status: true },
    });
    if (row?.status !== FollowStatus.Allowed) {
      throw new BadRequestException({
        code: 'NOT_FOLLOWING',
        message:
          kind === 'mill'
            ? 'Follow that supplier first.'
            : 'That buyer needs to follow you first.',
      });
    }
  }

  private toView(row: {
    id: string;
    traderCompanyId: string;
    sellerCompanyId: string;
    buyerCompanyId: string;
    ticket: string;
    reveal: boolean;
    behaviors?: unknown;
    updatedAt: Date;
    seller: { id: string; name: string };
    buyer: { id: string; name: string };
  }): TradeLaneView {
    return {
      id: row.id,
      traderCompanyId: row.traderCompanyId,
      sellerCompanyId: row.sellerCompanyId,
      buyerCompanyId: row.buyerCompanyId,
      sellerName: row.seller.name,
      buyerName: row.buyer.name,
      ticket: row.ticket === TradeLaneTicket.Mill ? 'mill' : 'me',
      reveal: row.reveal,
      behaviors: laneBehaviorsFromJson(row.behaviors),
      behaviorsEditable: false,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
