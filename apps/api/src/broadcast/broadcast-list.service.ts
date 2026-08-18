import { Injectable, NotFoundException } from '@nestjs/common';
import type { BroadcastList } from '@prisma/client';
import type { BroadcastListView, UpsertBroadcastListDto } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class BroadcastListService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: UpsertBroadcastListDto): Promise<BroadcastListView> {
    const list = await this.prisma.broadcastList.create({
      data: {
        companyId,
        name: dto.name,
        memberCompanyIds: dto.memberCompanyIds,
        defaultRateVisibility: dto.defaultRateVisibility ?? null,
        allowForward: dto.allowForward ?? null,
      },
    });
    return this.toView(list);
  }

  async list(companyId: string): Promise<BroadcastListView[]> {
    const lists = await this.prisma.broadcastList.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
    return lists.map((list) => this.toView(list));
  }

  async update(
    companyId: string,
    id: string,
    dto: UpsertBroadcastListDto,
  ): Promise<BroadcastListView> {
    await this.owned(companyId, id);
    const list = await this.prisma.broadcastList.update({
      where: { id },
      data: {
        name: dto.name,
        memberCompanyIds: dto.memberCompanyIds,
        defaultRateVisibility: dto.defaultRateVisibility ?? null,
        allowForward: dto.allowForward ?? null,
      },
    });
    return this.toView(list);
  }

  async remove(companyId: string, id: string): Promise<{ ok: true }> {
    await this.owned(companyId, id);
    await this.prisma.broadcastList.delete({ where: { id } });
    return { ok: true };
  }

  private async owned(companyId: string, id: string): Promise<BroadcastList> {
    const list = await this.prisma.broadcastList.findUnique({ where: { id } });
    if (!list || list.companyId !== companyId) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Buyer group not found.' });
    }
    return list;
  }

  private toView(list: BroadcastList): BroadcastListView {
    return {
      id: list.id,
      name: list.name,
      memberCompanyIds: list.memberCompanyIds,
      memberCount: list.memberCompanyIds.length,
      defaultRateVisibility: list.defaultRateVisibility,
      allowForward: list.allowForward,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
    };
  }
}
