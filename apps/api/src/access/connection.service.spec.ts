import { describe, expect, it, vi } from 'vitest';
import { ConnectionStatus } from '@ekum/domain-types';
import { ConnectionService } from './connection.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { AuthPrincipal } from '../auth/auth.types';

const actor: AuthPrincipal = {
  userId: 'user-1',
  phone: '+910000000000',
  companyId: 'owner',
  role: 'owner',
};

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

describe('ConnectionService.list silent-block masking', () => {
  it('hides paused/blocked connections from the viewer but not from the owner', async () => {
    const summary = (id: string) => ({ id, name: id, city: 'Surat', verification: 'not_verified' });
    const rows = [
      // Caller is the owner here — a blocked connection stays visible to them.
      {
        id: 'owned-blocked',
        ownerCompanyId: 'me',
        viewerCompanyId: 'x',
        status: ConnectionStatus.Blocked,
        createdAt: new Date(),
        owner: summary('me'),
        viewer: summary('x'),
      },
      // Caller is the viewer here — a blocked connection must be hidden.
      {
        id: 'viewer-blocked',
        ownerCompanyId: 'y',
        viewerCompanyId: 'me',
        status: ConnectionStatus.Blocked,
        createdAt: new Date(),
        owner: summary('y'),
        viewer: summary('me'),
      },
      // Caller is the viewer of an active connection — visible.
      {
        id: 'viewer-active',
        ownerCompanyId: 'z',
        viewerCompanyId: 'me',
        status: ConnectionStatus.Active,
        createdAt: new Date(),
        owner: summary('z'),
        viewer: summary('me'),
      },
    ];
    const prisma = {
      connection: { findMany: async () => rows },
    } as unknown as PrismaService;
    const audit = { record: vi.fn() } as unknown as AuditService;
    const serializer = {
      toPublicSummary: (company: { id: string }) => summary(company.id),
    };
    const service = new ConnectionService(prisma, audit, serializer as never);

    const result = await service.list('me');
    expect(result.map((view) => view.id)).toEqual(['owned-blocked', 'viewer-active']);
  });
});
