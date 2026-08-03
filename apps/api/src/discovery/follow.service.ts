import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CompanyCard } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { VisibilityService } from '../access/visibility.service';
import { DiscoverySerializer } from './discovery.serializer';

@Injectable()
export class FollowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly serializer: DiscoverySerializer,
  ) {}

  /** Following is permissionless, but a company blocked by the target cannot follow it. */
  async follow(followerCompanyId: string, followedCompanyId: string): Promise<{ following: true }> {
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

    await this.prisma.follow.upsert({
      where: {
        followerCompanyId_followedCompanyId: { followerCompanyId, followedCompanyId },
      },
      create: { followerCompanyId, followedCompanyId },
      update: {},
    });
    return { following: true };
  }

  async unfollow(
    followerCompanyId: string,
    followedCompanyId: string,
  ): Promise<{ following: false }> {
    await this.prisma.follow.deleteMany({ where: { followerCompanyId, followedCompanyId } });
    return { following: false };
  }

  async listFollowing(companyId: string): Promise<CompanyCard[]> {
    const follows = await this.prisma.follow.findMany({
      where: { followerCompanyId: companyId },
      orderBy: { createdAt: 'desc' },
      include: { followed: true },
    });
    return follows.map((follow) => this.serializer.toCompanyCard(follow.followed));
  }

  async listFollowers(companyId: string): Promise<CompanyCard[]> {
    const follows = await this.prisma.follow.findMany({
      where: { followedCompanyId: companyId },
      orderBy: { createdAt: 'desc' },
      include: { follower: true },
    });
    return follows.map((follow) => this.serializer.toCompanyCard(follow.follower));
  }
}
