import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { MasterDataService } from './master-data.service';

describe('MasterDataService.resolveCategoryIdForCompany', () => {
  const prisma = {
    company: { findUnique: vi.fn() },
    masterCategory: { findUnique: vi.fn(), findFirst: vi.fn() },
  };
  let service: MasterDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MasterDataService(prisma as never);
    prisma.company.findUnique.mockResolvedValue({
      masterCategories: ['womens_readymade_ethnic', 'mens_readymade_ethnic'],
    });
  });

  it('requires a pick when the company deals in 2+ categories', async () => {
    await expect(service.resolveCategoryIdForCompany('c1', null)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('allows missing category when required is false (Repost)', async () => {
    await expect(
      service.resolveCategoryIdForCompany('c1', null, { required: false }),
    ).resolves.toBeNull();
  });
});
