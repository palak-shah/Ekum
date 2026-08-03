import { describe, expect, it, vi } from 'vitest';
import { AccessRequestStatus, ConnectionStatus } from '@ekum/domain-types';
import { AccessService } from './access.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { CompanySerializer } from './company.serializer';
import type { AuthPrincipal } from '../auth/auth.types';

const actor: AuthPrincipal = { userId: 'user-1', phone: '+910000000000', companyId: 'owner' };

describe('AccessService.approve', () => {
  it('does not reactivate a blocked connection', async () => {
    const transaction = vi.fn(async () => []);
    const prisma = {
      accessRequest: {
        findUnique: async () => ({
          id: 'req-1',
          targetCompanyId: 'owner',
          requesterCompanyId: 'viewer',
          status: AccessRequestStatus.Pending,
        }),
      },
      connection: {
        findUnique: async () => ({ status: ConnectionStatus.Blocked }),
      },
      $transaction: transaction,
    } as unknown as PrismaService;
    const audit = { record: vi.fn(async () => undefined) } as unknown as AuditService;
    const serializer = {} as unknown as CompanySerializer;

    const service = new AccessService(prisma, audit, serializer);
    await expect(service.approve('owner', 'req-1', actor)).rejects.toThrow();
    expect(transaction).not.toHaveBeenCalled();
  });
});
