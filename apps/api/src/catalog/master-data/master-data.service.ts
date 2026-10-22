import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import {
  MasterOptionKind,
  createCompanyCustomTagSchema,
  type CompanyCustomTagView,
  type CreateCompanyCustomTagDto,
  type MasterCategoryView,
  type MasterTaxonomyView,
  type MasterOptionKind as OptionKind,
} from '@ekum/domain-types';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../core/config/config.schema';
import { PrismaService } from '../../core/prisma/prisma.service';
import { seedMasterDataFromSheet } from './master-data.seed';
import { phoneNumberSchema } from '@ekum/domain-types';

const COMPANY_TAG_CAP = 100;

/** Parse PLATFORM_ADMIN_PHONES; invalid entries are returned for logging (not dropped silently). */
export function parsePlatformAdminPhones(raw: string): {
  phones: string[];
  invalid: string[];
} {
  const phones: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const entry of raw.split(',').map((p) => p.trim()).filter(Boolean)) {
    const parsed = phoneNumberSchema.safeParse(entry);
    if (!parsed.success) {
      invalid.push(entry);
      continue;
    }
    if (seen.has(parsed.data)) continue;
    seen.add(parsed.data);
    phones.push(parsed.data);
  }
  return { phones, invalid };
}

@Injectable()
export class MasterDataService implements OnModuleInit {
  private readonly log = new Logger(MasterDataService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const n = await seedMasterDataFromSheet(this.prisma);
      this.log.log(`Master data upserted (option links ~${n}).`);
    } catch (err) {
      this.log.warn(
        `Could not seed master data: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
    await this.provisionPlatformAdmins();
  }

  private async provisionPlatformAdmins(): Promise<void> {
    const raw = this.config.get('PLATFORM_ADMIN_PHONES', { infer: true }) ?? '';
    const { phones, invalid } = parsePlatformAdminPhones(raw);
    for (const entry of invalid) {
      this.log.warn(
        `PLATFORM_ADMIN_PHONES: skipped invalid entry "${entry}" (use +91… or 10-digit mobile).`,
      );
    }
    if (phones.length === 0) return;

    for (const phone of phones) {
      await this.provisionOnePlatformAdmin(phone);
    }
  }

  private async provisionOnePlatformAdmin(phone: string, attempt = 1): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({ where: { phone } });
      if (!user) {
        this.log.warn(
          `PLATFORM_ADMIN_PHONES: no user for ${phone} yet — grant runs again on next API boot after first login.`,
        );
        return;
      }
      if (user.isPlatformAdmin) return;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isPlatformAdmin: true },
      });
      this.log.log(`Platform admin enabled for ${phone}`);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'unknown';
      if (attempt < 2) {
        this.log.warn(
          `PLATFORM_ADMIN_PHONES: provision ${phone} failed (${detail}); retrying once.`,
        );
        await this.provisionOnePlatformAdmin(phone, attempt + 1);
        return;
      }
      this.log.warn(
        `PLATFORM_ADMIN_PHONES: could not provision ${phone} after retry: ${detail}`,
      );
    }
  }

  async listCategories(activeOnly = true): Promise<MasterCategoryView[]> {
    const rows = await this.prisma.masterCategory.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      label: row.label,
      active: row.active,
      sortOrder: row.sortOrder,
    }));
  }

  async taxonomyForCategory(
    categoryIdOrSlug: string,
    companyId?: string,
  ): Promise<MasterTaxonomyView> {
    const category = await this.prisma.masterCategory.findFirst({
      where: {
        OR: [{ id: categoryIdOrSlug }, { slug: categoryIdOrSlug }],
        active: true,
      },
    });
    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'That category is not available.',
      });
    }

    const links = await this.prisma.masterOptionLink.findMany({
      where: { categoryId: category.id, option: { active: true } },
      include: { option: true },
    });
    const itemTypes: string[] = [];
    const qualities: string[] = [];
    const sizes: string[] = [];
    for (const link of links) {
      const label = link.option.label;
      if (link.option.kind === MasterOptionKind.ItemType) itemTypes.push(label);
      else if (link.option.kind === MasterOptionKind.Quality) qualities.push(label);
      else if (link.option.kind === MasterOptionKind.Size) sizes.push(label);
    }

    if (companyId) {
      const custom = await this.prisma.companyCustomTag.findMany({
        where: {
          companyId,
          OR: [{ masterCategoryId: category.id }, { masterCategoryId: null }],
        },
      });
      for (const tag of custom) {
        if (tag.kind === MasterOptionKind.ItemType && !itemTypes.includes(tag.label)) {
          itemTypes.push(tag.label);
        } else if (tag.kind === MasterOptionKind.Quality && !qualities.includes(tag.label)) {
          qualities.push(tag.label);
        } else if (tag.kind === MasterOptionKind.Size && !sizes.includes(tag.label)) {
          sizes.push(tag.label);
        }
      }
    }

    const unitRows = await this.prisma.categoryUnit.findMany({
      where: { categoryId: category.id },
      orderBy: { unit: 'asc' },
    });

    return {
      category: {
        id: category.id,
        slug: category.slug,
        label: category.label,
        active: category.active,
        sortOrder: category.sortOrder,
      },
      itemTypes: itemTypes.sort((a, b) => a.localeCompare(b)),
      qualities: qualities.sort((a, b) => a.localeCompare(b)),
      sizes: sizes.sort((a, b) => a.localeCompare(b)),
      units: unitRows.map((u) => u.unit),
    };
  }

  async listCustomTags(companyId: string, kind?: OptionKind): Promise<CompanyCustomTagView[]> {
    const rows = await this.prisma.companyCustomTag.findMany({
      where: { companyId, ...(kind ? { kind } : {}) },
      orderBy: { label: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      companyId: row.companyId,
      kind: row.kind,
      label: row.label,
      masterCategoryId: row.masterCategoryId,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createCustomTag(
    companyId: string,
    dto: CreateCompanyCustomTagDto,
  ): Promise<CompanyCustomTagView> {
    const parsed = createCompanyCustomTagSchema.parse(dto);
    const label = parsed.label.trim();
    const existing = await this.prisma.companyCustomTag.findFirst({
      where: {
        companyId,
        kind: parsed.kind,
        masterCategoryId: parsed.masterCategoryId ?? null,
        label: { equals: label, mode: 'insensitive' },
      },
    });
    if (existing) {
      return {
        id: existing.id,
        companyId: existing.companyId,
        kind: existing.kind,
        label: existing.label,
        masterCategoryId: existing.masterCategoryId,
        createdAt: existing.createdAt.toISOString(),
      };
    }

    const count = await this.prisma.companyCustomTag.count({ where: { companyId } });
    if (count >= COMPANY_TAG_CAP) {
      throw new BadRequestException({
        code: 'TAG_LIMIT',
        message: `You can add up to ${COMPANY_TAG_CAP} custom tags.`,
      });
    }

    const row = await this.prisma.companyCustomTag.create({
      data: {
        companyId,
        kind: parsed.kind,
        label,
        masterCategoryId: parsed.masterCategoryId ?? null,
      },
    });
    return {
      id: row.id,
      companyId: row.companyId,
      kind: row.kind,
      label: row.label,
      masterCategoryId: row.masterCategoryId,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async assertCategoryUnits(categoryId: string | null | undefined, unit: string | null | undefined) {
    if (!categoryId || !unit) return;
    const allowed = await this.prisma.categoryUnit.findFirst({
      where: { categoryId, unit },
    });
    if (!allowed) {
      throw new BadRequestException({
        code: 'UNIT_NOT_ALLOWED',
        message: 'That unit is not allowed for this category.',
      });
    }
  }

  /**
   * Resolve Master Category for a collection create/update.
   * `required: false` — Repost / curate from a peer post: category is the supplier’s
   * job on the source; do not block publish for a missing pick.
   */
  async resolveCategoryIdForCompany(
    companyId: string,
    masterCategoryId: string | null | undefined,
    opts?: { required?: boolean },
  ): Promise<string | null> {
    const required = opts?.required !== false;
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { masterCategories: true },
    });
    const slugs = company?.masterCategories ?? [];

    if (!masterCategoryId) {
      if (slugs.length === 1) {
        const row = await this.prisma.masterCategory.findUnique({
          where: { slug: slugs[0] },
        });
        return row?.id ?? null;
      }
      if (!required) return null;
      throw new BadRequestException({
        code: 'CATEGORY_REQUIRED',
        message: 'Pick which category this collection is for.',
      });
    }

    const cat = await this.prisma.masterCategory.findFirst({
      where: {
        OR: [{ id: masterCategoryId }, { slug: masterCategoryId }],
        active: true,
      },
    });
    if (!cat) {
      throw new BadRequestException({
        code: 'CATEGORY_NOT_ALLOWED',
        message: 'Pick a category from the list.',
      });
    }
    return cat.id;
  }
}
