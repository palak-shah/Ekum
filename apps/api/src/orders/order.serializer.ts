import { Injectable } from '@nestjs/common';
import type {
  Company,
  Complaint,
  Order,
  OrderItem,
  Prisma,
  Return,
  ReturnItem,
  Sample,
} from '@prisma/client';
import {
  OrderDirection,
  type ComplaintView,
  type OrderItemView,
  type OrderView,
  type ReturnView,
  type SampleView,
} from '@ekum/domain-types';
import { CompanySerializer } from '../access/company.serializer';

type OrderWithRelations = Order & { buyer: Company; seller: Company; items: OrderItem[] };
type SampleWithRelations = Sample & { buyer: Company; seller: Company };
type ReturnWithRelations = Return & { items: ReturnItem[] };

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
    return {
      id: order.id,
      kind: order.kind,
      status: order.status,
      direction: buying ? OrderDirection.Buying : OrderDirection.Selling,
      note: order.note,
      buyerCompanyId: order.buyerCompanyId,
      sellerCompanyId: order.sellerCompanyId,
      counterpart: this.companySerializer.toPublicSummary(buying ? order.seller : order.buyer),
      items: order.items.map((item) => this.toItemView(item)),
      dispatch: order.dispatchedAt
        ? {
            transporter: order.transporter,
            lrNumber: order.lrNumber,
            parcelCount: order.parcelCount,
            dispatchedAt: order.dispatchedAt.toISOString(),
          }
        : null,
      threadId,
      confirmedAt: order.confirmedAt ? order.confirmedAt.toISOString() : null,
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
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
    return {
      id: entity.id,
      orderId: entity.orderId,
      status: entity.status,
      reason: entity.reason,
      direction:
        entity.buyerCompanyId === viewerCompanyId
          ? OrderDirection.Buying
          : OrderDirection.Selling,
      items: entity.items.map((item) => ({
        id: item.id,
        orderItemId: item.orderItemId,
        name: item.name,
        requestedQuantity: item.requestedQuantity.toNumber(),
        approvedQuantity: decimal(item.approvedQuantity),
      })),
      escalatedFromReturnId: entity.escalatedFromReturnId,
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

  private toItemView(item: OrderItem): OrderItemView {
    return {
      id: item.id,
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      rate: decimal(item.rate),
      unit: item.unit,
      image: item.image,
      images: item.images,
      quantity: item.quantity.toNumber(),
      note: item.note,
    };
  }
}
