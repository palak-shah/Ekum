import { Injectable } from '@nestjs/common';
import type { Message } from '@prisma/client';
import { MessageType, type MessageReference } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';

function shortOrderLabel(id: string): string {
  const tail = id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return `Order #${tail || id.slice(-4)}`;
}

/**
 * Messages store a reference id, never a copy. This resolves those ids to live,
 * compact cards in a single batched pass per page, so a shared product/collection
 * always reflects its current name/image (or is flagged unavailable if deleted).
 */
@Injectable()
export class ReferenceResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    messages: Message[],
    viewerCompanyId?: string,
  ): Promise<Map<string, MessageReference>> {
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
            select: {
              id: true,
              name: true,
              coverImage: true,
              _count: { select: { products: true } },
              products: {
                orderBy: { position: 'asc' },
                take: 4,
                select: { product: { select: { images: true } } },
              },
            },
          })
        : Promise.resolve([]),
      orderIds.length
        ? this.prisma.order.findMany({
            where: { id: { in: [...new Set(orderIds)] } },
            select: {
              id: true,
              status: true,
              buyerCompanyId: true,
              sellerCompanyId: true,
              confirmedByCompanyId: true,
              buyer: { select: { name: true } },
              seller: { select: { name: true } },
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
        const images = (product?.images ?? []).filter(Boolean);
        references.set(message.id, {
          kind: 'product',
          id: message.referenceId,
          name: product?.name ?? null,
          image: images[0] ?? null,
          images: images.length > 0 ? images : null,
          available: Boolean(product),
        });
      } else if (message.type === MessageType.CollectionCard) {
        const collection = collectionById.get(message.referenceId);
        const designThumbs = (collection?.products ?? [])
          .map((row) => row.product.images[0])
          .filter((url): url is string => Boolean(url))
          .slice(0, 4);
        const fallback = designThumbs[0] ?? collection?.coverImage ?? null;
        const images =
          designThumbs.length > 0 ? designThumbs : fallback ? [fallback] : [];
        references.set(message.id, {
          kind: 'collection',
          id: message.referenceId,
          name: collection?.name ?? null,
          image: fallback,
          images: images.length > 0 ? images : null,
          itemCount: collection?._count.products ?? null,
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
        let counterpartName: string | null = null;
        let direction: 'buying' | 'selling' | null = null;
        let confirmedByName: string | null = null;
        if (order && viewerCompanyId) {
          if (order.buyerCompanyId === viewerCompanyId) {
            direction = 'buying';
            counterpartName = order.seller.name;
          } else if (order.sellerCompanyId === viewerCompanyId) {
            direction = 'selling';
            counterpartName = order.buyer.name;
          } else {
            counterpartName = order.seller.name;
          }
          if (order.confirmedByCompanyId === viewerCompanyId) {
            confirmedByName = 'you';
          } else if (order.confirmedByCompanyId === order.buyerCompanyId) {
            confirmedByName = order.buyer.name;
          } else if (order.confirmedByCompanyId === order.sellerCompanyId) {
            confirmedByName = order.seller.name;
          }
        }
        references.set(message.id, {
          kind: message.type === MessageType.Rate ? 'rate' : 'order',
          id: message.referenceId,
          name:
            message.type === MessageType.Rate
              ? 'Quote'
              : order
                ? shortOrderLabel(order.id)
                : 'Order',
          image: null,
          available: Boolean(order),
          status: order?.status ?? (typeof meta.status === 'string' ? meta.status : null),
          itemCount:
            order?._count.items ?? (typeof meta.itemCount === 'number' ? meta.itemCount : null),
          totalLabel:
            typeof meta.totalLabel === 'string'
              ? meta.totalLabel
              : totalFromItems > 0
                ? `₹${totalFromItems.toLocaleString('en-IN')}`
                : null,
          counterpartName,
          direction,
          buyerName: order?.buyer.name ?? null,
          sellerName: order?.seller.name ?? null,
          confirmedByName,
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
