import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Company, Referral } from '@prisma/client';
import type { AccessRequestView, CreateReferralDto, ReferralView } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { CompanySerializer } from '../access/company.serializer';
import { randomToken } from '../common/crypto.util';

type ReferralWithParties = Referral & {
  referrer: Company;
  target: Company | null;
};

/**
 * Referral / vouch links. Open invites redeem into an access request to the
 * referrer (seller approves on Buyers). Targeted vouch attributes access
 * requests to a third party — not a trust bypass.
 */
@Injectable()
export class ReferralService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: CompanySerializer,
    private readonly access: AccessService,
  ) {}

  async create(companyId: string, dto: CreateReferralDto): Promise<ReferralView> {
    if (dto.targetCompanyId) {
      if (dto.targetCompanyId === companyId) {
        throw new BadRequestException({
          code: 'INVALID_TARGET',
          message: 'You cannot vouch for your own business.',
        });
      }
      const target = await this.prisma.company.findUnique({
        where: { id: dto.targetCompanyId },
        select: { id: true },
      });
      if (!target) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Business not found.' });
      }
    }

    const referral = await this.prisma.referral.create({
      data: {
        referrerCompanyId: companyId,
        targetCompanyId: dto.targetCompanyId ?? null,
        token: randomToken(18),
        note: dto.note ?? null,
      },
      include: { referrer: true, target: true },
    });
    return this.toView(referral);
  }

  async resolve(token: string): Promise<ReferralView> {
    return this.toView(await this.loadByToken(token));
  }

  /**
   * Open invite only: create a pending access request to the referrer.
   * Targeted vouch must use the access-request path on the landing CTA instead.
   */
  async redeem(viewerCompanyId: string, token: string): Promise<AccessRequestView> {
    const referral = await this.loadByToken(token);

    if (referral.targetCompanyId) {
      throw new BadRequestException({
        code: 'VOUCH_NOT_REDEEMABLE',
        message: 'This link vouches for another business. Request access instead.',
      });
    }

    if (referral.referrerCompanyId === viewerCompanyId) {
      throw new BadRequestException({
        code: 'INVALID_TARGET',
        message: 'You cannot request access with your own invite.',
      });
    }

    return this.access.createRequest(viewerCompanyId, {
      targetCompanyId: referral.referrerCompanyId,
      note: referral.note ?? undefined,
      referredBy: 'Invite',
    });
  }

  async list(companyId: string): Promise<ReferralView[]> {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerCompanyId: companyId },
      orderBy: { createdAt: 'desc' },
      include: { referrer: true, target: true },
    });
    return referrals.map((referral) => this.toView(referral));
  }

  private async loadByToken(token: string): Promise<ReferralWithParties> {
    const referral = await this.prisma.referral.findUnique({
      where: { token },
      include: { referrer: true, target: true },
    });
    if (!referral) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Referral link is invalid.' });
    }
    return referral;
  }

  private toView(referral: ReferralWithParties): ReferralView {
    return {
      id: referral.id,
      token: referral.token,
      note: referral.note,
      referrer: this.serializer.toPublicSummary(referral.referrer),
      target: referral.target ? this.serializer.toPublicSummary(referral.target) : null,
      createdAt: referral.createdAt.toISOString(),
    };
  }
}
