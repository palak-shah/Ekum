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
  permissions: null,
  isPlatformAdmin: false,
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

function setup(connection: ConnRow | null, options?: { ownBlock?: boolean; theirBlock?: boolean }) {
  const ownBlock = options?.ownBlock ?? false;
  const theirBlock = options?.theirBlock ?? false;
  const companyBlocks: Array<{ blockerCompanyId: string; blockedCompanyId: string }> = [];
  if (ownBlock && connection) {
    companyBlocks.push({ blockerCompanyId: 'co-a', blockedCompanyId: 'co-b' });
  }
  if (theirBlock && connection) {
    companyBlocks.push({ blockerCompanyId: 'co-b', blockedCompanyId: 'co-a' });
  }

  const findUniqueOrThrow = vi.fn(async () => ({
    id: 'conn-1',
    companyLowId: 'co-a',
    companyHighId: 'co-b',
    status: ConnectionStatus.Active,
    statusSetByCompanyId: null,
    createdAt: new Date(),
    companyLow: summary('co-a'),
    companyHigh: summary('co-b'),
  }));
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
      findUniqueOrThrow,
      update,
      create: vi.fn(async () => ({})),
    },
    companyBlock: {
      findUnique: async ({
        where,
      }: {
        where: {
          blockerCompanyId_blockedCompanyId: {
            blockerCompanyId: string;
            blockedCompanyId: string;
          };
        };
      }) => {
        const hit = companyBlocks.find(
          (row) =>
            row.blockerCompanyId === where.blockerCompanyId_blockedCompanyId.blockerCompanyId &&
            row.blockedCompanyId === where.blockerCompanyId_blockedCompanyId.blockedCompanyId,
        );
        return hit ? { id: 'edge-1' } : null;
      },
      count: async ({
        where,
      }: {
        where: { OR: Array<{ blockerCompanyId: string; blockedCompanyId: string }> };
      }) =>
        where.OR.filter((clause) =>
          companyBlocks.some(
            (row) =>
              row.blockerCompanyId === clause.blockerCompanyId &&
              row.blockedCompanyId === clause.blockedCompanyId,
          ),
        ).length,
      create: async ({
        data,
      }: {
        data: { blockerCompanyId: string; blockedCompanyId: string };
      }) => {
        companyBlocks.push(data);
        return { id: 'edge-new', ...data };
      },
      deleteMany: async ({
        where,
      }: {
        where: { blockerCompanyId: string; blockedCompanyId: string };
      }) => {
        const before = companyBlocks.length;
        for (let i = companyBlocks.length - 1; i >= 0; i -= 1) {
          const row = companyBlocks[i]!;
          if (
            row.blockerCompanyId === where.blockerCompanyId &&
            row.blockedCompanyId === where.blockedCompanyId
          ) {
            companyBlocks.splice(i, 1);
          }
        }
        return { count: before - companyBlocks.length };
      },
      findMany: async () => companyBlocks.map((row) => ({ ...row })),
    },
    tradeLane: {
      findMany: vi.fn(async () => []),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
    follow: { deleteMany: vi.fn(async () => ({ count: 0 })) },
    thread: { updateMany: vi.fn(async () => ({ count: 0 })) },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
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
  return { service, update, audit, prisma, companyBlocks, findUniqueOrThrow };
}

