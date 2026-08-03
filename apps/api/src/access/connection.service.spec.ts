import { describe, expect, it, vi } from 'vitest';
import { ConnectionStatus } from '@ekum/domain-types';
import { ConnectionService } from './connection.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { AuthPrincipal } from '../auth/auth.types';

const actor: AuthPrincipal = { userId: 'user-1', phone: '+910000000000', companyId: 'owner' };

function setup(connection: { id: string; ownerCompanyId: string; status: string } | null) {
  const update = vi.fn(async () => ({
    id: 'conn-1',
    status: ConnectionStatus.Active,
    createdAt: new Date(),
    viewer: { id: 'viewer-1', name: 'Viewer Co', city: 'Surat', verification: 'not_verified' },
  }));
  const prisma = {
    connection: { findUnique: async () => connection, update },
  } as unknown as PrismaService;
  const audit = { record: vi.fn(async () => undefined) } as unknown as AuditService;
  const serializer = {
    toPublicSummary: (company: { id: string; name: string; city: string; verification: string }) => ({
      id: company.id,
      name: company.name,
      city: company.city,
      verification: company.verification,
    }),
  };
  const service = new ConnectionService(prisma, audit, serializer as never);
  return { service, update, audit };
}

describe('ConnectionService.applyOwnerAction', () => {
  it('refuses to pause a blocked connection (block stays until explicit unblock)', async () => {
    const { service, update } = setup({
      id: 'conn-1',
      ownerCompanyId: 'owner',
      status: ConnectionStatus.Blocked,
    });
    await expect(service.applyOwnerAction('owner', 'conn-1', 'pause', actor)).rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
  });

  it('allows unblocking a blocked connection', async () => {
    const { service, update, audit } = setup({
      id: 'conn-1',
      ownerCompanyId: 'owner',
      status: ConnectionStatus.Blocked,
    });
    await service.applyOwnerAction('owner', 'conn-1', 'unblock', actor);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: ConnectionStatus.Active } }),
    );
    expect(audit.record).toHaveBeenCalled();
  });

  it('hides connections the caller does not own', async () => {
    const { service } = setup({
      id: 'conn-1',
      ownerCompanyId: 'someone-else',
      status: ConnectionStatus.Active,
    });
    await expect(service.applyOwnerAction('owner', 'conn-1', 'pause', actor)).rejects.toThrow();
  });
});
