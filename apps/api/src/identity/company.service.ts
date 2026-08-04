import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Company } from '@prisma/client';
import {
  CollectionStatus,
  MembershipRole,
  PublishAudience,
  type AuthTokens,
  type CollectionCard,
  type CompanyContactPoint,
  type CreateCompanyDto,
  type CursorPage,
  type CursorPageQuery,
  type OwnCompanyProfile,
  type PublicCompanyProfile,
  type UpdateCompanyDto,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { TokenService } from '../auth/token.service';
import { CompanySerializer } from '../access/company.serializer';
import { VisibilityService } from '../access/visibility.service';
import { collectionCardInclude, collectionPreviewFromRow } from '../discovery/collection-preview';
import { cursorArgs, toCursorPage } from '../discovery/pagination';
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
   *
   * canPublish stays false until first publish consent — declaring super
   * categories alone does not make the business a seller.
   */
  async create(
    principal: AuthPrincipal,
    dto: CreateCompanyDto,
  ): Promise<{ tokens: AuthTokens; company: OwnCompanyProfile }> {
    let company;
    try {
      company = await this.prisma.$transaction(
        async (tx) => {
          const existing = await tx.companyMembership.findFirst({
            where: { userId: principal.userId },
          });
          if (existing) {
            throw new ConflictException({
              code: 'COMPANY_EXISTS',
              message:
                'Your account already has a business. Multiple businesses arrive in a later phase.',
            });
          }

          const created = await tx.company.create({
            data: {
              name: dto.name,
              city: dto.city,
              about: dto.about ?? null,
              gstNumber: dto.gstNumber ?? null,
              sellCategories: dto.sellCategories,
              buyCategories: dto.buyCategories,
              superCategories: dto.superCategories,
              canPublish: false,
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
          await tx.user.update({
            where: { id: principal.userId },
            data: { name: dto.contactPerson },
          });
          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException({
          code: 'COMPANY_EXISTS',
          message: 'Your account already has a business.',
        });
      }
      throw error;
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: principal.userId } });
    const tokens = await this.tokens.issue({ id: user.id, phone: user.phone }, company.id);

    return {
      tokens,
      company: await this.toOwnProfile(company, user.name),
    };
  }

  async getOwnProfile(companyId: string, userId: string): Promise<OwnCompanyProfile> {
    const [company, user] = await Promise.all([
      this.prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } }),
    ]);
    return this.toOwnProfile(company, user.name);
  }

  async updateOwnProfile(
    companyId: string,
    userId: string,
    dto: UpdateCompanyDto,
  ): Promise<OwnCompanyProfile> {
    if (dto.contactPerson !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { name: dto.contactPerson },
      });
    }

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        name: dto.name,
        city: dto.city,
        about: dto.about === undefined ? undefined : dto.about,
        gstNumber: dto.gstNumber === undefined ? undefined : dto.gstNumber,
        sellCategories: dto.sellCategories,
        buyCategories: dto.buyCategories,
        superCategories: dto.superCategories,
      },
    });
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true },
    });
    return this.toOwnProfile(company, user.name);
  }

  private async toOwnProfile(
    company: Company,
    contactPerson: string | null,
  ): Promise<OwnCompanyProfile> {
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId: company.id },
      select: { tradeDefaults: true },
    });
    return this.serializer.toOwnProfile(company, contactPerson, settings?.tradeDefaults);
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
      return [];
    }
    const memberships = await this.prisma.companyMembership.findMany({
      where: { companyId: targetId, contactRole: { not: null } },
      include: { user: { select: { name: true, phone: true } } },
    });
    return this.serializer.toContactPoints(memberships);
  }

  /**
   * Published collections for a company's public "shop" shelf. Blocked viewers
   * get the same 404 as a missing business. Drafts never appear; product-level
   * trust (blur / rates) still applies when opening a collection.
   */
  async listPublishedCollections(
    viewerCompanyId: string,
    targetId: string,
    query: CursorPageQuery,
  ): Promise<CursorPage<CollectionCard>> {
    if (await this.visibility.isBlocked(viewerCompanyId, targetId)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Business not found.' });
    }
    const company = await this.prisma.company.findUnique({ where: { id: targetId } });
    if (!company) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Business not found.' });
    }

    const rows = await this.prisma.collection.findMany({
      where: {
        companyId: targetId,
        status: CollectionStatus.Published,
        OR: [
          { audience: { not: PublishAudience.Selected } },
          {
            audience: PublishAudience.Selected,
            audienceCompanyIds: { has: viewerCompanyId },
          },
          // Owner browsing their own shop still sees every published collection.
          ...(viewerCompanyId === targetId ? [{ companyId: targetId }] : []),
        ],
      },
      include: collectionCardInclude,
      ...cursorArgs(query),
    });

    return toCursorPage(rows, query.limit, (row) => {
      const preview = collectionPreviewFromRow(row);
      return {
        id: row.id,
        name: row.name,
        coverImage: row.coverImage,
        previewImages: preview.previewImages,
        imageCount: preview.imageCount,
        productCount: row._count.products,
        status: row.status,
        updatedAt: row.updatedAt.toISOString(),
        company: this.serializer.toPublicSummary(row.company),
      };
    });
  }
}
