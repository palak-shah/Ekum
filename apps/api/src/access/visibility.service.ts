import { Injectable } from '@nestjs/common';
import { ConnectionStatus } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';

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
    const connection = await this.findConnection(ownerCompanyId, viewerCompanyId);
    return connection?.status === ConnectionStatus.Active;
  }

  /**
   * True when the owner has blocked the viewer. Because blocking is silent, the
   * API responds 404 (not 403) to a blocked party so the block is never confirmed.
   */
  async isBlocked(viewerCompanyId: string, ownerCompanyId: string): Promise<boolean> {
    if (viewerCompanyId === ownerCompanyId) {
      return false;
    }
    const connection = await this.findConnection(ownerCompanyId, viewerCompanyId);
    return connection?.status === ConnectionStatus.Blocked;
  }

  private findConnection(ownerCompanyId: string, viewerCompanyId: string) {
    return this.prisma.connection.findUnique({
      where: { ownerCompanyId_viewerCompanyId: { ownerCompanyId, viewerCompanyId } },
    });
  }
}
