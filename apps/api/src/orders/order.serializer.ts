import { Injectable } from '@nestjs/common';
import type {
  Company,
  Complaint,
  Order,
  OrderItem,
  OrderShipment,
  OrderShipmentItem,
  Prisma,
  Return,
  ReturnItem,
  Sample,
} from '@prisma/client';
import {
  OrderDirection,
  OrderLineStatus,
  type ComplaintView,
  type OrderItemView,
  type OrderShipmentView,
  type OrderView,
  type ReturnView,
  type SampleView,
} from '@ekum/domain-types';
import { CompanySerializer } from '../access/company.serializer';
import { toAuditActor } from '../common/audit';

type ActorUser = { id: string; name: string | null };

type ShipmentWithItems = OrderShipment & {
  items: (OrderShipmentItem & { orderItem: Pick<OrderItem, 'id' | 'name'> })[];
};

type OrderWithRelations = Order & {
  buyer: Company;
  seller: Company;
  items: OrderItem[];
  shipments?: ShipmentWithItems[];
  returns?: (Return & { items: ReturnItem[] })[];
  createdByUser?: ActorUser | null;
  updatedByUser?: ActorUser | null;
};

type SampleWithRelations = Sample & { buyer: Company; seller: Company };
type ReturnWithRelations = Return & {
  items: ReturnItem[];
  order: { buyer: Company; seller: Company };
};

function decimal(value: Prisma.Decimal | null): number | null {
  return value === null ? null : value.toNumber();
}

@Injectable()
export class OrderSerializer {
  constructor(private readonly companySerializer: CompanySerializer) {}

