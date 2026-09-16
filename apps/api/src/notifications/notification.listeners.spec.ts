import { describe, expect, it, vi } from 'vitest';
import { NotificationType, shortOrderLabel } from '@ekum/domain-types';
import { NotificationListeners } from './notification.listeners';
import type { NotificationService } from './notification.service';
import type { PrismaService } from '../core/prisma/prisma.service';

function makeListeners(names: Record<string, string> = {}) {
  const create = vi.fn(async () => undefined);
  const createForMany = vi.fn(async () => undefined);
  const createForRecipients = vi.fn(async () => undefined);
  const notifications = {
    create,
    createForMany,
    createForRecipients,
  } as unknown as NotificationService;
  const prisma = {
    company: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        names[where.id] ? { name: names[where.id] } : null,
      ),
    },
  } as unknown as PrismaService;
  return {
    listeners: new NotificationListeners(notifications, prisma),
    create,
    createForMany,
    createForRecipients,
  };
}

describe('NotificationListeners enriched copy', () => {
  it('order created uses buyer name and order label', async () => {
    const { listeners, create } = makeListeners({ 'buyer-1': 'Jaipur Emporium' });
    await listeners.onOrderCreated({
      orderId: 'ord-abcd1234',
      buyerCompanyId: 'buyer-1',
      sellerCompanyId: 'seller-1',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientCompanyId: 'seller-1',
        type: NotificationType.Order,
        title: `Jaipur Emporium · ${shortOrderLabel('ord-abcd1234')}`,
        body: 'New order',
        refType: 'order',
        refId: 'ord-abcd1234',
      }),
    );
  });

  it('return requested deep-links to order with who/what copy', async () => {
    const { listeners, create } = makeListeners({ 'buyer-1': 'Meena Textiles' });
    await listeners.onReturnRequested({
      returnId: 'ret-1',
      orderId: 'ord-ret9999',
      buyerCompanyId: 'buyer-1',
      sellerCompanyId: 'seller-1',
      actorCompanyId: 'buyer-1',
      status: 'requested',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: `Meena Textiles · return on ${shortOrderLabel('ord-ret9999')}`,
        body: 'Raised',
        refType: 'order',
        refId: 'ord-ret9999',
      }),
    );
  });

  it('access approved names the target company', async () => {
    const { listeners, create } = makeListeners({ 'target-1': 'Surat Silk House' });
    await listeners.onAccessApproved({
      requestId: 'req-1',
      requesterCompanyId: 'req-co',
      targetCompanyId: 'target-1',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Surat Silk House approved your request',
        refType: 'company',
        refId: 'target-1',
      }),
    );
  });

  it('payment requested names the seller and order label', async () => {
    const { listeners, create } = makeListeners({ 'seller-1': 'Ravi Mills' });
    await listeners.onPaymentRequested({
      paymentRequestId: 'pay-1',
      orderId: 'ord-pay0001',
      buyerCompanyId: 'buyer-1',
      sellerCompanyId: 'seller-1',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ravi Mills asked for payment',
        body: shortOrderLabel('ord-pay0001'),
        refType: 'order',
        refId: 'ord-pay0001',
      }),
    );
  });
});
