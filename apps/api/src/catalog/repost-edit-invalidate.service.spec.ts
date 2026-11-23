import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageType, RepostPricingMode } from '@ekum/domain-types';
import { RepostEditInvalidateService } from './repost-edit-invalidate.service';

function decimal(n: number) {
  return { toNumber: () => n };
}

describe('RepostEditInvalidateService', () => {
  const prisma = {
    collectionProduct: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    collection: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    company: { findMany: vi.fn() },
    message: { create: vi.fn() },
    thread: { update: vi.fn() },
  };
  const events = { repostEditRateInvalidated: vi.fn() };
  const threads = { ensureTradeThread: vi.fn().mockResolvedValue('thread-1') };

  let service: RepostEditInvalidateService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.collectionProduct.findMany.mockResolvedValue([]);
    prisma.collection.findMany.mockResolvedValue([]);
    prisma.collectionProduct.update.mockResolvedValue({});
    prisma.collectionProduct.updateMany.mockResolvedValue({ count: 0 });
    prisma.collection.update.mockResolvedValue({});
    prisma.company.findMany.mockResolvedValue([
      { id: 'mill', name: 'Surat Silk' },
      { id: 'trader', name: 'Meena' },
    ]);
    prisma.message.create.mockResolvedValue({});
    prisma.thread.update.mockResolvedValue({});
    service = new RepostEditInvalidateService(
      prisma as never,
      events as never,
      threads as never,
    );
  });

  it('no-ops when rate unchanged or old rate missing', async () => {
    await service.afterProductRateChange({
      productId: 'p1',
      supplierCompanyId: 'mill',
      oldRate: 100,
      newRate: 100,
    });
    await service.afterProductRateChange({
      productId: 'p1',
      supplierCompanyId: 'mill',
      oldRate: null,
      newRate: 120,
    });
    expect(prisma.collectionProduct.findMany).not.toHaveBeenCalled();
    expect(events.repostEditRateInvalidated).not.toHaveBeenCalled();
  });

  it('clears dependent pack Edit + member Edit; emits; posts chat; skips Margin', async () => {
    prisma.collectionProduct.findMany.mockResolvedValue([
      {
        id: 'cp-edit',
        editOwnBase: decimal(100),
        collectionId: 'child-1',
        collection: {
          id: 'child-1',
          name: 'Wedding Edit',
          companyId: 'trader',
          repostPricingMode: RepostPricingMode.Edit,
          repostEditOwnBase: decimal(100),
        },
      },
      {
        id: 'cp-other-base',
        editOwnBase: decimal(90),
        collectionId: 'child-other',
        collection: {
          id: 'child-other',
          name: 'Other',
          companyId: 'trader',
          repostPricingMode: RepostPricingMode.Edit,
          repostEditOwnBase: decimal(90),
        },
      },
    ]);
    prisma.collection.findMany.mockResolvedValue([
      {
        id: 'child-1',
        name: 'Wedding Edit',
        companyId: 'trader',
        repostEditOwnBase: decimal(100),
      },
      {
        id: 'margin-pack',
        name: 'Margin Pack',
        companyId: 'trader',
        // Would not be returned (query filters mode=edit) — defensive.
        repostEditOwnBase: decimal(100),
      },
    ]);

    await service.afterProductRateChange({
      productId: 'p1',
      supplierCompanyId: 'mill',
      oldRate: 100,
      newRate: 120,
    });

    expect(prisma.collectionProduct.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cp-edit' },
        data: expect.objectContaining({
          pricingMode: null,
          editedRate: null,
          editOwnBase: null,
        }),
      }),
    );
    expect(prisma.collectionProduct.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cp-other-base' } }),
    );
    expect(prisma.collection.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'child-1' },
        data: { repostEditedRate: null, repostEditOwnBase: null },
      }),
    );
    expect(events.repostEditRateInvalidated).toHaveBeenCalledWith({
      collectionId: 'child-1',
      collectionName: 'Wedding Edit',
      curatorCompanyId: 'trader',
      supplierCompanyId: 'mill',
    });
    expect(threads.ensureTradeThread).toHaveBeenCalledWith('trader', 'mill');
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          threadId: 'thread-1',
          senderCompanyId: 'mill',
          type: MessageType.System,
          body: expect.stringContaining('Surat Silk changed rates for Wedding Edit'),
          metadata: expect.objectContaining({
            kind: 'repost_edit_rate_invalidated',
            path: '/collections/child-1',
          }),
        }),
      }),
    );
  });

  it('clears children when source collection rate changes', async () => {
    prisma.collection.findMany.mockResolvedValue([
      {
        id: 'child-2',
        name: 'Curated lot',
        companyId: 'trader',
        repostEditOwnBase: decimal(200),
      },
    ]);

    await service.afterSourceCollectionRateChange({
      sourceCollectionId: 'src-1',
      supplierCompanyId: 'mill',
      oldRate: 200,
      newRate: 210,
    });

    expect(prisma.collection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          repostSourceCollectionId: 'src-1',
          repostPricingMode: RepostPricingMode.Edit,
        }),
      }),
    );
    expect(prisma.collection.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'child-2' } }),
    );
    expect(events.repostEditRateInvalidated).toHaveBeenCalledWith(
      expect.objectContaining({ collectionId: 'child-2', supplierCompanyId: 'mill' }),
    );
  });
});
