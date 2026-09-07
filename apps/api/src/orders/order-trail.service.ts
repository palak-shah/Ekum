import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  OrderTrailType,
  orderTrailLabel,
  type OrderTrailEventView,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import {
  buyerSafePassThroughSummary,
  scrubUpstreamNames,
  textLeaksUpstreamName,
} from './i-handle-soft-hide';

export type AppendTrailInput = {
  orderId: string;
  type: string;
  at?: Date;
  actorCompanyId?: string | null;
  actorUserId?: string | null;
  summary?: string | null;
  detail?: string | null;
  note?: string | null;
  noteVoiceMediaId?: string | null;
  noteVoiceUrl?: string | null;
  noteVoiceDurationMs?: number | null;
  payload?: Prisma.InputJsonValue;
};

@Injectable()
export class OrderTrailService {
  constructor(private readonly prisma: PrismaService) {}

  async append(input: AppendTrailInput): Promise<void> {
    await this.prisma.orderTrailEvent.create({
      data: {
        orderId: input.orderId,
        type: input.type,
        at: input.at ?? new Date(),
        actorCompanyId: input.actorCompanyId ?? null,
        actorUserId: input.actorUserId ?? null,
        summary: input.summary ?? null,
        detail: input.detail ?? null,
        note: input.note ?? null,
        noteVoiceMediaId: input.noteVoiceMediaId ?? null,
        noteVoiceUrl: input.noteVoiceUrl ?? null,
        noteVoiceDurationMs: input.noteVoiceDurationMs ?? null,
        payload: input.payload ?? undefined,
      },
    });
  }

  async listForViewer(
    orderId: string,
    viewerCompanyId: string,
    names: {
      buyerName: string;
      sellerName: string;
      buyerCompanyId: string;
      sellerCompanyId: string;
      staffByUserId: Map<string, string>;
      /** Upstream mill shop names — never show these on the parent ticket. */
      upstreamNamesToHide?: string[];
    },
  ): Promise<OrderTrailEventView[]> {
    let rows = await this.prisma.orderTrailEvent.findMany({
      where: { orderId },
      orderBy: { at: 'asc' },
    });
    if (rows.length === 0) {
      await this.backfillFromOrder(orderId);
      rows = await this.prisma.orderTrailEvent.findMany({
        where: { orderId },
        orderBy: { at: 'asc' },
      });
    }
    const hide = names.upstreamNamesToHide ?? [];
    return rows.map((row) => {
      let who: string | null = null;
      if (row.actorCompanyId === viewerCompanyId && row.actorUserId) {
        who = names.staffByUserId.get(row.actorUserId) ?? null;
      } else if (row.actorCompanyId === names.buyerCompanyId) {
        who = names.buyerName;
      } else if (row.actorCompanyId === names.sellerCompanyId) {
        who = names.sellerName;
      }
      // Actor was a mill (or unknown) — never surface a third company on this ticket.
      if (
        who == null &&
        row.actorCompanyId &&
        row.actorCompanyId !== names.buyerCompanyId &&
        row.actorCompanyId !== names.sellerCompanyId
      ) {
        who = names.sellerName;
      }
      const fallback = passThroughFallback(row.type, names.sellerName);
      const rawSummary = row.summary ?? orderTrailLabel(row.type);
      return {
        id: row.id,
        type: row.type,
        at: row.at.toISOString(),
        who,
        summary: scrubUpstreamNames(rawSummary, hide, fallback) ?? fallback,
        detail: scrubDetail(row.detail, hide),
        note: row.note,
        noteVoiceUrl: row.noteVoiceUrl,
        noteVoiceDurationMs: row.noteVoiceDurationMs,
      };
    });
  }

  /** One-time synthesize from legacy columns when trail is empty. */
  async backfillFromOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shipments: { orderBy: { dispatchedAt: 'asc' }, select: { dispatchedAt: true } },
      },
    });
    if (!order) return;
    const existing = await this.prisma.orderTrailEvent.count({ where: { orderId } });
    if (existing > 0) return;

    const events: AppendTrailInput[] = [
      {
        orderId,
        type: OrderTrailType.Requested,
        at: order.createdAt,
        actorCompanyId: order.createdByCompanyId,
        actorUserId: order.createdByUserId,
      },
    ];
    if (order.quotedAt) {
      events.push({
        orderId,
        type: OrderTrailType.Quoted,
        at: order.quotedAt,
        actorCompanyId: order.sellerCompanyId,
        actorUserId: order.quotedByUserId,
      });
    }
    if (order.confirmedAt) {
      events.push({
        orderId,
        type: OrderTrailType.Confirmed,
        at: order.confirmedAt,
        actorCompanyId: order.confirmedByCompanyId,
        actorUserId: order.confirmedByUserId,
      });
    }
    const shipments = order.shipments ?? [];
    shipments.forEach((ship, index) => {
      const last = index === shipments.length - 1;
      const fullyOut =
        order.status === 'dispatched' ||
        order.status === 'delivered' ||
        order.status === 'settled';
      events.push({
        orderId,
        type:
          last && fullyOut && shipments.length === 1
            ? OrderTrailType.Dispatched
            : index < shipments.length - 1 || !fullyOut
              ? OrderTrailType.PartShipped
              : OrderTrailType.Dispatched,
        at: ship.dispatchedAt,
        actorCompanyId: order.sellerCompanyId,
      });
    });
    if (order.settledAt) {
      events.push({
        orderId,
        type: OrderTrailType.Settled,
        at: order.settledAt,
        actorCompanyId: order.sellerCompanyId,
        actorUserId: order.settledByUserId,
      });
    } else if (order.deliveredAt) {
      events.push({
        orderId,
        type: OrderTrailType.Delivered,
        at: order.deliveredAt,
        actorCompanyId: order.buyerCompanyId,
        actorUserId: order.deliveredByUserId,
      });
    }
    if (order.status === 'cancelled' && order.closedAt) {
      events.push({
        orderId,
        type: OrderTrailType.Cancelled,
        at: order.closedAt,
      });
    }
    if (order.status === 'declined' && order.closedAt) {
      events.push({
        orderId,
        type: OrderTrailType.Declined,
        at: order.closedAt,
        actorCompanyId: order.sellerCompanyId,
      });
    }
    if (events.length > 0) {
      await this.prisma.orderTrailEvent.createMany({
        data: events.map((e) => ({
          orderId: e.orderId,
          type: e.type,
          at: e.at ?? new Date(),
          actorCompanyId: e.actorCompanyId ?? null,
          actorUserId: e.actorUserId ?? null,
          summary: e.summary ?? null,
          detail: e.detail ?? null,
        })),
      });
    }
  }
}

function passThroughFallback(type: string, sellerName: string): string {
  if (type === OrderTrailType.Confirmed) {
    return buyerSafePassThroughSummary('confirmed', sellerName);
  }
  if (type === OrderTrailType.PartShipped) {
    return buyerSafePassThroughSummary('part_shipped', sellerName);
  }
  if (type === OrderTrailType.Dispatched) {
    return buyerSafePassThroughSummary('dispatched', sellerName);
  }
  return orderTrailLabel(type);
}

function scrubDetail(detail: string | null, hide: string[]): string | null {
  if (!detail) return detail;
  if (!textLeaksUpstreamName(detail, hide)) return detail;
  const scrubbed = scrubUpstreamNames(detail, hide, '');
  return scrubbed?.trim() || null;
}
