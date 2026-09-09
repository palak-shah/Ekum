import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  TradeLaneTicket,
  type ListTradeLanesQuery,
  type TradeLaneView,
  type UpdateTradeLaneDto,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { resolveTradePresence } from '../identity/trade-presence';
import { ThreadService } from '../conversation/thread.service';
import { effectivePathFromLane } from './trade-lane';

@Injectable()
export class TradeLaneService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly threads: ThreadService,
  ) {}

  private async assertTrading(companyId: string): Promise<void> {
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId },
      select: { tradeDefaults: true },
    });
    if (!resolveTradePresence(settings?.tradeDefaults).trading) {
      throw new ForbiddenException({
        code: 'TRADING_REQUIRED',
        message: 'Turn on Trading in Profile to manage paths.',
      });
    }
  }

  async list(traderCompanyId: string, query: ListTradeLanesQuery): Promise<TradeLaneView[]> {
    await this.assertTrading(traderCompanyId);
    const q = query.q?.trim();
    const rows = await this.prisma.tradeLane.findMany({
      where: {
        traderCompanyId,
        ...(q
          ? {
              OR: [
                { seller: { name: { contains: q, mode: 'insensitive' } } },
                { buyer: { name: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        seller: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    return rows.map((row) => this.toView(row));
  }

  async update(
    traderCompanyId: string,
    id: string,
    dto: UpdateTradeLaneDto,
  ): Promise<TradeLaneView> {
    await this.assertTrading(traderCompanyId);
    const existing = await this.prisma.tradeLane.findFirst({
      where: { id, traderCompanyId },
      include: {
        seller: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Path not found.' });
    }
    if (dto.ticket === undefined && dto.reveal === undefined) {
      throw new BadRequestException({
        code: 'INVALID',
        message: 'Set order-with or see-each-other.',
      });
    }

    let groupThreadId = existing.groupThreadId;
    if (dto.reveal === true) {
      groupThreadId = await this.threads.ensureTradeLaneGroup(
        existing.traderCompanyId,
        existing.sellerCompanyId,
        existing.buyerCompanyId,
        existing.groupThreadId,
      );
    }

    const updated = await this.prisma.tradeLane.update({
      where: { id },
      data: {
        ...(dto.ticket !== undefined ? { ticket: dto.ticket } : {}),
        ...(dto.reveal !== undefined ? { reveal: dto.reveal } : {}),
        ...(groupThreadId && groupThreadId !== existing.groupThreadId
          ? { groupThreadId }
          : {}),
      },
      include: {
        seller: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true } },
      },
    });
    return this.toView(updated);
  }

  async pathForPair(
    traderCompanyId: string,
    sellerCompanyId: string,
    buyerCompanyId: string,
  ): Promise<'handle' | 'direct'> {
    const lane = await this.prisma.tradeLane.findUnique({
      where: {
        traderCompanyId_sellerCompanyId_buyerCompanyId: {
          traderCompanyId,
          sellerCompanyId,
          buyerCompanyId,
        },
      },
      select: { ticket: true },
    });
    return effectivePathFromLane(lane?.ticket);
  }

  private toView(row: {
    id: string;
    traderCompanyId: string;
    sellerCompanyId: string;
    buyerCompanyId: string;
    ticket: string;
    reveal: boolean;
    updatedAt: Date;
    seller: { id: string; name: string };
    buyer: { id: string; name: string };
  }): TradeLaneView {
    return {
      id: row.id,
      traderCompanyId: row.traderCompanyId,
      sellerCompanyId: row.sellerCompanyId,
      buyerCompanyId: row.buyerCompanyId,
      sellerName: row.seller.name,
      buyerName: row.buyer.name,
      ticket: row.ticket === TradeLaneTicket.Mill ? 'mill' : 'me',
      reveal: row.reveal,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
