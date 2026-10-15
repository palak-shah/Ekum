import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  masterOptionKindValues,
  type MasterOptionKind as OptionKind,
} from '@ekum/domain-types';
import { createHash } from 'node:crypto';
import { PrismaService } from '../core/prisma/prisma.service';
import { buildBulkPreview, parseBulkTagInput } from './bulk-tag-parse';

function stableId(prefix: string, ...parts: string[]): string {
  const h = createHash('sha1').update(parts.join('\0')).digest('hex').slice(0, 20);
  return `${prefix}_${h}`;
}

@Injectable()
export class AdminTagService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: {
    q?: string;
    categoryId?: string;
    kind?: OptionKind;
    includeInactive?: boolean;
    take?: number;
    skip?: number;
  }) {
    const kind = filters.kind;
    if (kind && !masterOptionKindValues.includes(kind)) {
      throw new BadRequestException({ code: 'INVALID_KIND', message: 'Unknown option type.' });
    }

    const take = Math.min(Math.max(filters.take ?? 25, 1), 100);
    const skip = Math.max(filters.skip ?? 0, 0);

    const where = {
      ...(kind ? { kind } : {}),
      ...(filters.includeInactive ? {} : { active: true }),
      ...(filters.q?.trim()
        ? { label: { contains: filters.q.trim(), mode: 'insensitive' as const } }
        : {}),
      ...(filters.categoryId
        ? { categoryLinks: { some: { categoryId: filters.categoryId } } }
        : {}),
    };

    const [total, options] = await Promise.all([
      this.prisma.masterOption.count({ where }),
      this.prisma.masterOption.findMany({
        where,
        include: {
          categoryLinks: {
            include: { category: { select: { id: true, slug: true, label: true } } },
          },
        },
        orderBy: [{ kind: 'asc' }, { label: 'asc' }],
        take,
        skip,
      }),
    ]);

    return {
      items: options.map((row) => ({
        id: row.id,
        kind: row.kind,
        label: row.label,
        active: row.active,
        categories: row.categoryLinks.map((l) => ({
          id: l.category.id,
          slug: l.category.slug,
          label: l.category.label,
        })),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      total,
      take,
      skip,
    };
  }

  async create(dto: { categoryId: string; kind: OptionKind; label: string }) {
    const label = dto.label.trim();
    if (!label) {
      throw new BadRequestException({ code: 'INVALID_LABEL', message: 'Give this tag a name.' });
    }
    const category = await this.requireCategory(dto.categoryId);
    const existing = await this.prisma.masterOption.findFirst({
      where: {
        kind: dto.kind,
        label: { equals: label, mode: 'insensitive' },
      },
      include: { categoryLinks: true },
    });
    if (existing) {
      const linked = existing.categoryLinks.some((l) => l.categoryId === category.id);
      if (linked) {
        throw new BadRequestException({
          code: 'TAG_EXISTS',
          message: `“${existing.label}” is already in this category.`,
        });
      }
      await this.prisma.masterOptionLink.create({
        data: {
          id: stableId('lnk', category.id, existing.id),
          categoryId: category.id,
          optionId: existing.id,
        },
      });
      if (!existing.active) {
        await this.prisma.masterOption.update({
          where: { id: existing.id },
          data: { active: true },
        });
      }
      return this.getOne(existing.id);
    }

    const id = stableId('opt', dto.kind, label.toLowerCase());
    await this.prisma.$transaction(async (tx) => {
      await tx.masterOption.create({
        data: { id, kind: dto.kind, label, active: true },
      });
      await tx.masterOptionLink.create({
        data: {
          id: stableId('lnk', category.id, id),
          categoryId: category.id,
          optionId: id,
        },
      });
    });
    return this.getOne(id);
  }

  async update(id: string, dto: { label?: string; active?: boolean }) {
    const row = await this.prisma.masterOption.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({ code: 'TAG_NOT_FOUND', message: 'Tag not found.' });
    }
    const label = dto.label?.trim();
    if (label !== undefined && !label) {
      throw new BadRequestException({ code: 'INVALID_LABEL', message: 'Give this tag a name.' });
    }
    const nextLabel = label ?? row.label;
    if (label) {
      const clash = await this.prisma.masterOption.findFirst({
        where: {
          kind: row.kind,
          label: { equals: label, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (clash) {
        throw new BadRequestException({
          code: 'TAG_EXISTS',
          message: `Another ${row.kind} already uses “${clash.label}”.`,
        });
      }
    }
    // Restoring (or keeping active) must not collide with another active same-kind label.
    if (dto.active === true) {
      const activeClash = await this.prisma.masterOption.findFirst({
        where: {
          kind: row.kind,
          active: true,
          label: { equals: nextLabel, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (activeClash) {
        throw new BadRequestException({
          code: 'TAG_EXISTS',
          message: `An active ${row.kind} already uses “${activeClash.label}”. Rename or archive that one first.`,
        });
      }
    }
    await this.prisma.masterOption.update({
      where: { id },
      data: {
        ...(label !== undefined ? { label } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
    return this.getOne(id);
  }

  async archive(id: string) {
    return this.update(id, { active: false });
  }

  async restore(id: string) {
    return this.update(id, { active: true });
  }

  async remove(id: string) {
    const row = await this.prisma.masterOption.findUnique({
      where: { id },
      include: { categoryLinks: true },
    });
    if (!row) {
      throw new NotFoundException({ code: 'TAG_NOT_FOUND', message: 'Tag not found.' });
    }
    // Collections store label snapshots — soft-archive is preferred. Hard delete
    // only when not linked to multiple categories and admin confirms.
    await this.prisma.$transaction(async (tx) => {
      await tx.masterOptionLink.deleteMany({ where: { optionId: id } });
      await tx.masterOption.delete({ where: { id } });
    });
    return { deleted: true, id };
  }

  async bulkPreview(dto: { categoryId: string; kind: OptionKind; text: string }) {
    const category = await this.requireCategory(dto.categoryId);
    if (!masterOptionKindValues.includes(dto.kind)) {
      throw new BadRequestException({ code: 'INVALID_KIND', message: 'Unknown option type.' });
    }
    const labels = parseBulkTagInput(dto.text);
    const linked = await this.prisma.masterOptionLink.findMany({
      where: { categoryId: category.id, option: { kind: dto.kind } },
      include: { option: true },
    });
    const existingLower = new Set(linked.map((l) => l.option.label.toLowerCase()));
    const rows = buildBulkPreview(labels, existingLower);
    return {
      categoryId: category.id,
      kind: dto.kind,
      rows,
      summary: {
        new: rows.filter((r) => r.status === 'new').length,
        existing: rows.filter((r) => r.status === 'existing').length,
        duplicateInPaste: rows.filter((r) => r.status === 'duplicate_in_paste').length,
        invalid: rows.filter((r) => r.status === 'invalid').length,
      },
    };
  }

  async bulkCommit(dto: {
    categoryId: string;
    kind: OptionKind;
    labels: string[];
  }) {
    const preview = await this.bulkPreview({
      categoryId: dto.categoryId,
      kind: dto.kind,
      text: dto.labels.join('\n'),
    });
    const toCreate = preview.rows.filter((r) => r.status === 'new').map((r) => r.label);
    let created = 0;
    // Atomic: any per-label failure aborts the transaction (do not swallow errors).
    await this.prisma.$transaction(async (tx) => {
      for (const label of toCreate) {
        const existing = await tx.masterOption.findFirst({
          where: {
            kind: dto.kind,
            label: { equals: label, mode: 'insensitive' },
          },
        });
        let optionId = existing?.id;
        if (!optionId) {
          optionId = stableId('opt', dto.kind, label.toLowerCase());
          await tx.masterOption.create({
            data: { id: optionId, kind: dto.kind, label, active: true },
          });
        }
        await tx.masterOptionLink.upsert({
          where: {
            categoryId_optionId: {
              categoryId: dto.categoryId,
              optionId,
            },
          },
          create: {
            id: stableId('lnk', dto.categoryId, optionId),
            categoryId: dto.categoryId,
            optionId,
          },
          update: {},
        });
        created += 1;
      }
    });
    return {
      created,
      skippedDuplicates:
        preview.summary.existing + preview.summary.duplicateInPaste,
      invalid: preview.summary.invalid,
      failed: 0,
    };
  }

  private async getOne(id: string) {
    const row = await this.prisma.masterOption.findUniqueOrThrow({
      where: { id },
      include: {
        categoryLinks: {
          include: { category: { select: { id: true, slug: true, label: true } } },
        },
      },
    });
    return {
      id: row.id,
      kind: row.kind,
      label: row.label,
      active: row.active,
      categories: row.categoryLinks.map((l) => ({
        id: l.category.id,
        slug: l.category.slug,
        label: l.category.label,
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async requireCategory(categoryId: string) {
    const category = await this.prisma.masterCategory.findFirst({
      where: { OR: [{ id: categoryId }, { slug: categoryId }] },
    });
    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Master category not found.',
      });
    }
    return category;
  }
}