describe('ConnectionService.applyOwnerAction bilateral', () => {
  it('refuses to pause', async () => {
    const { service, update } = setup({
      id: 'conn-1',
      companyLowId: 'co-a',
      companyHighId: 'co-b',
      status: ConnectionStatus.Active,
      statusSetByCompanyId: null,
    });
    await expect(service.applyOwnerAction('co-a', 'conn-1', 'pause', actor)).rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
  });

  it('block inserts own CompanyBlock and wipes Follows on first edge', async () => {
    const { service, prisma, companyBlocks } = setup({
      id: 'conn-1',
      companyLowId: 'co-a',
      companyHighId: 'co-b',
      status: ConnectionStatus.Active,
      statusSetByCompanyId: null,
    });
    const view = await service.applyOwnerAction('co-a', 'conn-1', 'block', actor);
    expect(companyBlocks).toEqual([{ blockerCompanyId: 'co-a', blockedCompanyId: 'co-b' }]);
    expect(prisma.follow.deleteMany).toHaveBeenCalled();
    expect(view.status).toBe(ConnectionStatus.Blocked);
    expect(view.canUnblock).toBe(true);
    expect(view.canBlock).toBe(false);
  });

  it('second Block adds second edge without Follow wipe', async () => {
    const { service, prisma, companyBlocks } = setup(
      {
        id: 'conn-1',
        companyLowId: 'co-a',
        companyHighId: 'co-b',
        status: ConnectionStatus.Active,
        statusSetByCompanyId: null,
      },
      { theirBlock: true },
    );
    await service.applyOwnerAction('co-a', 'conn-1', 'block', actor);
    expect(companyBlocks).toEqual(
      expect.arrayContaining([
        { blockerCompanyId: 'co-b', blockedCompanyId: 'co-a' },
        { blockerCompanyId: 'co-a', blockedCompanyId: 'co-b' },
      ]),
    );
    expect(prisma.follow.deleteMany).not.toHaveBeenCalled();
  });

  it('allows Unblock of own edge only', async () => {
    const { service, companyBlocks } = setup(
      {
        id: 'conn-1',
        companyLowId: 'co-a',
        companyHighId: 'co-b',
        status: ConnectionStatus.Active,
        statusSetByCompanyId: null,
      },
      { ownBlock: true, theirBlock: true },
    );
    await service.applyOwnerAction('co-a', 'conn-1', 'unblock', actor);
    expect(companyBlocks).toEqual([{ blockerCompanyId: 'co-b', blockedCompanyId: 'co-a' }]);
  });

  it('hides Unblock when caller has no edge', async () => {
    const { service } = setup(
      {
        id: 'conn-1',
        companyLowId: 'co-a',
        companyHighId: 'co-b',
        status: ConnectionStatus.Active,
        statusSetByCompanyId: null,
      },
      { theirBlock: true },
    );
    await expect(service.applyOwnerAction('co-a', 'conn-1', 'unblock', actor)).rejects.toThrow();
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
});

describe('ConnectionService.list silent masking', () => {
  it('shows my block + pause + clear active; hides their-only block', async () => {
    const rows = [
      {
        id: 'i-blocked',
        companyLowId: 'me',
        companyHighId: 'x',
        status: ConnectionStatus.Active,
        statusSetByCompanyId: null,
        createdAt: new Date(),
        companyLow: summary('me'),
        companyHigh: summary('x'),
      },
      {
        id: 'they-blocked',
        companyLowId: 'me',
        companyHighId: 'y',
        status: ConnectionStatus.Active,
        statusSetByCompanyId: null,
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
      companyBlock: {
        findMany: async ({ where }: { where: { blockerCompanyId?: string; blockedCompanyId?: string } }) => {
          if (where.blockerCompanyId === 'me') {
            return [{ blockedCompanyId: 'x' }];
          }
          if (where.blockedCompanyId === 'me') {
            return [{ blockerCompanyId: 'y' }];
          }
          return [];
        },
      },
    } as unknown as PrismaService;
    const audit = { record: vi.fn() } as unknown as AuditService;
    const serializer = {
      toPublicSummary: (company: { id: string }) => summary(company.id),
    };
    const service = new ConnectionService(prisma, audit, serializer as never);

    const result = await service.list('me');
    expect(result.map((view) => view.id)).toEqual(['i-blocked', 'paused-by-me', 'active']);
    expect(result.find((view) => view.id === 'i-blocked')?.canUnblock).toBe(true);
    expect(result.find((view) => view.id === 'i-blocked')?.status).toBe(ConnectionStatus.Blocked);
    expect(result.find((view) => view.id === 'paused-by-me')?.canResume).toBe(true);
    expect(result.find((view) => view.id === 'active')?.canBlock).toBe(true);
  });
});
