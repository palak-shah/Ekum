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
        findUnique: async () => ({ status: ConnectionStatus.Blocked }),
      },
      $transaction: transaction,
    } as unknown as PrismaService;
    const audit = { record: vi.fn(async () => undefined) } as unknown as AuditService;
    const serializer = {} as unknown as CompanySerializer;

    const service = new AccessService(prisma, audit, serializer, events, threads as never);
    await expect(service.approve('owner', 'req-1', actor)).rejects.toThrow();
    expect(transaction).not.toHaveBeenCalled();
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
