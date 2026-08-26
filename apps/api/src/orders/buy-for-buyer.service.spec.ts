import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ConnectionStatus, OrderStatus } from '@ekum/domain-types';
import { BuyForBuyerService } from './buy-for-buyer.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { ThreadService } from '../conversation/thread.service';
import type { DomainEvents } from '../events/events.module';
import type { OrderSerializer } from './order.serializer';

function serializer() {
  return {
    toOrderView: (order: { id: string }) => ({ id: order.id }),
  } as unknown as OrderSerializer;
}

describe('BuyForBuyerService', () => {
  it('rejects unknown designs', async () => {
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'seller', city: 'Surat', name: 'Mill' })) },
      product: { findMany: vi.fn(async () => []) },
    } as unknown as PrismaService;
    const svc = new BuyForBuyerService(
      prisma,
      {} as ThreadService,
      {} as DomainEvents,
      serializer(),
    );
    await expect(
      svc.create('seller', 'u1', {
        buyerCompanyId: 'buyer',
        items: [{ productId: 'p1', quantity: 10 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets a trader log someone else’s design for a buyer', async () => {
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'trader', city: 'Surat', name: 'House' })) },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'p1',
            name: 'Silk',
            sku: 'S1',
            rate: 100,
            unit: 'pc',
            images: ['a.jpg'],
            companyId: 'mill',
          },
        ]),
      },
      connection: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'c1', status: ConnectionStatus.Active }),
      },
      order: {
        create: vi.fn(async () => ({
          id: 'o1',
          status: OrderStatus.Requested,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'trader',
          items: [{ id: 'i1' }],
          buyer: { name: 'Shop' },
          seller: { name: 'House' },
        })),
      },
      message: { create: vi.fn(async () => ({ id: 'm1' })) },
      thread: { update: vi.fn(async () => ({})) },
    } as unknown as PrismaService;
    const threads = { ensureTradeThread: vi.fn(async () => 'th-1') } as unknown as ThreadService;
    const events = { orderCreated: vi.fn() } as unknown as DomainEvents;
    const svc = new BuyForBuyerService(prisma, threads, events, serializer());
    const result = await svc.create('trader', 'u1', {
      buyerCompanyId: 'buyer',
      items: [{ productId: 'p1', quantity: 20 }],
    });
    expect(result.order.id).toBe('o1');
  });

  it('creates a ticket for a connected buyer', async () => {
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'seller', city: 'Surat', name: 'Mill' })) },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'p1',
            name: 'Silk',
            sku: 'S1',
            rate: 100,
            unit: 'pc',
            images: ['a.jpg'],
            companyId: 'seller',
          },
        ]),
      },
      collectionProduct: { findMany: vi.fn(async () => []) },
      connection: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'c1', status: ConnectionStatus.Active }),
      },
      order: {
        create: vi.fn(async () => ({
          id: 'o1',
          status: OrderStatus.Requested,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          items: [{ id: 'i1' }],
          buyer: { name: 'Shop' },
          seller: { name: 'Mill' },
        })),
      },
      message: { create: vi.fn(async () => ({ id: 'm1' })) },
      thread: { update: vi.fn(async () => ({})) },
    } as unknown as PrismaService;
    const threads = { ensureTradeThread: vi.fn(async () => 'th-1') } as unknown as ThreadService;
    const events = { orderCreated: vi.fn() } as unknown as DomainEvents;
    const svc = new BuyForBuyerService(prisma, threads, events, serializer());
    const result = await svc.create('seller', 'u1', {
      buyerCompanyId: 'buyer',
      items: [{ productId: 'p1', quantity: 20 }],
    });
    expect(result.order.id).toBe('o1');
    expect(result.invitePath).toBeNull();
    expect(events.orderCreated).toHaveBeenCalled();
  });

  it('creates a thin company and invite for a new phone', async () => {
    const prisma = {
      company: {
        findUnique: vi.fn(async () => ({ id: 'seller', city: 'Surat', name: 'Mill' })),
        create: vi.fn(async () => ({ id: 'thin-1' })),
      },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'p1',
            name: 'Silk',
            sku: 'S1',
            rate: null,
            unit: 'pc',
            images: [],
            companyId: 'seller',
          },
        ]),
      },
      collectionProduct: { findMany: vi.fn(async () => []) },
      user: { findMany: vi.fn(async () => []) },
      order: {
        create: vi.fn(async () => ({
          id: 'o2',
          status: OrderStatus.Requested,
          buyerCompanyId: 'thin-1',
          sellerCompanyId: 'seller',
          items: [{ id: 'i1' }],
          buyer: { name: 'Ramesh' },
          seller: { name: 'Mill' },
        })),
      },
      message: { create: vi.fn(async () => ({ id: 'm1' })) },
      thread: { update: vi.fn(async () => ({})) },
      orderAcceptInvite: { create: vi.fn(async () => ({ token: 'tok' })) },
    } as unknown as PrismaService;
    const threads = { ensureTradeThread: vi.fn(async () => 'th-1') } as unknown as ThreadService;
    const events = { orderCreated: vi.fn() } as unknown as DomainEvents;
    const svc = new BuyForBuyerService(prisma, threads, events, serializer());
    const result = await svc.create('seller', 'u1', {
      buyerName: 'Ramesh',
      buyerPhone: '9876543210',
      items: [{ productId: 'p1', quantity: 12 }],
    });
    expect(result.invitePath?.startsWith('/o/')).toBe(true);
    expect(prisma.company.create).toHaveBeenCalled();
  });

  it('rejects Accept from the seller', async () => {
    const prisma = {
      order: {
        findUnique: vi.fn(async () => ({
          id: 'o1',
          status: OrderStatus.Requested,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          createdByCompanyId: 'seller',
          items: [{ id: 'i1', lineStatus: 'open' }],
          seller: { name: 'Mill' },
          buyer: { name: 'Shop' },
        })),
      },
    } as unknown as PrismaService;
    const svc = new BuyForBuyerService(
      prisma,
      {} as ThreadService,
      {} as DomainEvents,
      serializer(),
    );
    await expect(svc.acceptLogged('seller', 'o1')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
