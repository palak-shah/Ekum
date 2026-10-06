import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  type OnModuleInit,
} from '@nestjs/common';
import {
  CatalogTagScope,
  CatalogTagStatus,
  mainsForCompany,
  parentKeysFromCompanyCategories,
  type CatalogTagView,
  type CreateCatalogTagDto,
  type TaxonomyMain,
} from '@ekum/domain-types';
import type { CatalogTag } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { seedOfficialCatalogTags } from './official-tags.seed';

export { parentKeysFromCompanyCategories };

/** Cap company-private custom tags per business. */
const COMPANY_TAG_CAP = 100;

@Injectable()
export class CatalogTagService implements OnModuleInit {
  private readonly log = new Logger(CatalogTagService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      const n = await seedOfficialCatalogTags(this.prisma);
      this.log.log(`Official catalog tags upserted (${n}).`);
    } catch (err) {
      this.log.warn(
        `Could not upsert official catalog tags: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
  }

  async taxonomy(companyId: string): Promise<TaxonomyMain[]> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { sellCategories: true, superCategories: true },
    });
    return mainsForCompany(
      parentKeysFromCompanyCategories(
        company?.sellCategories ?? [],
        company?.superCategories ?? [],
      ),
    );
  }

  async list(companyId: string): Promise<CatalogTagView[]> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { sellCategories: true, superCategories: true },
    });
    const parentKeys = parentKeysFromCompanyCategories(
      company?.sellCategories ?? [],
      company?.superCategories ?? [],
    );

    const [official, custom] = await Promise.all([
      this.prisma.catalogTag.findMany({
        where: {
          scope: CatalogTagScope.Official,
          companyId: null,
          ...(parentKeys.length > 0 ? { parentKey: { in: parentKeys } } : {}),
        },
        orderBy: [{ parentKey: 'asc' }, { label: 'asc' }],
      }),
      this.prisma.catalogTag.findMany({
        where: {
          scope: CatalogTagScope.Company,
          companyId,
        },
        orderBy: [{ label: 'asc' }],
      }),
    ]);

    return [...official, ...custom].map((row) => this.toView(row));
  }

  async create(companyId: string, dto: CreateCatalogTagDto): Promise<CatalogTagView> {
    const label = dto.label.trim();
    if (!label) {
      throw new BadRequestException({
        code: 'INVALID_TAG_LABEL',
        message: 'Give this tag a name.',
      });
    }

    const existing = await this.prisma.catalogTag.findFirst({
      where: {
        companyId,
        scope: CatalogTagScope.Company,
        label: { equals: label, mode: 'insensitive' },
      },
    });
    if (existing) {
      throw new ConflictException({
        code: 'TAG_EXISTS',
        message: `You already have a tag named “${existing.label}”.`,
      });
    }

    const count = await this.prisma.catalogTag.count({
      where: { companyId, scope: CatalogTagScope.Company },
    });
    if (count >= COMPANY_TAG_CAP) {
      throw new BadRequestException({
        code: 'TAG_LIMIT',
        message: `You can add up to ${COMPANY_TAG_CAP} custom tags.`,
      });
    }

    const row = await this.prisma.catalogTag.create({
      data: {
        scope: CatalogTagScope.Company,
        companyId,
        label,
        parentKey: null,
        status: CatalogTagStatus.Pending,
      },
    });
    return this.toView(row);
  }

  private toView(row: CatalogTag): CatalogTagView {
    return {
      id: row.id,
      scope: row.scope,
      companyId: row.companyId,
      label: row.label,
      parentKey: row.parentKey,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
