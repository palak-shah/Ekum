import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { AccessRequestStatus, ConnectionStatus } from '@ekum/domain-types';
import { AccessService } from './access.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { CompanySerializer } from './company.serializer';
import type { AuthPrincipal } from '../auth/auth.types';
import type { DomainEvents } from '../events/events.module';

const actor: AuthPrincipal = {
  userId: 'user-1',
  phone: '+910000000000',
  companyId: 'owner',
  role: 'owner',
  permissions: null,
  isPlatformAdmin: false,
};

const events = { accessApproved: vi.fn() } as unknown as DomainEvents;
const threads = {
  openAccessRequestThread: vi.fn(async () => 'thread-1'),
  activateDirectParticipants: vi.fn(async () => undefined),
};

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
        findUnique: async () => ({ status: ConnectionStatus.Active }),
      },
      companyBlock: { count: async () => 1 },
      $transaction: transaction,
    } as unknown as PrismaService;
    const audit = { record: vi.fn(async () => undefined) } as unknown as AuditService;
    const serializer = {} as unknown as CompanySerializer;

    const service = new AccessService(prisma, audit, serializer, events, threads as never);
    await expect(service.approve('owner', 'req-1', actor)).rejects.toThrow();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('approveIncomingFromCounterpartIfPending grants mutual connection', async () => {
    const transaction = vi.fn(async (ops: unknown[]) => ops);
    const prisma = {
      accessRequest: {
        findFirst: async () => ({
          id: 'req-2',
          targetCompanyId: 'owner',
          requesterCompanyId: 'viewer',
          status: AccessRequestStatus.Pending,
        }),
        update: vi.fn(async () => ({})),
      },
      connection: {
        findUnique: async () => null,
        upsert: vi.fn(async () => ({})),
      },
      companyBlock: { count: async () => 0 },
      $transaction: transaction,
    } as unknown as PrismaService;
    const audit = { record: vi.fn(async () => undefined) } as unknown as AuditService;
    const service = new AccessService(prisma, audit, {} as CompanySerializer, events, threads as never);

    const granted = await service.approveIncomingFromCounterpartIfPending('owner', 'viewer', actor);
    expect(granted).toBe(true);
    expect(transaction).toHaveBeenCalled();
    expect(threads.activateDirectParticipants).toHaveBeenCalledWith('viewer', 'owner');
    expect(events.accessApproved).toHaveBeenCalled();
  });

  it('approveIncomingFromCounterpartIfPending rejects actor/company mismatch', async () => {
    const prisma = {
      accessRequest: {
        findFirst: async () => ({
          id: 'req-2',
          targetCompanyId: 'owner',
          requesterCompanyId: 'viewer',
          status: AccessRequestStatus.Pending,
        }),
      },
    } as unknown as PrismaService;
    const service = new AccessService(
      prisma,
      { record: vi.fn() } as unknown as AuditService,
      {} as CompanySerializer,
      events,
      threads as never,
    );
    const wrongActor: AuthPrincipal = {
      userId: 'user-1',
      phone: '+910000000000',
      companyId: 'other-co',
      role: 'owner',
      permissions: null,
      isPlatformAdmin: false,
    };
    await expect(
      service.approveIncomingFromCounterpartIfPending('owner', 'viewer', wrongActor),
    ).rejects.toThrow(/Switch to the business/);
  });

  it('ensureActiveConnection upserts when there is no access row', async () => {
    const upsert = vi.fn(async () => ({}));
    const prisma = {
      connection: { findUnique: async () => null, upsert },
      companyBlock: { count: async () => 0 },
    } as unknown as PrismaService;
    const audit = { record: vi.fn(async () => undefined) } as unknown as AuditService;
    const service = new AccessService(prisma, audit, {} as CompanySerializer, events, threads as never);
    await service.ensureActiveConnection('owner', 'viewer', actor);
    expect(upsert).toHaveBeenCalled();
  });

  it('blockCounterpart inserts directed CompanyBlock and clears Follows on first edge', async () => {
    const companyBlocks: Array<{ blockerCompanyId: string; blockedCompanyId: string }> = [];
    const deleteMany = vi.fn(async () => ({ count: 0 }));
    const prisma = {
      connection: {
        findUnique: async () => null,
        create: vi.fn(async () => ({})),
        update: vi.fn(async () => ({})),
      },
      companyBlock: {
        findUnique: async () => null,
        count: async () => companyBlocks.length,
        create: async ({
          data,
        }: {
          data: { blockerCompanyId: string; blockedCompanyId: string };
        }) => {
          companyBlocks.push(data);
          return { id: 'b1', ...data };
        },
      },
      tradeLane: {
        findMany: vi.fn(async () => []),
        deleteMany: vi.fn(async () => ({ count: 0 })),
      },
      follow: { deleteMany },
      thread: { updateMany: vi.fn(async () => ({ count: 0 })) },
      $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
    } as unknown as PrismaService;
    const audit = { record: vi.fn(async () => undefined) } as unknown as AuditService;
    const service = new AccessService(prisma, audit, {} as CompanySerializer, events, threads as never);
    await service.blockCounterpart('owner', 'viewer', actor);
    expect(companyBlocks).toEqual([{ blockerCompanyId: 'owner', blockedCompanyId: 'viewer' }]);
    expect(deleteMany).toHaveBeenCalled();
  });

  it('blockCounterpart second edge does not steal — adds own block without Follow wipe', async () => {
    const companyBlocks = [{ blockerCompanyId: 'viewer', blockedCompanyId: 'owner' }];
    const deleteMany = vi.fn(async () => ({ count: 0 }));
    const prisma = {
      connection: {
        findUnique: async () => ({
          status: ConnectionStatus.Active,
          companyLowId: 'owner',
          companyHighId: 'viewer',
        }),
        create: vi.fn(async () => ({})),
        update: vi.fn(async () => ({})),
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
              row.blockerCompanyId ===
                where.blockerCompanyId_blockedCompanyId.blockerCompanyId &&
              row.blockedCompanyId === where.blockerCompanyId_blockedCompanyId.blockedCompanyId,
          );
          return hit ? { id: 'existing' } : null;
        },
        count: async () => companyBlocks.length,
        create: async ({
          data,
        }: {
          data: { blockerCompanyId: string; blockedCompanyId: string };
        }) => {
          companyBlocks.push(data);
          return { id: 'b2', ...data };
        },
      },
      tradeLane: {
        findMany: vi.fn(async () => []),
        deleteMany: vi.fn(async () => ({ count: 0 })),
      },
      follow: { deleteMany },
      $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
    } as unknown as PrismaService;
    const audit = { record: vi.fn(async () => undefined) } as unknown as AuditService;
    const service = new AccessService(prisma, audit, {} as CompanySerializer, events, threads as never);
    await service.blockCounterpart('owner', 'viewer', actor);
    expect(companyBlocks).toEqual(
      expect.arrayContaining([
        { blockerCompanyId: 'viewer', blockedCompanyId: 'owner' },
        { blockerCompanyId: 'owner', blockedCompanyId: 'viewer' },
      ]),
    );
    expect(deleteMany).not.toHaveBeenCalled();
  });
});

