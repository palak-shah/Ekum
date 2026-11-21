import type { Company } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FollowAccessKind as FollowAccessKindDto,
  MessageType,
  ThreadParticipantState,
} from '@ekum/domain-types';
import type { CompanyCard, FollowAskResult, FollowAskView, ShopFollowerView } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { VisibilityService } from '../access/visibility.service';
import { deleteOwnBlock, hasOwnBlock } from '../access/company-block';
import { ensureActiveConnectionUnlessBlocked } from '../access/ensure-active-connection';
import { ThreadService } from '../conversation/thread.service';
import { DomainEvents } from '../events/events.module';
import { DiscoverySerializer } from './discovery.serializer';
import {
  allowedFollowWhere,
  FollowAccessKind,
  FollowStatus,
} from './follow-access';
import {
  isShopRepostPackAllowed,
  mergeTradeDefaults,
} from '../identity/trade-presence';

export function millRepostOffBody(traderName: string): string {
  return `You turned off Repost for ${traderName}`;
}

export function traderRepostOffBody(millName: string): string {
  return `${millName} turned off Repost for you · Request`;
}

@Injectable()
export class FollowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly serializer: DiscoverySerializer,
    /** Required: Accept follow must activate Pending/Archived Direct (no silent skip). */
    private readonly threads: ThreadService,
    private readonly events: DomainEvents,
  ) {}

  /** Ask to follow — never auto-allow. */
  async follow(followerCompanyId: string, followedCompanyId: string): Promise<FollowAskResult> {
    if (followerCompanyId === followedCompanyId) {
      throw new BadRequestException({
        code: 'INVALID_TARGET',
        message: 'You cannot follow your own business.',
      });
    }

    const target = await this.prisma.company.findUnique({ where: { id: followedCompanyId } });
    if (!target || (await this.visibility.isBlocked(followerCompanyId, followedCompanyId))) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Business not found.' });
    }

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerCompanyId_followedCompanyId: { followerCompanyId, followedCompanyId },
      },
    });
    if (existing?.status === FollowStatus.Allowed) {
      return {
        following: true,
        pending: false,
        packAskPending: existing.packAskPending,
      };
    }
    if (existing?.status === FollowStatus.Pending) {
      return { following: false, pending: true };
    }
    if (existing?.status === FollowStatus.Stopped) {
      await this.prisma.follow.update({
        where: { id: existing.id },
        data: { status: FollowStatus.Pending, accessKind: null, packAskPending: false },
      });
      return { following: false, pending: true };
    }

    await this.prisma.follow.create({
      data: {
        followerCompanyId,
        followedCompanyId,
        status: FollowStatus.Pending,
        accessKind: null,
      },
    });
    return { following: false, pending: true };
  }

  /** Direct Link Request repost — Pack upgrade while Look stays. */
  async requestShare(
    followerCompanyId: string,
    followedCompanyId: string,
  ): Promise<FollowAskResult> {
    if (followerCompanyId === followedCompanyId) {
      throw new BadRequestException({
        code: 'INVALID_TARGET',
        message: 'You cannot follow your own business.',
      });
    }

    const target = await this.prisma.company.findUnique({ where: { id: followedCompanyId } });
    if (!target || (await this.visibility.isBlocked(followerCompanyId, followedCompanyId))) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Business not found.' });
    }

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerCompanyId_followedCompanyId: { followerCompanyId, followedCompanyId },
      },
    });
    if (!existing) {
      return this.follow(followerCompanyId, followedCompanyId);
    }
    if (existing.status === FollowStatus.Pending) {
      return { following: false, pending: true };
    }
    if (existing.status === FollowStatus.Stopped) {
      await this.prisma.follow.update({
        where: { id: existing.id },
        data: {
          status: FollowStatus.Pending,
          accessKind: null,
          packAskPending: true,
        },
      });
      return { following: false, pending: true, packAskPending: true };
    }
    if (existing.status === FollowStatus.Allowed && existing.accessKind === FollowAccessKind.Pack) {
      return { following: true, pending: false, packAskPending: false };
    }
    if (existing.packAskPending) {
      return { following: true, pending: false, packAskPending: true };
    }
    await this.prisma.follow.update({
      where: { id: existing.id },
      data: { packAskPending: true },
    });
    return { following: true, pending: false, packAskPending: true };
  }

  async unfollow(
    followerCompanyId: string,
    followedCompanyId: string,
  ): Promise<FollowAskResult> {
    await this.prisma.follow.deleteMany({
      where: { followerCompanyId, followedCompanyId },
    });
    // Unfollow is silent in chat — only mill setAccess Pack→Look posts Repost-off.
    return { following: false, pending: false };
  }

  async listFollowing(companyId: string): Promise<CompanyCard[]> {
    const follows = await this.prisma.follow.findMany({
      where: allowedFollowWhere(companyId),
      orderBy: { createdAt: 'desc' },
      include: { followed: true },
    });
    return follows.map((follow) => ({
      ...this.serializer.toCompanyCard(follow.followed),
      accessKind:
        follow.accessKind === FollowAccessKind.Pack
          ? FollowAccessKindDto.Pack
          : FollowAccessKindDto.Look,
      packAskPending: follow.packAskPending,
    }));
  }

  async listOutgoingPending(companyId: string): Promise<CompanyCard[]> {
    const follows = await this.prisma.follow.findMany({
      where: { followerCompanyId: companyId, status: FollowStatus.Pending },
      orderBy: { createdAt: 'desc' },
      include: { followed: true },
    });
    return follows.map((follow) => this.serializer.toCompanyCard(follow.followed));
  }

  async listFollowers(companyId: string): Promise<ShopFollowerView[]> {
    const follows = await this.prisma.follow.findMany({
      where: {
        followedCompanyId: companyId,
        status: { in: [FollowStatus.Allowed, FollowStatus.Stopped] },
      },
      orderBy: { createdAt: 'desc' },
      include: { follower: true },
    });
    return follows.map((follow) => this.toFollowerView(follow));
  }

  async listAsks(companyId: string): Promise<FollowAskView[]> {
    const follows = await this.prisma.follow.findMany({
      where: {
        followedCompanyId: companyId,
        OR: [
          { status: FollowStatus.Pending },
          { status: FollowStatus.Allowed, packAskPending: true },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { follower: true },
    });
    const blockedIds = new Set<string>();
    if (follows.length > 0) {
      const edges = await this.prisma.companyBlock.findMany({
        where: {
          blockerCompanyId: companyId,
          blockedCompanyId: { in: follows.map((f) => f.followerCompanyId) },
        },
        select: { blockedCompanyId: true },
      });
      for (const edge of edges) blockedIds.add(edge.blockedCompanyId);
    }
    return follows.map((follow) => ({
      company: this.serializer.toCompanyCard(follow.follower),
      createdAt: follow.createdAt.toISOString(),
      kind: follow.packAskPending ? 'share' : 'see',
      blockedByMe: blockedIds.has(follow.followerCompanyId),
    }));
  }

  async decide(
    shopCompanyId: string,
    followerCompanyId: string,
    decision: 'look' | 'pack' | 'deny',
  ): Promise<{ ok: true }> {
    if (shopCompanyId === followerCompanyId) {
      throw new BadRequestException({
        code: 'INVALID_TARGET',
        message: 'You cannot decide your own follow.',
      });
    }

    const row = await this.prisma.follow.findUnique({
      where: {
        followerCompanyId_followedCompanyId: {
          followerCompanyId,
          followedCompanyId: shopCompanyId,
        },
      },
    });
    if (!row) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Ask not found.' });
    }

    if (row.status === FollowStatus.Allowed && row.packAskPending) {
      if (decision === 'pack') {
        await this.prisma.follow.update({
          where: { id: row.id },
          data: { accessKind: FollowAccessKind.Pack, packAskPending: false },
        });
        this.events.followAllowed({
          followerCompanyId,
          shopCompanyId,
          accessKind: 'pack',
        });
        return { ok: true };
      }
      if (decision === 'look') {
        // Accept without Allow Repost — keep Look, drop the Repost ask.
        await this.prisma.follow.update({
          where: { id: row.id },
          data: { packAskPending: false },
        });
        return { ok: true };
      }
      // Reject Ask to repost — Repost denied; Look stays (silent).
      await this.prisma.follow.update({
        where: { id: row.id },
        data: {
          status: FollowStatus.Allowed,
          accessKind: row.accessKind ?? FollowAccessKind.Look,
          packAskPending: false,
        },
      });
      return { ok: true };
    }

    if (decision === 'deny') {
      if (row.status === FollowStatus.Pending) {
        await this.prisma.follow.delete({ where: { id: row.id } });
        return { ok: true };
      }
      if (row.status !== FollowStatus.Allowed) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Ask not found.' });
      }
      await this.prisma.follow.update({
        where: { id: row.id },
        data: { status: FollowStatus.Stopped, accessKind: null, packAskPending: false },
      });
      return { ok: true };
    }

    if (row.status !== FollowStatus.Pending && row.status !== FollowStatus.Stopped) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Ask not found.' });
    }

    if (decision === 'pack') {
      await this.assertShopPackAllowed(shopCompanyId);
    }
    const accessKind = decision === 'pack' ? FollowAccessKind.Pack : FollowAccessKind.Look;
    await this.prisma.follow.update({
      where: { id: row.id },
      data: {
        status: FollowStatus.Allowed,
        accessKind,
        packAskPending: false,
      },
    });
    // Accept while I blocked them: clear my edge so Connection can form (UI confirms first).
    if (await hasOwnBlock(this.prisma, shopCompanyId, followerCompanyId)) {
      await this.prisma.$transaction(async (tx) => {
        await deleteOwnBlock(tx, shopCompanyId, followerCompanyId);
      });
    }
    // Follow ⇒ Connect: Allow also ensures Active Connection (chat without Requests).
    await ensureActiveConnectionUnlessBlocked(this.prisma, shopCompanyId, followerCompanyId);
    // Message then follow: Accept follow also opens a pending Direct request.
    await this.acceptPendingDirectWith(shopCompanyId, followerCompanyId);
    this.events.followAllowed({
      followerCompanyId,
      shopCompanyId,
      accessKind: decision === 'pack' ? 'pack' : 'look',
    });
    return { ok: true };
  }

  /** Activate Pending or Ignored (Archived) Direct — Accept follow undoes Ignore. */
  private async acceptPendingDirectWith(
    shopCompanyId: string,
    counterpartCompanyId: string,
  ): Promise<void> {
    const threadId = await this.threads.findDirectThreadId(shopCompanyId, counterpartCompanyId);
    if (!threadId) return;
    await this.prisma.threadParticipant.updateMany({
      where: {
        threadId,
        companyId: shopCompanyId,
        state: { in: [ThreadParticipantState.Pending, ThreadParticipantState.Archived] },
      },
      data: { state: ThreadParticipantState.Active, leftAt: null },
    });
  }

  async setAccess(
    shopCompanyId: string,
    followerCompanyId: string,
    accessKind: 'look' | 'pack',
  ): Promise<ShopFollowerView> {
    const row = await this.prisma.follow.findUnique({
      where: {
        followerCompanyId_followedCompanyId: {
          followerCompanyId,
          followedCompanyId: shopCompanyId,
        },
      },
      include: { follower: true },
    });
    if (!row || row.followedCompanyId !== shopCompanyId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not your follower list.' });
    }
    if (row.status !== FollowStatus.Allowed) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Follower not found.' });
    }

    if (accessKind === 'pack') {
      await this.assertShopPackAllowed(shopCompanyId);
    }
    const nextKind = accessKind === 'pack' ? FollowAccessKind.Pack : FollowAccessKind.Look;
    const updated = await this.prisma.follow.update({
      where: { id: row.id },
      data: {
        accessKind: nextKind,
        packAskPending: nextKind === FollowAccessKind.Pack ? false : row.packAskPending,
      },
      include: { follower: true },
    });
    if (row.accessKind === FollowAccessKind.Pack && nextKind === FollowAccessKind.Look) {
      await this.notifyShareOff(shopCompanyId, followerCompanyId);
    }
    return this.toFollowerView(updated);
  }

  /**
   * P3 shop-wide Pack OFF: persist policy, convert every Pack follower to Look,
   * notify each edge. Existing descendant packs stay (soft-unavailable / sync stop).
   */
  async setShopRepostPack(
    shopCompanyId: string,
    allowed: boolean,
  ): Promise<{ ok: true; demoted: number }> {
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId: shopCompanyId },
    });
    const next = mergeTradeDefaults(settings?.tradeDefaults, {
      shopRepostPackAllowed: allowed,
    });
    await this.prisma.companySettings.upsert({
      where: { companyId: shopCompanyId },
      create: { companyId: shopCompanyId, tradeDefaults: next },
      update: { tradeDefaults: next },
    });
    if (allowed) {
      return { ok: true, demoted: 0 };
    }
    const packFollowers = await this.prisma.follow.findMany({
      where: {
        followedCompanyId: shopCompanyId,
        status: FollowStatus.Allowed,
        accessKind: FollowAccessKind.Pack,
      },
      select: { id: true, followerCompanyId: true },
    });
    if (packFollowers.length > 0) {
      await this.prisma.follow.updateMany({
        where: { id: { in: packFollowers.map((row) => row.id) } },
        data: { accessKind: FollowAccessKind.Look },
      });
      for (const row of packFollowers) {
        await this.notifyShareOff(shopCompanyId, row.followerCompanyId);
      }
    }
    return { ok: true, demoted: packFollowers.length };
  }

  private async assertShopPackAllowed(shopCompanyId: string): Promise<void> {
    const settings = this.prisma.companySettings
      ? await this.prisma.companySettings.findUnique({
          where: { companyId: shopCompanyId },
          select: { tradeDefaults: true },
        })
      : null;
    if (!isShopRepostPackAllowed(settings?.tradeDefaults)) {
      throw new ForbiddenException({
        code: 'SHOP_PACK_OFF',
        message: 'This shop is not granting Repost right now.',
      });
    }
  }

  /** Mill Pack→Look only — exact mill↔trader Direct; Buyer never gets this line. */
  private async notifyShareOff(millCompanyId: string, traderCompanyId: string): Promise<void> {
    const threadId = await this.threads.findExactPairDirectThreadId(
      millCompanyId,
      traderCompanyId,
    );
    if (!threadId) return;
    const companies = await this.prisma.company.findMany({
      where: { id: { in: [millCompanyId, traderCompanyId] } },
      select: { id: true, name: true },
    });
    const millName = companies.find((c) => c.id === millCompanyId)?.name?.trim() || 'Supplier';
    const traderName = companies.find((c) => c.id === traderCompanyId)?.name?.trim() || 'Trader';
    await this.prisma.message.create({
      data: {
        threadId,
        senderCompanyId: millCompanyId,
        type: MessageType.System,
        body: millRepostOffBody(traderName),
        metadata: {
          kind: 'share_revoked',
          millCompanyId,
          traderCompanyId,
          millName,
          traderName,
        },
      },
    });
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });
  }

  private toFollowerView(follow: {
    accessKind: string | null;
    status: string;
    createdAt: Date;
    follower: Company;
  }): ShopFollowerView {
    return {
      company: this.serializer.toCompanyCard(follow.follower),
      accessKind:
        follow.accessKind === FollowAccessKind.Pack
          ? FollowAccessKind.Pack
          : FollowAccessKind.Look,
      stopped: follow.status === FollowStatus.Stopped,
      createdAt: follow.createdAt.toISOString(),
    };
  }
}
