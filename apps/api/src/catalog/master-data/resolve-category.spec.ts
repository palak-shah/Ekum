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

  it('allows a category the company does not deal in', async () => {
    prisma.masterCategory.findFirst.mockResolvedValue({
      id: 'cat_other',
      slug: 'accessories_readymade',
    });
    await expect(service.resolveCategoryIdForCompany('c1', 'cat_other')).resolves.toBe(
      'cat_other',
    );
  });

  it('defaults the single profile category when none is sent', async () => {
    prisma.company.findUnique.mockResolvedValue({
      masterCategories: ['womens_readymade_ethnic'],
    });
    prisma.masterCategory.findUnique.mockResolvedValue({
      id: 'cat_ethnic',
      slug: 'womens_readymade_ethnic',
    });
    await expect(service.resolveCategoryIdForCompany('c1', null)).resolves.toBe('cat_ethnic');
  });

  it('rejects an unknown category', async () => {
    prisma.masterCategory.findFirst.mockResolvedValue(null);
    await expect(service.resolveCategoryIdForCompany('c1', 'nope')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
