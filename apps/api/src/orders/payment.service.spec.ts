import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { OrderStatus, PaymentRequestStatus, suggestedPaymentAmount } from '@ekum/domain-types';
import { PaymentService } from './payment.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { ThreadService } from '../conversation/thread.service';
import type { DomainEvents } from '../events/events.module';

describe('suggestedPaymentAmount', () => {
  it('sums rate × qty when every line has a rate', () => {
    expect(
      suggestedPaymentAmount([
        { rate: 10, quantity: 2 },
        { rate: 5, quantity: 1 },
      ]),
    ).toBe(25);
  });

  it('returns 0 when any line is missing a rate', () => {
    expect(suggestedPaymentAmount([{ rate: 10, quantity: 2 }, { quantity: 1 }])).toBe(0);
  });
});

describe('PaymentService', () => {
  it('rejects ask from the buyer', async () => {
    const prisma = {
      order: {
        findUnique: vi.fn(async () => ({
          id: 'o1',
          status: OrderStatus.Confirmed,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
        })),
      },
    } as unknown as PrismaService;
    const svc = new PaymentService(
      prisma,
      {} as ThreadService,
      { paymentRequested: vi.fn() } as unknown as DomainEvents,
    );
    await expect(
      svc.create('buyer', 'u1', 'o1', { amount: 100 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects ask before confirm', async () => {
    const prisma = {
      order: {
        findUnique: vi.fn(async () => ({
          id: 'o1',
          status: OrderStatus.Requested,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
        })),
      },
    } as unknown as PrismaService;
    const svc = new PaymentService(
      prisma,
      {} as ThreadService,
      { paymentRequested: vi.fn() } as unknown as DomainEvents,
    );
    await expect(
      svc.create('seller', 'u1', 'o1', { amount: 100 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates an ask and notifies', async () => {
    const events = { paymentRequested: vi.fn(), paymentSettled: vi.fn() };
    const prisma = {
      order: {
        findUnique: vi.fn(async () => ({
          id: 'o1',
          status: OrderStatus.Confirmed,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
        })),
      },
      paymentRequest: {
        findFirst: vi.fn(async () => null),
        create: vi.fn(async (args: { data: { amount: number } }) => ({
          id: 'pay-1',
          orderId: 'o1',
          amount: args.data.amount,
          note: null,
          instructions: null,
          status: PaymentRequestStatus.Open,
          seenAt: null,
          paidAt: null,
          createdAt: new Date(),
        })),
      },
      message: { findFirst: vi.fn(async () => null), create: vi.fn(async () => ({ id: 'm1' })) },
      thread: { update: vi.fn(async () => ({})) },
    } as unknown as PrismaService;
    const threads = {
      ensureTradeThread: vi.fn(async () => 'th-1'),
    } as unknown as ThreadService;
    const svc = new PaymentService(prisma, threads, events as unknown as DomainEvents);
    const view = await svc.create('seller', 'u1', 'o1', { amount: 2500 });
    expect(view.id).toBe('pay-1');
    expect(view.amount).toBe(2500);
    expect(events.paymentRequested).toHaveBeenCalled();
    expect(threads.ensureTradeThread).toHaveBeenCalledWith('buyer', 'seller');
  });
});
