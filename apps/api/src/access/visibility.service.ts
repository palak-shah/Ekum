import { Injectable } from '@nestjs/common';
import { ConnectionStatus } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { pairHasBlock } from './company-block';
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
    return this.isActiveConnection(viewerCompanyId, ownerCompanyId);
  }

  async isActiveConnection(viewerCompanyId: string, ownerCompanyId: string): Promise<boolean> {
    if (viewerCompanyId === ownerCompanyId) {
      return false;
    }
    const connection = await this.findConnection(viewerCompanyId, ownerCompanyId);
    return connection?.status === ConnectionStatus.Active;
  }

  /**
   * True when either side has a directed block (or legacy Connection blocked).
   * Silent: callers respond 404 so the block is never confirmed.
   */
  async isBlocked(viewerCompanyId: string, ownerCompanyId: string): Promise<boolean> {
    if (viewerCompanyId === ownerCompanyId) {
      return false;
    }
    return pairHasBlock(this.prisma, viewerCompanyId, ownerCompanyId);
  }

  private findConnection(a: string, b: string) {
    return this.prisma.connection.findUnique({
      where: { companyLowId_companyHighId: connectionPairWhere(a, b) },
    });
  }
}
