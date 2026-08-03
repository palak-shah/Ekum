import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  MembershipRole,
  type AuthTokens,
  type CompanyContactPoint,
  type CreateCompanyDto,
  type OwnCompanyProfile,
  type PublicCompanyProfile,
  type UpdateCompanyDto,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { TokenService } from '../auth/token.service';
import { CompanySerializer } from '../access/company.serializer';
import { VisibilityService } from '../access/visibility.service';
import type { AuthPrincipal } from '../auth/auth.types';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly serializer: CompanySerializer,
    private readonly visibility: VisibilityService,
  ) {}

  /**
   * Onboarding: creates the company and the founding owner membership, then
   * reissues tokens so the user is now acting as the new company. Providing a
   * GST number does not auto-verify — verification is a trust signal earned
   * separately, so it stays neutral here.
   */
  async create(
    principal: AuthPrincipal,
    dto: CreateCompanyDto,
  ): Promise<{ tokens: AuthTokens; company: OwnCompanyProfile }> {
    const existing = await this.prisma.companyMembership.findFirst({
      where: { userId: principal.userId },
    });
    if (existing) {
      throw new ConflictException({
        code: 'COMPANY_EXISTS',
        message: 'Your account already has a business. Multiple businesses arrive in a later phase.',
      });
    }

    const company = await this.prisma.$transaction(async (tx) => {
      const created = await tx.company.create({
        data: {
          name: dto.name,
          city: dto.city,
          about: dto.about ?? null,
          gstNumber: dto.gstNumber ?? null,
          sellCategories: dto.sellCategories,
          buyCategories: dto.buyCategories,
        },
      });
      await tx.companyMembership.create({
        data: {
          userId: principal.userId,
          companyId: created.id,
          role: MembershipRole.Owner,
          contactRole: 'Owner',
        },
      });
      if (dto.contactPerson) {
        await tx.user.update({ where: { id: principal.userId }, data: { name: dto.contactPerson } });
      }
      return created;
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: principal.userId } });
    const tokens = await this.tokens.issue({ id: user.id, phone: user.phone }, company.id);

    return { tokens, company: this.serializer.toOwnProfile(company) };
  }

  async getOwnProfile(companyId: string): Promise<OwnCompanyProfile> {
    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    return this.serializer.toOwnProfile(company);
  }

  async updateOwnProfile(companyId: string, dto: UpdateCompanyDto): Promise<OwnCompanyProfile> {
    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        name: dto.name,
        city: dto.city,
        about: dto.about,
        gstNumber: dto.gstNumber,
        sellCategories: dto.sellCategories,
        buyCategories: dto.buyCategories,
      },
    });
    return this.serializer.toOwnProfile(company);
  }

  async getPublicProfile(viewerCompanyId: string, targetId: string): Promise<PublicCompanyProfile> {
    if (await this.visibility.isBlocked(viewerCompanyId, targetId)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Business not found.' });
    }
    const company = await this.prisma.company.findUnique({ where: { id: targetId } });
    if (!company) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Business not found.' });
    }
    return this.serializer.toPublicProfile(company);
  }

  async getContactPoints(
    viewerCompanyId: string,
    targetId: string,
  ): Promise<CompanyContactPoint[]> {
    if (await this.visibility.isBlocked(viewerCompanyId, targetId)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Business not found.' });
    }
    if (!(await this.visibility.canViewCatalog(viewerCompanyId, targetId))) {
      // Contact points are relationship-gated; unconnected viewers cannot see them.
      return [];
    }
    const memberships = await this.prisma.companyMembership.findMany({
      where: { companyId: targetId, contactRole: { not: null } },
      include: { user: { select: { name: true, phone: true } } },
    });
    return this.serializer.toContactPoints(memberships);
  }
}
