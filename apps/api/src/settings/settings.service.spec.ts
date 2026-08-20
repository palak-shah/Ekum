import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import type { PrismaService } from '../core/prisma/prisma.service';

describe('SettingsService.updateSettings', () => {
  it('persists sellingEnabled false in tradeDefaults', async () => {
    const upsert = vi.fn(async ({ create, update }: { create: unknown; update: unknown }) => ({
      companyId: 'c1',
      returnPolicy: null,
      tradeDefaults: (update as { tradeDefaults: unknown }).tradeDefaults ?? create,
      myTools: null,
    }));
    const prisma = {
      companySettings: {
        findUnique: async () => ({ tradeDefaults: { buyingEnabled: true, sellingEnabled: true } }),
        upsert,
      },
    } as unknown as PrismaService;
    const service = new SettingsService(prisma);

    const view = await service.updateSettings('c1', { sellingEnabled: false });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          tradeDefaults: expect.objectContaining({ sellingEnabled: false }),
        }),
      }),
    );
    expect(view.tradeDefaults).toMatchObject({ sellingEnabled: false });
  });

  it('persists tradingEnabled in tradeDefaults', async () => {
    const upsert = vi.fn(async ({ create, update }: { create: unknown; update: unknown }) => ({
      companyId: 'c1',
      returnPolicy: null,
      tradeDefaults: (update as { tradeDefaults: unknown }).tradeDefaults ?? create,
      myTools: null,
    }));
    const prisma = {
      companySettings: {
        findUnique: async () => ({ tradeDefaults: { buyingEnabled: true, sellingEnabled: true } }),
        upsert,
      },
    } as unknown as PrismaService;
    const service = new SettingsService(prisma);

    const view = await service.updateSettings('c1', { tradingEnabled: false });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          tradeDefaults: expect.objectContaining({ tradingEnabled: false }),
        }),
      }),
    );
    expect(view.tradeDefaults).toMatchObject({ tradingEnabled: false });
  });
});

describe('SettingsService.updateAddress ownership', () => {
  it('404s when the address belongs to another company', async () => {
    const prisma = {
      address: { findFirst: async () => null },
    } as unknown as PrismaService;
    const service = new SettingsService(prisma);
    await expect(
      service.updateAddress('c1', 'addr-other', {
        label: 'Shop',
        line1: 'X',
        city: 'Surat',
        isDefault: false,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
