import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { AdminTagService } from './admin-tag.service';

describe('AdminTagService restore', () => {
  const prisma = {
    masterOption: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
  };
  let service: AdminTagService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminTagService(prisma as never);
  });

  it('restores when no active duplicate label exists', async () => {
    prisma.masterOption.findUnique.mockResolvedValue({
      id: 'opt-1',
      kind: 'quality',
      label: 'Cotton',
      active: false,
    });
    prisma.masterOption.findFirst.mockResolvedValue(null);
    prisma.masterOption.update.mockResolvedValue({});
    prisma.masterOption.findUniqueOrThrow.mockResolvedValue({
      id: 'opt-1',
      kind: 'quality',
      label: 'Cotton',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      categoryLinks: [],
    });

    const row = await service.restore('opt-1');
    expect(prisma.masterOption.update).toHaveBeenCalledWith({
      where: { id: 'opt-1' },
      data: { active: true },
    });
    expect(row.active).toBe(true);
  });

  it('rejects restore when another active option uses the same label', async () => {
    prisma.masterOption.findUnique.mockResolvedValue({
      id: 'opt-1',
      kind: 'quality',
      label: 'Cotton',
      active: false,
    });
    prisma.masterOption.findFirst.mockResolvedValue({
      id: 'opt-2',
      kind: 'quality',
      label: 'cotton',
      active: true,
    });

    await expect(service.restore('opt-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.masterOption.update).not.toHaveBeenCalled();
  });
});
