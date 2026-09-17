import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  CatalogTagScope,
  CatalogTagStatus,
  SuperCategory,
  type CatalogTagView,
  type CreateCatalogTagDto,
} from '@ekum/domain-types';
import type { CatalogTag } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';

/** Cap company-private custom tags per business. */
const COMPANY_TAG_CAP = 100;

/**
 * Map onboarding superCategories + free-text sellCategories onto taxonomy
 * Main Category keys (parentKey on official tags).
 */
const SUPER_TO_PARENT: Record<string, string> = {
  [SuperCategory.HomeFurnishing]: 'HOME TEXTILES',
  [SuperCategory.WomensApparel]: 'WOMENS WEAR',
  [SuperCategory.MensApparel]: 'MENS WEAR',
  [SuperCategory.Accessories]: 'ACCESSORIES',
};

const PARENT_ALIASES: Record<string, string> = {
  'home textiles': 'HOME TEXTILES',
  'home furnishing': 'HOME TEXTILES',
  'home furnishings': 'HOME TEXTILES',
  'womens wear': 'WOMENS WEAR',
  "women's wear": 'WOMENS WEAR',
  'womens apparel': 'WOMENS WEAR',
  "women's apparel": 'WOMENS WEAR',
  'mens wear': 'MENS WEAR',
  "men's wear": 'MENS WEAR',
  'mens apparel': 'MENS WEAR',
  "men's apparel": 'MENS WEAR',
  fabrics: 'FABRICS',
  fabric: 'FABRICS',
  accessories: 'ACCESSORIES',
  'kids wear': 'KIDS WEAR',
  "kid's wear": 'KIDS WEAR',
  kidswear: 'KIDS WEAR',
};

export function parentKeysFromCompanyCategories(
  sellCategories: string[],
  superCategories: string[],
): string[] {
  const keys = new Set<string>();
  for (const raw of superCategories) {
    const mapped = SUPER_TO_PARENT[raw];
    if (mapped) keys.add(mapped);
  }
  for (const raw of sellCategories) {
    const needle = raw.trim().toLowerCase();
    if (!needle) continue;
    const alias = PARENT_ALIASES[needle];
    if (alias) {
      keys.add(alias);
      continue;
    }
    // Exact Main Category match (e.g. "HOME TEXTILES" pasted into sell tags).
    for (const parent of Object.values(SUPER_TO_PARENT)) {
      if (parent.toLowerCase() === needle) keys.add(parent);
    }
    for (const parent of ['FABRICS', 'KIDS WEAR', 'HOME TEXTILES', 'WOMENS WEAR', 'MENS WEAR', 'ACCESSORIES']) {
      if (parent.toLowerCase() === needle) keys.add(parent);
    }
  }
  return [...keys];
}

@Injectable()
export class CatalogTagService {
  constructor(private readonly prisma: PrismaService) {}

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
