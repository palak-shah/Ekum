import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionStatus, ProductStatus } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { VisibilityService } from '../access/visibility.service';
import { canDiscoverCollection } from '../catalog/audience-visibility';

export type AssertCanTradeOptions = {
  /** When set, allow trade without Connection if every product is discoverable. */
  productIds?: string[];
};

/**
 * Trade actions (orders, samples). Connection still unlocks restricted audiences;
 * open (discoverable) catalog lines can trade without an active Connection.
 * Blocked counterparties stay silent 404.
 */
@Injectable()
export class TradeAccess {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
  ) {}

  async assertCanTrade(
    buyerCompanyId: string,
    sellerCompanyId: string,
    options: AssertCanTradeOptions = {},
  ): Promise<void> {
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
    if (connected) {
      return;
    }

    const productIds = [...new Set((options.productIds ?? []).filter(Boolean))];
    if (productIds.length > 0) {
      const ok = await this.allProductsDiscoverable(buyerCompanyId, sellerCompanyId, productIds);
      if (ok) {
        return;
      }
      throw new ForbiddenException({
        code: 'CONNECTION_REQUIRED',
        message: 'Connect with this business before placing an order.',
      });
    }

    throw new ForbiddenException({
      code: 'CONNECTION_REQUIRED',
      message: 'Connect with this business before placing an order.',
    });
  }

  private async allProductsDiscoverable(
    buyerCompanyId: string,
    sellerCompanyId: string,
    productIds: string[],
  ): Promise<boolean> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, companyId: sellerCompanyId },
      select: {
        id: true,
        companyId: true,
        audience: true,
        audienceCompanyIds: true,
        status: true,
        postedToMarketAt: true,
      },
    });
    if (products.length !== productIds.length) {
      return false;
    }

    const [connection, follow] = await Promise.all([
      this.prisma.connection.findFirst({
        where: {
          ownerCompanyId: sellerCompanyId,
          viewerCompanyId: buyerCompanyId,
          status: ConnectionStatus.Active,
        },
        select: { id: true },
      }),
      this.prisma.follow.findFirst({
        where: {
          followerCompanyId: buyerCompanyId,
          followedCompanyId: sellerCompanyId,
        },
        select: { id: true },
      }),
    ]);
    const ctx = {
      connected: Boolean(connection),
      following: Boolean(follow),
    };

    return products.every((product) => {
      if (product.status !== ProductStatus.Published || !product.postedToMarketAt) {
        return false;
      }
      return canDiscoverCollection(buyerCompanyId, product, ctx);
    });
  }
}
