import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CompanyCard, FollowAskResult, FollowAskView, ShopFollowerView } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { VisibilityService } from '../access/visibility.service';
import { DiscoverySerializer } from './discovery.serializer';
import { allowedFollowWhere, FollowAccessKind, FollowStatus } from './follow-access';

@Injectable()
export class FollowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly serializer: DiscoverySerializer,
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
      return { following: true, pending: false };
    }
    if (existing?.status === FollowStatus.Pending) {
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

  async unfollow(
    followerCompanyId: string,
    followedCompanyId: string,
  ): Promise<FollowAskResult> {
    await this.prisma.follow.deleteMany({ where: { followerCompanyId, followedCompanyId } });
    return { following: false, pending: false };
  }

  async listFollowing(companyId: string): Promise<CompanyCard[]> {
    const follows = await this.prisma.follow.findMany({
      where: allowedFollowWhere(companyId),
      orderBy: { createdAt: 'desc' },
      include: { followed: true },
    });
    return follows.map((follow) => this.serializer.toCompanyCard(follow.followed));
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
      where: { followedCompanyId: companyId, status: FollowStatus.Allowed },
      orderBy: { createdAt: 'desc' },
      include: { follower: true },
    });
    return follows.map((follow) => ({
      company: this.serializer.toCompanyCard(follow.follower),
      accessKind:
        follow.accessKind === FollowAccessKind.Pack
          ? FollowAccessKind.Pack
          : FollowAccessKind.Look,
      createdAt: follow.createdAt.toISOString(),
    }));
  }

  async listAsks(companyId: string): Promise<FollowAskView[]> {
    const follows = await this.prisma.follow.findMany({
      where: { followedCompanyId: companyId, status: FollowStatus.Pending },
      orderBy: { createdAt: 'desc' },
      include: { follower: true },
    });
    return follows.map((follow) => ({
      company: this.serializer.toCompanyCard(follow.follower),
      createdAt: follow.createdAt.toISOString(),
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
    if (!row || row.status !== FollowStatus.Pending) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Ask not found.' });
    }

    if (decision === 'deny') {
      await this.prisma.follow.delete({ where: { id: row.id } });
      return { ok: true };
    }

    await this.prisma.follow.update({
      where: { id: row.id },
      data: {
        status: FollowStatus.Allowed,
        accessKind: decision === 'pack' ? FollowAccessKind.Pack : FollowAccessKind.Look,
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

    const updated = await this.prisma.follow.update({
      where: { id: row.id },
      data: {
        accessKind: accessKind === 'pack' ? FollowAccessKind.Pack : FollowAccessKind.Look,
      },
      include: { follower: true },
    });
    return {
      company: this.serializer.toCompanyCard(updated.follower),
      accessKind:
        updated.accessKind === FollowAccessKind.Pack
          ? FollowAccessKind.Pack
          : FollowAccessKind.Look,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
