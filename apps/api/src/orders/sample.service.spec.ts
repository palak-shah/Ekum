import { describe, expect, it, vi } from 'vitest';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { SampleStatus } from '@ekum/domain-types';
import { SampleService } from './sample.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { OrderSerializer } from './order.serializer';
import type { TradeAccess } from './trade-access';

describe('SampleService', () => {
  it('requires trade access before creating a sample', async () => {
    const assertCanTrade = vi.fn(async () => {
      throw new ForbiddenException({ code: 'CONNECTION_REQUIRED', message: 'Connect first.' });
    });
    const service = new SampleService(
      {} as PrismaService,
      {} as unknown as OrderSerializer,
      { assertCanTrade } as unknown as TradeAccess,
    );
    await expect(
      service.create('buyer', { sellerCompanyId: 'seller', name: 'Red Banarasi' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(assertCanTrade).toHaveBeenCalledWith('buyer', 'seller', {
      productIds: undefined,
    });
  });

  it('creates a requested sample when trade is allowed', async () => {
    const create = vi.fn(async () => ({
      id: 's1',
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'seller',
      status: SampleStatus.Requested,
      name: 'Red Banarasi',
      buyer: { id: 'buyer' },
      seller: { id: 'seller' },
    }));
    const prisma = { sample: { create } } as unknown as PrismaService;
    const serializer = {
      toSampleView: (row: unknown) => row,
    } as unknown as OrderSerializer;
    const service = new SampleService(prisma, serializer, {
      assertCanTrade: vi.fn(async () => undefined),
    } as unknown as TradeAccess);

    const view = await service.create('buyer', {
      sellerCompanyId: 'seller',
      name: 'Red Banarasi',
    });
    expect(create).toHaveBeenCalled();
    expect(view).toMatchObject({ status: SampleStatus.Requested });
  });

  it('lets the seller dispatch a requested sample', async () => {
    const update = vi.fn(async () => ({
      id: 's1',
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'seller',
      status: SampleStatus.Dispatched,
      buyer: { id: 'buyer' },
      seller: { id: 'seller' },
    }));
    const prisma = {
      sample: {
        findUnique: async () => ({
          id: 's1',
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          status: SampleStatus.Requested,
          buyer: { id: 'buyer' },
          seller: { id: 'seller' },
        }),
        update,
      },
    } as unknown as PrismaService;
    const serializer = {
      toSampleView: (row: unknown) => row,
    } as unknown as OrderSerializer;
    const service = new SampleService(prisma, serializer, {
      assertCanTrade: vi.fn(),
    } as unknown as TradeAccess);

    await service.dispatch('seller', 's1', { transporter: 'DTDC', lrNumber: 'LR1' });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: SampleStatus.Dispatched }),
      }),
    );
  });

  it('rejects buyer attempting seller-only dispatch', async () => {
    const prisma = {
      sample: {
        findUnique: async () => ({
          id: 's1',
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          status: SampleStatus.Requested,
          buyer: { id: 'buyer' },
          seller: { id: 'seller' },
        }),
      },
    } as unknown as PrismaService;
    const service = new SampleService(
      prisma,
      { toSampleView: (r: unknown) => r } as unknown as OrderSerializer,
      { assertCanTrade: vi.fn() } as unknown as TradeAccess,
    );
    await expect(service.dispatch('buyer', 's1', {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects invalid receive before dispatch', async () => {
    const prisma = {
      sample: {
        findUnique: async () => ({
          id: 's1',
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          status: SampleStatus.Requested,
          buyer: { id: 'buyer' },
          seller: { id: 'seller' },
        }),
      },
    } as unknown as PrismaService;
    const service = new SampleService(
      prisma,
      { toSampleView: (r: unknown) => r } as unknown as OrderSerializer,
      { assertCanTrade: vi.fn() } as unknown as TradeAccess,
    );
    await expect(service.receive('buyer', 's1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('converts a received sample', async () => {
    const update = vi.fn(async () => ({
      id: 's1',
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'seller',
      status: SampleStatus.Converted,
      buyer: { id: 'buyer' },
      seller: { id: 'seller' },
    }));
    const prisma = {
      sample: {
        findUnique: async () => ({
          id: 's1',
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          status: SampleStatus.Received,
          buyer: { id: 'buyer' },
          seller: { id: 'seller' },
        }),
        update,
      },
    } as unknown as PrismaService;
    const service = new SampleService(
      prisma,
      { toSampleView: (r: unknown) => r } as unknown as OrderSerializer,
      { assertCanTrade: vi.fn() } as unknown as TradeAccess,
    );
    await service.convert('buyer', 's1');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: SampleStatus.Converted }),
      }),
    );
  });
});