describe('AccessService.createRequest', () => {
  it('returns the winning pending request when a concurrent create loses the race', async () => {
    const winner = {
      id: 'req-win',
      requesterCompanyId: 'viewer',
      targetCompanyId: 'owner',
      status: AccessRequestStatus.Pending,
      note: null,
      referredBy: null,
      createdAt: new Date(),
      requester: { id: 'viewer' },
      target: { id: 'owner' },
    };
    let findFirstCalls = 0;
    const conflict = new Prisma.PrismaClientKnownRequestError('unique', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const prisma = {
      company: { findUnique: async () => ({ id: 'owner' }) },
      connection: { findUnique: async () => null },
      companyBlock: { count: async () => 0 },
      accessRequest: {
        // First lookup (fast path) sees nothing; the post-conflict lookup finds the winner.
        findFirst: async () => (findFirstCalls++ === 0 ? null : winner),
        create: async () => {
          throw conflict;
        },
        findUniqueOrThrow: async () => winner,
      },
    } as unknown as PrismaService;
    const audit = { record: vi.fn(async () => undefined) } as unknown as AuditService;
    const serializer = {
      toPublicSummary: (company: { id: string }) => ({ id: company.id }),
    } as unknown as CompanySerializer;

    const service = new AccessService(prisma, audit, serializer, events, threads as never);
    const view = await service.createRequest('viewer', { targetCompanyId: 'owner' });
    expect(view.id).toBe('req-win');
    expect(threads.openAccessRequestThread).toHaveBeenCalled();
  });
});
