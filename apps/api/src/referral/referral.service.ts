import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Company, Referral } from '@prisma/client';
import type { CreateReferralDto, ReferralView } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { CompanySerializer } from '../access/company.serializer';
import { randomToken } from '../common/crypto.util';

type ReferralWithParties = Referral & {
  referrer: Company;
  target: Company | null;
};

/**
 * Referral / vouch links. A company mints a shareable token; opening it lets the
 * recipient send an access request pre-attributed to the referrer, so trust
 * travels through people rather than cold outreach.
 */
@Injectable()
export class ReferralService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: CompanySerializer,
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
    const referral = await this.prisma.referral.findUnique({
      where: { token },
      include: { referrer: true, target: true },
    });
    if (!referral) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Referral link is invalid.' });
    }
    return this.toView(referral);
  }

  async list(companyId: string): Promise<ReferralView[]> {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerCompanyId: companyId },
      orderBy: { createdAt: 'desc' },
      include: { referrer: true, target: true },
    });
    return referrals.map((referral) => this.toView(referral));
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
