import type { Company } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { FollowAccessKind as FollowAccessKindDto, MessageType } from '@ekum/domain-types';
import type { CompanyCard, FollowAskResult, FollowAskView, ShopFollowerView } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { VisibilityService } from '../access/visibility.service';
import { ThreadService } from '../conversation/thread.service';
import { DiscoverySerializer } from './discovery.serializer';
import { allowedFollowWhere, FollowAccessKind, FollowStatus } from './follow-access';

export const SHARE_REVOKED_LINE = 'Share for all collections is off. Request again.';

@Injectable()
export class FollowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly serializer: DiscoverySerializer,
    @Optional() private readonly threads?: ThreadService,
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

  /** Direct Link Request share — Pack upgrade while Look stays. */
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
    await this.notifyShareOff(followedCompanyId, followerCompanyId);
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
    return follows.map((follow) => ({
      company: this.serializer.toCompanyCard(follow.follower),
      createdAt: follow.createdAt.toISOString(),
      kind: follow.packAskPending ? 'share' : 'see',
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
        return { ok: true };
      }
      await this.prisma.follow.update({
        where: { id: row.id },
        data: { packAskPending: false },
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
      await this.notifyShareOff(shopCompanyId, followerCompanyId);
      return { ok: true };
    }

    if (row.status !== FollowStatus.Pending && row.status !== FollowStatus.Stopped) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Ask not found.' });
    }

    await this.prisma.follow.update({
      where: { id: row.id },
      data: {
        status: FollowStatus.Allowed,
        accessKind: decision === 'pack' ? FollowAccessKind.Pack : FollowAccessKind.Look,
        packAskPending: false,
      },
    });
    return { ok: true };
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

  private async notifyShareOff(millCompanyId: string, traderCompanyId: string): Promise<void> {
    const threadId = await this.threads?.findDirectThreadId(millCompanyId, traderCompanyId);
    if (!threadId) return;
    await this.prisma.message.create({
      data: {
        threadId,
        senderCompanyId: millCompanyId,
        type: MessageType.System,
        body: SHARE_REVOKED_LINE,
        metadata: { kind: 'share_revoked' },
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
