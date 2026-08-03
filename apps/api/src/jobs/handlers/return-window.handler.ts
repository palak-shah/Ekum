import { Injectable, Logger } from '@nestjs/common';
import { JobType, NotificationType, OrderStatus, ReturnStatus } from '@ekum/domain-types';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationService } from '../../notifications/notification.service';
import type { JobHandler } from '../job.types';

/**
 * Closes a delivered order's return window once it lapses. New returns are
 * already refused past the window (enforced in ReturnService); this job records
 * the closure and tells the buyer their window ended. Returns still in flight are
 * left untouched — closing the window never cancels an open return.
 */
@Injectable()
export class ReturnWindowHandler implements JobHandler {
  readonly type = JobType.ReturnWindowExpire;
  private readonly logger = new Logger(ReturnWindowHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const orderId = typeof payload.orderId === 'string' ? payload.orderId : null;
    if (!orderId) {
      throw new Error('return_window.expire job is missing orderId.');
    }
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      this.logger.warn(`Order ${orderId} vanished before window expiry; skipping.`);
      return;
    }
    if (order.status !== OrderStatus.Delivered || order.closedAt) {
      return; // Not deliverable-to-closed, or already closed. Idempotent.
    }

    await this.prisma.order.update({ where: { id: orderId }, data: { closedAt: new Date() } });

    const openReturns = await this.prisma.return.count({
      where: { orderId, status: ReturnStatus.Requested },
    });
    if (openReturns > 0) {
      return; // A return is being decided; don't nudge about a closed window.
    }
    await this.notifications.create({
      recipientCompanyId: order.buyerCompanyId,
      type: NotificationType.Order,
      title: 'Return window closed',
      body: 'The return window for a delivered order has ended.',
      refType: 'order',
      refId: order.id,
    });
  }
}
