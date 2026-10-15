import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminTagService } from './admin-tag.service';

describe('AdminTagService bulkCommit', () => {
  const tx = {
    masterOption: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    masterOptionLink: {
      upsert: vi.fn(),
    },
  };
  const prisma = {
    masterCategory: {
      findFirst: vi.fn(),
    },
    masterOptionLink: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<void>) => fn(tx)),
  };
  let service: AdminTagService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(async (fn: (client: typeof tx) => Promise<void>) =>
      fn(tx),
    );
    service = new AdminTagService(prisma as never);
    prisma.masterCategory.findFirst.mockResolvedValue({
      id: 'cat-1',
      slug: 'womens_readymade_ethnic',
      label: 'Womens – Readymade – Ethnic',
      active: true,
    });
    prisma.masterOptionLink.findMany.mockResolvedValue([]);
  });

  it('creates all new labels and reports failed: 0', async () => {
    tx.masterOption.findFirst.mockResolvedValue(null);
    tx.masterOption.create.mockResolvedValue({});
    tx.masterOptionLink.upsert.mockResolvedValue({});

    const result = await service.bulkCommit({
      categoryId: 'cat-1',
      kind: 'item_type',
      labels: ['Silk Soft', 'Cotton Soft'],
    });

    expect(result.created).toBe(2);
    expect(result.failed).toBe(0);
    expect(tx.masterOption.create).toHaveBeenCalledTimes(2);
    expect(tx.masterOptionLink.upsert).toHaveBeenCalledTimes(2);
  });

  it('aborts the whole commit when one label fails (no partial success)', async () => {
    tx.masterOption.findFirst.mockResolvedValue(null);
    tx.masterOption.create
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('unique violation'));
    tx.masterOptionLink.upsert.mockResolvedValue({});

    await expect(
      service.bulkCommit({
        categoryId: 'cat-1',
        kind: 'item_type',
        labels: ['Silk Soft', 'Bad Label'],
      }),
    ).rejects.toThrow('unique violation');

    // First label may have been attempted; caller must not treat the batch as ok.
    expect(tx.masterOption.create).toHaveBeenCalled();
  });
});
