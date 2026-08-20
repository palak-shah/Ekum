import { Injectable } from '@nestjs/common';
import type { Message } from '@prisma/client';
import {
  MessageType,
  OrderLineStatus,
  OrderStatus,
  inferOrderChatEvent,
  orderChatEventLabel,
  shortOrderLabel,
  type MessageReference,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';

/**
 * Messages store a reference id, never a copy. Product/collection cards resolve
 * to live name/image (or unavailable if deleted). Order/quote cards keep
 * rate totals from message metadata so the chat timeline stays immutable when
 * a later quote updates the live order lines.
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
      ...this.orderLineSystemIds(messages),
    ];

    const [products, collections, orders] = await Promise.all([
      productIds.length
        ? this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
              id: true,
              name: true,
              images: true,
              companyId: true,
              allowForward: true,
              company: { select: { id: true, name: true } },
            },
          })
        : Promise.resolve([]),
      collectionIds.length
        ? this.prisma.collection.findMany({
            where: { id: { in: collectionIds } },
            select: {
              id: true,
              name: true,
              coverImage: true,
              companyId: true,
              allowForward: true,
              company: { select: { id: true, name: true } },
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
              items: {
                // Images for card album; rate/lineStatus only for live Accept affordance.
                // Quote totals still come from frozen message metadata.
                select: { image: true, images: true, rate: true, lineStatus: true },
                take: 50,
              },
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
          ownerCompanyId: product?.company?.id ?? product?.companyId ?? null,
          ownerCompanyName: product?.company?.name ?? null,
          allowForward: product ? product.allowForward !== false : true,
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
          ownerCompanyId: collection?.company?.id ?? collection?.companyId ?? null,
          ownerCompanyName: collection?.company?.name ?? null,
          allowForward: collection ? collection.allowForward !== false : true,
          available: Boolean(collection),
        });
      } else if (
        message.type === MessageType.OrderCard ||
        message.type === MessageType.Rate ||
        this.isOrderLineSystem(message)
      ) {
        const order = orderById.get(message.referenceId);
        const meta = (message.metadata ?? {}) as Record<string, unknown>;
        const isRateCard = message.type === MessageType.Rate;
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
        // One primary thumb per line (images[0] or legacy image), max 4 for the card album.
        const previewImages = (order?.items ?? [])
          .map((item) => item.images[0] || item.image || null)
          .filter((url): url is string => Boolean(url))
          .slice(0, 4);

        // Totals are frozen on the message at send time. Never recompute from live
        // order lines — a later quote must not rewrite earlier order/quote cards.
        const totalLabel =
          typeof meta.totalLabel === 'string' && meta.totalLabel.trim()
            ? meta.totalLabel
            : null;

        const event = inferOrderChatEvent({
          messageType: message.type,
          metadata: meta,
        });
        const eventLabel = orderChatEventLabel(event, {
          messageType: message.type,
          metadataKind: typeof meta.kind === 'string' ? meta.kind : null,
          confirmedCount:
            typeof meta.confirmedCount === 'number' ? meta.confirmedCount : null,
          declinedCount:
            typeof meta.declinedCount === 'number' ? meta.declinedCount : null,
        });
        // Prefer frozen metadata so later cancellations do not rewrite older cards.
        const frozenStatus =
          typeof meta.status === 'string' && meta.status.trim() ? meta.status : null;
        const frozenOrderLabel =
          typeof meta.orderLabel === 'string' && meta.orderLabel.trim()
            ? meta.orderLabel
            : null;
        const frozenActorRaw =
          typeof meta.actorLabel === 'string' && meta.actorLabel.trim()
            ? meta.actorLabel.trim()
            : null;
        const frozenActorIsRole =
          !frozenActorRaw || /^(seller|buyer|they)$/i.test(frozenActorRaw);
        // Always resolve a business name for the actor — never leave Seller/Buyer/They.
        let actorLabel: string | null = frozenActorIsRole ? null : frozenActorRaw;
        if (!actorLabel && order) {
          const role = typeof meta.actorRole === 'string' ? meta.actorRole : null;
          if (role === 'buyer') actorLabel = order.buyer.name;
          else if (role === 'seller') actorLabel = order.seller.name;
          else if (message.senderCompanyId === order.buyerCompanyId) {
            actorLabel = order.buyer.name;
          } else if (message.senderCompanyId === order.sellerCompanyId) {
            actorLabel = order.seller.name;
          } else {
            actorLabel = order.seller.name;
          }
        }
        const frozenItemCount =
          typeof meta.itemCount === 'number' ? meta.itemCount : null;

        // Live affordance only — does not rewrite frozen status/event on the card.
        const canAcceptQuote =
          isRateCard &&
          Boolean(order) &&
          direction === 'buying' &&
          order!.status === OrderStatus.Requested &&
          order!.items.some(
            (item) => item.lineStatus === OrderLineStatus.Open && item.rate != null,
          );

        references.set(message.id, {
          kind: isRateCard ? 'rate' : 'order',
          id: message.referenceId,
          name: isRateCard
            ? 'Quote'
            : (frozenOrderLabel ?? (order ? shortOrderLabel(order.id) : 'Order')),
          image: previewImages[0] ?? null,
          images: previewImages.length > 0 ? previewImages : null,
          available: Boolean(order),
          status: frozenStatus,
          itemCount: frozenItemCount ?? order?._count.items ?? null,
          totalLabel,
          counterpartName,
          direction,
          buyerName: order?.buyer.name ?? null,
          sellerName: order?.seller.name ?? null,
          confirmedByName,
          event,
          eventLabel,
          orderLabel: frozenOrderLabel ?? (order ? shortOrderLabel(order.id) : null),
          actorLabel,
          canAcceptQuote,
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

  /** Legacy line-decision notices posted as system before order_card. */
  private isOrderLineSystem(message: Message): boolean {
    if (message.type !== MessageType.System || !message.referenceId) {
      return false;
    }
    const meta = (message.metadata ?? {}) as Record<string, unknown>;
    return meta.kind === 'order_lines';
  }

  private orderLineSystemIds(messages: Message[]): string[] {
    return messages
      .filter((message) => this.isOrderLineSystem(message))
      .map((message) => message.referenceId as string);
  }
}
