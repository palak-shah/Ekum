import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { AccessService } from './access.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { CompanySerializer } from './company.serializer';
import type { DomainEvents } from '../events/events.module';

const events = { accessApproved: vi.fn() } as unknown as DomainEvents;
const threads = {
  openAccessRequestThread: vi.fn(async () => 'thread-1'),
  activateDirectParticipants: vi.fn(async () => undefined),
};
const audit = { record: vi.fn(async () => undefined) } as unknown as AuditService;

describe('AccessService.createRequest rules', () => {
  it('rejects requesting access to your own business', async () => {
    const service = new AccessService(
      {} as PrismaService,
      audit,
      {} as CompanySerializer,
      events,
      threads as never,
    );
    await expect(
      service.createRequest('co-1', { targetCompanyId: 'co-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('persists referredBy on a new access request', async () => {
    const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'req-1',
      ...data,
      status: 'pending',
      createdAt: new Date(),
    }));
    const prisma = {
      company: { findUnique: async () => ({ id: 'target' }) },
      connection: { findUnique: async () => null },
      accessRequest: {
        findFirst: async () => null,
        create,
        findUniqueOrThrow: async () => ({
          id: 'req-1',
          requesterCompanyId: 'viewer',
          targetCompanyId: 'target',
          note: 'Intro',
          referredBy: 'ref-user',
          status: 'pending',
          createdAt: new Date(),
          requester: { id: 'viewer', name: 'Jaipur Emporium' },
          target: { id: 'target', name: 'Surat Silk House' },
        }),
      },
    } as unknown as PrismaService;
    const serializer = {
      toPublicSummary: (c: { id: string; name: string }) => ({
        id: c.id,
        name: c.name,
        city: null,
        verification: 'not_verified',
        logoUrl: null,
      }),
    } as unknown as CompanySerializer;

    const service = new AccessService(prisma, audit, serializer, events, threads as never);
    await service.createRequest('viewer', {
      targetCompanyId: 'target',
      note: 'Intro',
      referredBy: 'ref-user',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          referredBy: 'ref-user',
          requesterCompanyId: 'viewer',
          targetCompanyId: 'target',
        }),
      }),
    );
    // Targeted vouch attribution must not auto-approve (open invites redeem separately).
    expect(threads.activateDirectParticipants).not.toHaveBeenCalled();
  });
});
