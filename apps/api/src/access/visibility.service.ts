import { Injectable } from '@nestjs/common';
import { ConnectionStatus } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { connectionPairWhere } from './connection-pair';

/**
 * The one place that answers "can company A see this thing belonging to company
 * B". Every other domain calls this rather than reimplementing visibility. It
 * changes what data is returned, so it lives in the service layer, not a route
 * guard.
 */
@Injectable()
export class VisibilityService {
  constructor(private readonly prisma: PrismaService) {}

  /** True when the viewer may see the owner's controlled catalogue. */
  async canViewCatalog(viewerCompanyId: string, ownerCompanyId: string): Promise<boolean> {
    if (viewerCompanyId === ownerCompanyId) {
      return true;
    }
    const connection = await this.findConnection(viewerCompanyId, ownerCompanyId);
    return connection?.status === ConnectionStatus.Active;
  }

  /**
   * True when either side has blocked the other. Because blocking is silent, the
   * API responds 404 (not 403) to a blocked party so the block is never confirmed.
   */
  async isBlocked(viewerCompanyId: string, ownerCompanyId: string): Promise<boolean> {
    if (viewerCompanyId === ownerCompanyId) {
      return false;
    }
    const connection = await this.findConnection(viewerCompanyId, ownerCompanyId);
    return connection?.status === ConnectionStatus.Blocked;
  }

  private findConnection(a: string, b: string) {
    return this.prisma.connection.findUnique({
      where: { companyLowId_companyHighId: connectionPairWhere(a, b) },
    });
  }
}
