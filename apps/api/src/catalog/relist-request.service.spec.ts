import { BadRequestException, ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RelistRequestStatus } from '@ekum/domain-types';
import { RelistRequestService } from './relist-request.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CompanySerializer } from '../access/company.serializer';
import type { ThreadService } from '../conversation/thread.service';
import type { DomainEvents } from '../events/events.module';

const ravi = { id: 'seed-company-ravi', name: 'Surat Silk House' };
const kavita = { id: 'seed-company-kavita', name: 'Ahmedabad Loom Co' };
const meena = { id: 'seed-company-meena', name: 'Meena Fabrics' };

function summary(company: { id: string; name: string }) {
  return { id: company.id, name: company.name, city: null, logoUrl: null };
}

describe('RelistRequestService', () => {
  let prisma: {
    product: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
    collection: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    productRelistGrant: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
    relistRequest: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    message: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    thread: { update: ReturnType<typeof vi.fn> };
  };
  let threads: { ensureTradeThread: ReturnType<typeof vi.fn> };
  let events: { relistGranted: ReturnType<typeof vi.fn> };
  let service: RelistRequestService;

  beforeEach(() => {
    prisma = {
      product: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      collection: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      productRelistGrant: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn(),
        upsert: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      relistRequest: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      message: {
        create: vi.fn().mockResolvedValue({ id: 'msg-1' }),
        findUnique: vi.fn().mockResolvedValue({ metadata: {} }),
        update: vi.fn().mockResolvedValue({}),
      },
      thread: { update: vi.fn().mockResolvedValue({}) },
    };
    threads = { ensureTradeThread: vi.fn().mockResolvedValue('thread-1') };
    events = { relistGranted: vi.fn() };
    const companies = {
      toPublicSummary: (c: { id: string; name: string }) => summary(c),
    } as unknown as CompanySerializer;
    service = new RelistRequestService(
      prisma as unknown as PrismaService,
      companies,
      threads as unknown as ThreadService,
      events as unknown as DomainEvents,
    );
  });

  it('rejects mixed-owner batches', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'A',
        companyId: 'owner-a',
        allowForward: false,
        images: [],
      },
      {
        id: 'p2',
        name: 'B',
        companyId: 'owner-b',
        allowForward: false,
        images: [],
      },
    ]);
    await expect(
      service.create(kavita.id, { productIds: ['p1', 'p2'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when already granted', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'Locked',
        companyId: ravi.id,
        allowForward: false,
        images: [],
      },
    ]);
    prisma.productRelistGrant.findMany.mockResolvedValue([{ productId: 'p1' }]);
    await expect(service.create(kavita.id, { productIds: ['p1'] })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('creates pending ask and posts product card', async () => {
    prisma.product.findMany
      .mockResolvedValueOnce([
        {
          id: 'p1',
          name: 'Locked',
          companyId: ravi.id,
          allowForward: false,
          images: [],
        },
      ])
      .mockResolvedValueOnce([{ id: 'p1', name: 'Locked' }]);
    prisma.relistRequest.create.mockResolvedValue({
      id: 'req-1',
      productIds: ['p1'],
      requesterCompanyId: kavita.id,
      targetCompanyId: ravi.id,
      sourceCollectionId: null,
      status: RelistRequestStatus.Pending,
      threadId: 'thread-1',
      messageId: null,
      decidedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.relistRequest.findUniqueOrThrow.mockResolvedValue({
      id: 'req-1',
      productIds: ['p1'],
      requesterCompanyId: kavita.id,
      targetCompanyId: ravi.id,
      sourceCollectionId: null,
      status: RelistRequestStatus.Pending,
      threadId: 'thread-1',
      messageId: 'msg-1',
      decidedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      requester: kavita,
      target: ravi,
    });

    const view = await service.create(kavita.id, { productIds: ['p1'] });
    expect(view.id).toBe('req-1');
    expect(prisma.message.create).toHaveBeenCalled();
    expect(threads.ensureTradeThread).toHaveBeenCalledWith(kavita.id, ravi.id);
  });

  it('desk-chain Ask targets pack owner', async () => {
    prisma.product.findMany
      .mockResolvedValueOnce([
        {
          id: 'p1',
          name: 'Locked',
          companyId: ravi.id,
          allowForward: false,
          images: [],
        },
      ])
      .mockResolvedValueOnce([{ id: 'p1', name: 'Locked' }]);
    prisma.collection.findUnique.mockResolvedValue({
      id: 'pack-1',
      companyId: kavita.id,
      status: 'published',
      allowForward: false,
      startsAt: null,
      endsAt: null,
      products: [{ productId: 'p1' }],
    });
    prisma.relistRequest.create.mockResolvedValue({
      id: 'req-desk',
      productIds: ['p1'],
      requesterCompanyId: meena.id,
      targetCompanyId: kavita.id,
      sourceCollectionId: 'pack-1',
      status: RelistRequestStatus.Pending,
      threadId: 'thread-2',
      messageId: null,
      decidedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.relistRequest.findUniqueOrThrow.mockResolvedValue({
      id: 'req-desk',
      productIds: ['p1'],
      requesterCompanyId: meena.id,
      targetCompanyId: kavita.id,
      sourceCollectionId: 'pack-1',
      status: RelistRequestStatus.Pending,
      threadId: 'thread-2',
      messageId: 'msg-2',
      decidedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      requester: meena,
      target: kavita,
    });

    const view = await service.create(meena.id, {
      productIds: ['p1'],
      sourceCollectionId: 'pack-1',
    });
    expect(view.target.id).toBe(kavita.id);
    expect(view.sourceCollectionId).toBe('pack-1');
    expect(threads.ensureTradeThread).toHaveBeenCalledWith(meena.id, kavita.id);
  });

  it('allow creates ProductRelistGrant per product and notifies', async () => {
    prisma.relistRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      productIds: ['p1', 'p2'],
      requesterCompanyId: kavita.id,
      targetCompanyId: ravi.id,
      sourceCollectionId: null,
      status: RelistRequestStatus.Pending,
      threadId: 'thread-1',
      messageId: 'msg-1',
      decidedAt: null,
    });
    prisma.product.findMany
      .mockResolvedValueOnce([
        { id: 'p1', name: 'One', companyId: ravi.id, allowForward: false },
        { id: 'p2', name: 'Two', companyId: ravi.id, allowForward: false },
      ])
      .mockResolvedValueOnce([
        { id: 'p1', name: 'One' },
        { id: 'p2', name: 'Two' },
      ]);
    prisma.relistRequest.findUniqueOrThrow.mockResolvedValue({
      id: 'req-1',
      productIds: ['p1', 'p2'],
      requesterCompanyId: kavita.id,
      targetCompanyId: ravi.id,
      sourceCollectionId: null,
      status: RelistRequestStatus.Allowed,
      threadId: 'thread-1',
      messageId: 'msg-1',
      decidedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      requester: kavita,
      target: ravi,
    });

    await service.allow(ravi.id, 'req-1');
    expect(prisma.productRelistGrant.upsert).toHaveBeenCalledTimes(2);
    expect(events.relistGranted).toHaveBeenCalled();
  });

  it('deny marks denied without notifying asker event', async () => {
    prisma.relistRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      productIds: ['p1'],
      requesterCompanyId: kavita.id,
      targetCompanyId: ravi.id,
      sourceCollectionId: null,
      status: RelistRequestStatus.Pending,
      threadId: 'thread-1',
      messageId: 'msg-1',
      decidedAt: null,
    });
    prisma.product.findMany.mockResolvedValue([{ id: 'p1', name: 'Locked' }]);

    await service.deny(ravi.id, 'req-1');
    expect(prisma.relistRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: RelistRequestStatus.Denied }),
      }),
    );
    expect(events.relistGranted).not.toHaveBeenCalled();
  });

  it('revoke deletes grant and cascades downstream', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'p1', name: 'Locked' });
    await service.revokeGrant(ravi.id, 'p1', kavita.id);
    expect(prisma.productRelistGrant.deleteMany).toHaveBeenCalledWith({
      where: { productId: 'p1', companyId: kavita.id },
    });
    expect(prisma.productRelistGrant.deleteMany).toHaveBeenCalledWith({
      where: { productId: 'p1', grantedByCompanyId: kavita.id },
    });
  });

  it('checkAccess returns grants, pending, and pack-open', async () => {
    prisma.productRelistGrant.findMany.mockResolvedValue([{ productId: 'p1' }]);
    prisma.relistRequest.findMany.mockResolvedValue([
      { id: 'req-2', productIds: ['p2', 'p3'] },
    ]);
    prisma.collection.findMany.mockResolvedValue([{ id: 'pack-open' }]);
    const access = await service.checkAccess(kavita.id, {
      productIds: ['p1', 'p2', 'p4'],
      packByProductId: { p4: 'pack-open' },
    });
    expect(access.grantedProductIds).toEqual(['p1']);
    expect(access.pendingByProductId).toEqual({ p2: 'req-2' });
    expect(access.packOpenProductIds).toEqual(['p4']);
  });
});
