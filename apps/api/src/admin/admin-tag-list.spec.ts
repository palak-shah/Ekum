import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminTagService } from './admin-tag.service';

describe('AdminTagService.list pagination', () => {
  const prisma = {
    masterOption: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  };
  let service: AdminTagService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminTagService(prisma as never);
  });

  it('returns items with total, take, and skip (default take 25)', async () => {
    prisma.masterOption.count.mockResolvedValue(40);
    prisma.masterOption.findMany.mockResolvedValue([
      {
        id: 'a',
        kind: 'quality',
        label: 'Cotton',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        categoryLinks: [],
      },
    ]);

    const page = await service.list({
      categoryId: 'cat-1',
      kind: 'quality',
      includeInactive: true,
      skip: 25,
    });

    expect(prisma.masterOption.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 25, skip: 25 }),
    );
    expect(page.total).toBe(40);
    expect(page.take).toBe(25);
    expect(page.skip).toBe(25);
    expect(page.items).toHaveLength(1);
  });
});
