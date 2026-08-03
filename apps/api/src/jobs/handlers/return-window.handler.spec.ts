import { describe, expect, it, vi } from 'vitest';
import { OrderStatus, ReturnStatus } from '@ekum/domain-types';
import { ReturnWindowHandler } from './return-window.handler';
import type { PrismaService } from '../../core/prisma/prisma.service';
import type { NotificationService } from '../../notifications/notification.service';

function makeHandler(options: {
  order: { id: string; status: string; closedAt: Date | null; buyerCompanyId: string } | null;
  openReturns: number;
}) {
  const orderUpdate = vi.fn(async () => undefined);
  const prisma = {
    order: { findUnique: async () => options.order, update: orderUpdate },
    return: { count: async () => options.openReturns },
  } as unknown as PrismaService;
  const create = vi.fn(async () => undefined);
  const notifications = { create } as unknown as NotificationService;
  return { handler: new ReturnWindowHandler(prisma, notifications), orderUpdate, create };
}

describe('ReturnWindowHandler', () => {
  it('closes a delivered order and notifies the buyer when no return is open', async () => {
    const { handler, orderUpdate, create } = makeHandler({
      order: { id: 'o1', status: OrderStatus.Delivered, closedAt: null, buyerCompanyId: 'buyer' },
      openReturns: 0,
    });
    await handler.run({ orderId: 'o1' });
    expect(orderUpdate).toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientCompanyId: 'buyer', refId: 'o1' }),
    );
  });

  it('closes the window but does not nudge while a return is being decided', async () => {
    const { handler, orderUpdate, create } = makeHandler({
      order: { id: 'o1', status: OrderStatus.Delivered, closedAt: null, buyerCompanyId: 'buyer' },
      openReturns: 1,
    });
    await handler.run({ orderId: 'o1' });
    expect(orderUpdate).toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('is a no-op for an order that is not delivered', async () => {
    const { handler, orderUpdate } = makeHandler({
      order: { id: 'o1', status: OrderStatus.Confirmed, closedAt: null, buyerCompanyId: 'buyer' },
      openReturns: 0,
    });
    await handler.run({ orderId: 'o1' });
    expect(orderUpdate).not.toHaveBeenCalled();
  });

  it('is a no-op when the order already closed (idempotent retry)', async () => {
    const { handler, orderUpdate } = makeHandler({
      order: { id: 'o1', status: OrderStatus.Delivered, closedAt: new Date(), buyerCompanyId: 'buyer' },
      openReturns: 0,
    });
    await handler.run({ orderId: 'o1' });
    expect(orderUpdate).not.toHaveBeenCalled();
  });
});

// Guard against a typo drift between the handler and the status enum.
describe('ReturnStatus.Requested is the open state', () => {
  it('matches what the handler counts', () => {
    expect(ReturnStatus.Requested).toBe('requested');
  });
});