  toOrderView(
    order: OrderWithRelations,
    viewerCompanyId: string,
    threadId: string | null = null,
  ): OrderView {
    const buying = order.buyerCompanyId === viewerCompanyId;
    const confirmedByCompanyId = order.confirmedByCompanyId ?? null;
    let confirmedByRole: 'buyer' | 'seller' | null = null;
    let confirmedByName: string | null = null;
    if (confirmedByCompanyId === order.buyerCompanyId) {
      confirmedByRole = 'buyer';
      confirmedByName =
        confirmedByCompanyId === viewerCompanyId ? 'you' : order.buyer.name;
    } else if (confirmedByCompanyId === order.sellerCompanyId) {
      confirmedByRole = 'seller';
      confirmedByName =
        confirmedByCompanyId === viewerCompanyId ? 'you' : order.seller.name;
    }

    const shippedByItem = new Map<string, number>();
    for (const shipment of order.shipments ?? []) {
      for (const line of shipment.items) {
        shippedByItem.set(
          line.orderItemId,
          (shippedByItem.get(line.orderItemId) ?? 0) + line.quantity.toNumber(),
        );
      }
    }

    const items = order.items.map((item) => this.toItemView(item, shippedByItem.get(item.id) ?? 0));
    const shipments = (order.shipments ?? [])
      .slice()
      .sort((a, b) => b.dispatchedAt.getTime() - a.dispatchedAt.getTime())
      .map((shipment) => this.toShipmentView(shipment));

    const latest = shipments[0] ?? null;
    const shippable = items.filter(
      (item) =>
        item.lineStatus === OrderLineStatus.Confirmed ||
        item.lineStatus === OrderLineStatus.Dispatched ||
        item.lineStatus === OrderLineStatus.Delivered,
    );
    const remaining = shippable.reduce((sum, item) => sum + item.remainingQuantity, 0);
    const shippedTotal = shippable.reduce((sum, item) => sum + item.shippedQuantity, 0);
    const partiallyShipped = shippedTotal > 0 && remaining > 0;

    return {
      id: order.id,
      kind: order.kind,
      intent: order.intent ?? 'order',
      status: order.status,
      amendCount: order.amendCount ?? 0,
      direction: buying ? OrderDirection.Buying : OrderDirection.Selling,
      note: order.note,
      buyerCompanyId: order.buyerCompanyId,
      sellerCompanyId: order.sellerCompanyId,
      buyerName: order.buyer.name,
      sellerName: order.seller.name,
      counterpart: this.companySerializer.toPublicSummary(buying ? order.seller : order.buyer),
      items,
      shipments,
      dispatch: latest
        ? {
            transporter: latest.transporter,
            lrNumber: latest.lrNumber,
            parcelCount: latest.parcelCount,
            dispatchedAt: latest.dispatchedAt,
          }
        : order.dispatchedAt
          ? {
              transporter: order.transporter,
              lrNumber: order.lrNumber,
              parcelCount: order.parcelCount,
              dispatchedAt: order.dispatchedAt.toISOString(),
            }
          : null,
      threadId,
      confirmedAt: order.confirmedAt ? order.confirmedAt.toISOString() : null,
      confirmedByName,
      confirmedByRole,
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
      closedAt: order.closedAt ? order.closedAt.toISOString() : null,
      partiallyShipped,
      returns: (order.returns ?? []).map((row) =>
        this.toReturnView(
          {
            ...row,
            order: { buyer: order.buyer, seller: order.seller },
          },
          viewerCompanyId,
        ),
      ),
      createdBy: toAuditActor(order.createdByUser),
      updatedBy: toAuditActor(order.updatedByUser),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  toSampleView(sample: SampleWithRelations, viewerCompanyId: string): SampleView {
    const buying = sample.buyerCompanyId === viewerCompanyId;
    return {
      id: sample.id,
      status: sample.status,
      direction: buying ? OrderDirection.Buying : OrderDirection.Selling,
      productId: sample.productId,
      name: sample.name,
      note: sample.note,
      buyerCompanyId: sample.buyerCompanyId,
      sellerCompanyId: sample.sellerCompanyId,
      counterpart: this.companySerializer.toPublicSummary(buying ? sample.seller : sample.buyer),
      dispatch: sample.dispatchedAt
        ? {
            transporter: sample.transporter,
            lrNumber: sample.lrNumber,
            parcelCount: null,
            dispatchedAt: sample.dispatchedAt.toISOString(),
          }
        : null,
      receivedAt: sample.receivedAt ? sample.receivedAt.toISOString() : null,
      createdAt: sample.createdAt.toISOString(),
      updatedAt: sample.updatedAt.toISOString(),
    };
  }

  toReturnView(entity: ReturnWithRelations, viewerCompanyId: string): ReturnView {
    const buying = entity.buyerCompanyId === viewerCompanyId;
    return {
      id: entity.id,
      orderId: entity.orderId,
      status: entity.status,
      reason: entity.reason,
      direction: buying ? OrderDirection.Buying : OrderDirection.Selling,
      counterpart: this.companySerializer.toPublicSummary(
        buying ? entity.order.seller : entity.order.buyer,
      ),
      items: entity.items.map((item) => ({
        id: item.id,
        orderItemId: item.orderItemId,
        name: item.name,
        requestedQuantity: item.requestedQuantity.toNumber(),
        approvedQuantity: decimal(item.approvedQuantity),
      })),
      escalatedFromReturnId: entity.escalatedFromReturnId,
      decidedAt: entity.decidedAt ? entity.decidedAt.toISOString() : null,
      resolvedAt: entity.resolvedAt ? entity.resolvedAt.toISOString() : null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  toComplaintView(complaint: Complaint, viewerCompanyId: string): ComplaintView {
    return {
      id: complaint.id,
      orderId: complaint.orderId,
      status: complaint.status,
      subject: complaint.subject,
      detail: complaint.detail,
      response: complaint.response,
      raisedByCompanyId: complaint.raisedByCompanyId,
      againstCompanyId: complaint.againstCompanyId,
      mine: complaint.raisedByCompanyId === viewerCompanyId,
      createdAt: complaint.createdAt.toISOString(),
      updatedAt: complaint.updatedAt.toISOString(),
    };
  }

  private toItemView(item: OrderItem, shippedQuantity: number): OrderItemView {
    const quantity = item.quantity.toNumber();
    const lineStatus = (item.lineStatus || OrderLineStatus.Open) as OrderLineStatus;
    const shippable =
      lineStatus === OrderLineStatus.Confirmed || lineStatus === OrderLineStatus.Dispatched;
    const remaining = shippable ? Math.max(0, quantity - shippedQuantity) : 0;
    return {
      id: item.id,
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      rate: decimal(item.rate),
      unit: item.unit,
      image: item.image,
      images: item.images,
      quantity,
      requestedQuantity: item.requestedQuantity.toNumber(),
      lineStatus,
      shippedQuantity,
      remainingQuantity: remaining,
      note: item.note,
    };
  }

  private toShipmentView(shipment: ShipmentWithItems): OrderShipmentView {
    return {
      id: shipment.id,
      transporter: shipment.transporter,
      lrNumber: shipment.lrNumber,
      parcelCount: shipment.parcelCount,
      dispatchedAt: shipment.dispatchedAt.toISOString(),
      items: shipment.items.map((line) => ({
        orderItemId: line.orderItemId,
        name: line.orderItem.name,
        quantity: line.quantity.toNumber(),
      })),
    };
  }
}
