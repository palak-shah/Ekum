import { Injectable } from '@nestjs/common';
import type { Message } from '@prisma/client';
import { MessageType, type MessageReference } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';

/**
 * Messages store a reference id, never a copy. This resolves those ids to live,
 * compact cards in a single batched pass per page, so a shared product/collection
 * always reflects its current name/image (or is flagged unavailable if deleted).
 */
@Injectable()
export class ReferenceResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(messages: Message[]): Promise<Map<string, MessageReference>> {
    const productIds = this.idsFor(messages, MessageType.ProductCard);
    const collectionIds = this.idsFor(messages, MessageType.CollectionCard);
    const orderIds = [
      ...this.idsFor(messages, MessageType.OrderCard),
      ...this.idsFor(messages, MessageType.Rate),
    ];

    const [products, collections, orders] = await Promise.all([
      productIds.length
        ? this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, images: true },
          })
        : Promise.resolve([]),
      collectionIds.length
        ? this.prisma.collection.findMany({
            where: { id: { in: collectionIds } },
            select: { id: true, name: true, coverImage: true },
          })
        : Promise.resolve([]),
      orderIds.length
        ? this.prisma.order.findMany({
            where: { id: { in: [...new Set(orderIds)] } },
            select: {
              id: true,
              status: true,
              _count: { select: { items: true } },
              items: { select: { rate: true, quantity: true }, take: 50 },
            },
          })
        : Promise.resolve([]),
    ]);

    const productById = new Map(products.map((product) => [product.id, product]));
    const collectionById = new Map(collections.map((collection) => [collection.id, collection]));
    const orderById = new Map(orders.map((order) => [order.id, order]));

    const references = new Map<string, MessageReference>();
    for (const message of messages) {
      if (!message.referenceId) {
        continue;
      }
      if (message.type === MessageType.ProductCard) {
        const product = productById.get(message.referenceId);
        references.set(message.id, {
          kind: 'product',
          id: message.referenceId,
          name: product?.name ?? null,
          image: product?.images[0] ?? null,
          available: Boolean(product),
        });
      } else if (message.type === MessageType.CollectionCard) {
        const collection = collectionById.get(message.referenceId);
        references.set(message.id, {
          kind: 'collection',
          id: message.referenceId,
          name: collection?.name ?? null,
          image: collection?.coverImage ?? null,
          available: Boolean(collection),
        });
      } else if (message.type === MessageType.OrderCard || message.type === MessageType.Rate) {
        const order = orderById.get(message.referenceId);
        const meta = (message.metadata ?? {}) as Record<string, unknown>;
        const totalFromItems = order
          ? order.items.reduce((sum, item) => {
              const rate = item.rate ? item.rate.toNumber() : 0;
              return sum + rate * item.quantity.toNumber();
            }, 0)
          : 0;
        references.set(message.id, {
          kind: message.type === MessageType.Rate ? 'rate' : 'order',
          id: message.referenceId,
          name: message.type === MessageType.Rate ? 'Quote' : 'Order',
          image: null,
          available: Boolean(order),
          status: order?.status ?? (typeof meta.status === 'string' ? meta.status : null),
          itemCount: order?._count.items ?? (typeof meta.itemCount === 'number' ? meta.itemCount : null),
          totalLabel:
            typeof meta.totalLabel === 'string'
              ? meta.totalLabel
              : totalFromItems > 0
                ? `₹${totalFromItems.toLocaleString('en-IN')}`
                : null,
        });
      }
    }
    return references;
  }

  private idsFor(messages: Message[], type: string): string[] {
    return messages
      .filter((message) => message.type === type && message.referenceId)
      .map((message) => message.referenceId as string);
  }
}
