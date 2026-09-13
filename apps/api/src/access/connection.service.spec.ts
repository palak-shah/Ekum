import { describe, expect, it, vi } from 'vitest';
import { ConnectionStatus } from '@ekum/domain-types';
import { ConnectionService } from './connection.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { AuthPrincipal } from '../auth/auth.types';

const actor: AuthPrincipal = {
  userId: 'user-1',
  phone: '+910000000000',
  companyId: 'co-a',
  role: 'owner',
};

const summary = (id: string) => ({
  id,
  name: id,
  city: 'Surat',
  verification: 'not_verified',
  logoUrl: null as string | null,
});

type ConnRow = {
  id: string;
  companyLowId: string;
  companyHighId: string;
  status: string;
  statusSetByCompanyId: string | null;
  companyLow?: ReturnType<typeof summary>;
  companyHigh?: ReturnType<typeof summary>;
};

function setup(connection: ConnRow | null) {
  const update = vi.fn(async (_args: unknown) => ({
    id: 'conn-1',
    companyLowId: 'co-a',
    companyHighId: 'co-b',
    status: ConnectionStatus.Active,
    statusSetByCompanyId: null,
    createdAt: new Date(),
    companyLow: summary('co-a'),
    companyHigh: summary('co-b'),
  }));
  const prisma = {
    connection: {
      findUnique: async () =>
        connection
          ? {
              ...connection,
              companyLow: connection.companyLow ?? summary(connection.companyLowId),
              companyHigh: connection.companyHigh ?? summary(connection.companyHighId),
            }
          : null,
      update,
    },
  } as unknown as PrismaService;
  const audit = { record: vi.fn(async () => undefined) } as unknown as AuditService;
  const serializer = {
    toPublicSummary: (company: { id: string; name: string; city: string; verification: string }) => ({
      id: company.id,
      name: company.name,
      city: company.city,
      verification: company.verification,
      logoUrl: null,
    }),
  };
  const service = new ConnectionService(prisma, audit, serializer as never);
  return { service, update, audit };
}

describe('ConnectionService.applyOwnerAction', () => {
  it('refuses to pause a blocked connection', async () => {
    const { service, update } = setup({
      id: 'conn-1',
      companyLowId: 'co-a',
      companyHighId: 'co-b',
      status: ConnectionStatus.Blocked,
      statusSetByCompanyId: 'co-a',
    });
    await expect(service.applyOwnerAction('co-a', 'conn-1', 'pause', actor)).rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
  });

  it('allows the blocker to unblock', async () => {
    const { service, update, audit } = setup({
      id: 'conn-1',
      companyLowId: 'co-a',
      companyHighId: 'co-b',
      status: ConnectionStatus.Blocked,
      statusSetByCompanyId: 'co-a',
    });
    await service.applyOwnerAction('co-a', 'conn-1', 'unblock', actor);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: ConnectionStatus.Active, statusSetByCompanyId: null },
      }),
    );
    expect(audit.record).toHaveBeenCalled();
  });

  it('hides unblock from the non-actor', async () => {
    const { service } = setup({
      id: 'conn-1',
      companyLowId: 'co-a',
      companyHighId: 'co-b',
      status: ConnectionStatus.Blocked,
      statusSetByCompanyId: 'co-b',
    });
    await expect(service.applyOwnerAction('co-a', 'conn-1', 'unblock', actor)).rejects.toThrow();
  });

  it('allows either side to pause an active connection', async () => {
    const { service, update } = setup({
      id: 'conn-1',
      companyLowId: 'co-a',
      companyHighId: 'co-b',
      status: ConnectionStatus.Active,
      statusSetByCompanyId: null,
    });
    await service.applyOwnerAction('co-a', 'conn-1', 'pause', actor);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: ConnectionStatus.Paused, statusSetByCompanyId: 'co-a' },
      }),
    );
  });

  it('allows only the pauser to resume', async () => {
    const { service, update } = setup({
      id: 'conn-1',
      companyLowId: 'co-a',
      companyHighId: 'co-b',
      status: ConnectionStatus.Paused,
      statusSetByCompanyId: 'co-a',
    });
    await service.applyOwnerAction('co-a', 'conn-1', 'resume', actor);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: ConnectionStatus.Active, statusSetByCompanyId: null },
      }),
    );
  });

  it('hides resume from the non-actor', async () => {
    const { service, update } = setup({
      id: 'conn-1',
      companyLowId: 'co-a',
      companyHighId: 'co-b',
      status: ConnectionStatus.Paused,
      statusSetByCompanyId: 'co-b',
    });
    await expect(service.applyOwnerAction('co-a', 'conn-1', 'resume', actor)).rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
  });

  it('hides connections the caller is not on', async () => {
    const { service } = setup({
      id: 'conn-1',
      companyLowId: 'other-a',
      companyHighId: 'other-b',
      status: ConnectionStatus.Active,
      statusSetByCompanyId: null,
    });
    await expect(service.applyOwnerAction('co-a', 'conn-1', 'pause', actor)).rejects.toThrow();
  });
});

describe('ConnectionService.list silent masking', () => {
  it('shows paused/blocked only to the actor; active to both', async () => {
    const rows = [
      {
        id: 'blocked-by-me',
        companyLowId: 'me',
        companyHighId: 'x',
        status: ConnectionStatus.Blocked,
        statusSetByCompanyId: 'me',
        createdAt: new Date(),
        companyLow: summary('me'),
        companyHigh: summary('x'),
      },
      {
        id: 'blocked-by-other',
        companyLowId: 'me',
        companyHighId: 'y',
        status: ConnectionStatus.Blocked,
        statusSetByCompanyId: 'y',
        createdAt: new Date(),
        companyLow: summary('me'),
        companyHigh: summary('y'),
      },
      {
        id: 'paused-by-me',
        companyLowId: 'me',
        companyHighId: 'p',
        status: ConnectionStatus.Paused,
        statusSetByCompanyId: 'me',
        createdAt: new Date(),
        companyLow: summary('me'),
        companyHigh: summary('p'),
      },
      {
        id: 'paused-by-other',
        companyLowId: 'me',
        companyHighId: 'q',
        status: ConnectionStatus.Paused,
        statusSetByCompanyId: 'q',
        createdAt: new Date(),
        companyLow: summary('me'),
        companyHigh: summary('q'),
      },
      {
        id: 'active',
        companyLowId: 'me',
        companyHighId: 'z',
        status: ConnectionStatus.Active,
        statusSetByCompanyId: null,
        createdAt: new Date(),
        companyLow: summary('me'),
        companyHigh: summary('z'),
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
    expect(result.map((view) => view.id)).toEqual(['blocked-by-me', 'paused-by-me', 'active']);
    expect(result.find((view) => view.id === 'blocked-by-me')?.canUnblock).toBe(true);
    expect(result.find((view) => view.id === 'paused-by-me')?.canResume).toBe(true);
    expect(result.find((view) => view.id === 'active')?.canPause).toBe(true);
  });
});
