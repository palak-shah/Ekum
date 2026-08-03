import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { VisibilityService } from '../access/visibility.service';

/**
 * Trade actions (orders, samples) are only possible between actively connected
 * companies. A seller that has blocked the buyer is silently invisible (404),
 * never a 403 that would confirm the block.
 */
@Injectable()
export class TradeAccess {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
  ) {}

  async assertCanTrade(buyerCompanyId: string, sellerCompanyId: string): Promise<void> {
    if (buyerCompanyId === sellerCompanyId) {
      throw new BadRequestException({
        code: 'INVALID_TARGET',
        message: 'You cannot place an order with your own business.',
      });
    }
    const seller = await this.prisma.company.findUnique({
      where: { id: sellerCompanyId },
      select: { id: true },
    });
    if (!seller || (await this.visibility.isBlocked(buyerCompanyId, sellerCompanyId))) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Business not found.' });
    }

    const connected =
      (await this.visibility.canViewCatalog(buyerCompanyId, sellerCompanyId)) ||
      (await this.visibility.canViewCatalog(sellerCompanyId, buyerCompanyId));
    if (!connected) {
      throw new ForbiddenException({
        code: 'CONNECTION_REQUIRED',
        message: 'Connect with this business before placing an order.',
      });
    }
  }
}
