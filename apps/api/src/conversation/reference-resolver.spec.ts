import { describe, expect, it } from 'vitest';
import type { Message } from '@prisma/client';
import { MessageType } from '@ekum/domain-types';
import { ReferenceResolver } from './reference-resolver';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';

/**
 * Product/collection cards resolve live name/image plus catalog owner company
 * (so forwards still show whose design it is). Deleted targets resolve unavailable.
 */
function makeVisibility(connected = true): VisibilityService {
  return {
    canViewCatalog: async () => connected,
  } as unknown as VisibilityService;
}

function makeResolver(opts?: { connected?: boolean; following?: boolean }) {
  const following = opts?.following ?? true;
  const prisma = {
    product: {
      findMany: async () => [
        {
          id: 'p1',
          name: 'Banarasi Silk',
          images: ['img1'],
          companyId: 'co1',
          allowForward: true,
          audience: 'everyone',
          audienceCompanyIds: [],
          company: { id: 'co1', name: 'Surat Silk House' },
        },
      ],
    },
    collection: {
      findMany: async () => [
        {
          id: 'c1',
          name: 'Wedding Edit',
          coverImage: 'cover1',
          companyId: 'co1',
          allowForward: false,
          audience: 'followers',
          audienceCompanyIds: [],
          company: { id: 'co1', name: 'Surat Silk House' },
          _count: { products: 2 },
          products: [
            { product: { images: ['d1'] } },
            { product: { images: ['d2'] } },
          ],
        },
      ],
    },
    order: {
      findMany: async () => [
        {
          id: 'ord1',
          status: 'requested',
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          facilitatorCompanyId: null,
          confirmedByCompanyId: null,
          downstreamOrderId: null,
          upstreamReleasedAt: null,
          buyer: { name: 'Jaipur Emporium' },
          seller: { name: 'Surat Silk House' },
          _count: { items: 3 },
          items: [
            {
              rate: null,
              lineStatus: 'open',
              quantity: { toNumber: () => 20 },
              image: 'a.jpg',
              images: ['a.jpg'],
            },
            {
              rate: null,
              lineStatus: 'open',
              quantity: { toNumber: () => 10 },
              image: 'b.jpg',
              images: [],
            },
            {
              rate: null,
              lineStatus: 'open',
              quantity: { toNumber: () => 5 },
              image: null,
              images: ['c.jpg', 'c2.jpg'],
            },
          ],
        },
      ],
    },
    follow: {
      findUnique: async () => (following ? { id: 'f1' } : null),
    },
    collectionViewGrant: {
      findMany: async () => [],
    },
  } as unknown as PrismaService;
  return new ReferenceResolver(prisma, makeVisibility(opts?.connected ?? true));
}

const message = (over: Partial<Message>): Message =>
  ({
    id: 'm',
    threadId: 't',
    senderCompanyId: 'sender',
    type: 'text',
    body: null,
    referenceId: null,
    metadata: null,
    createdAt: new Date(),
    ...over,
  }) as Message;

describe('ReferenceResolver catalog cards', () => {
  it('resolves a product card with catalog owner attribution', async () => {
    const resolver = makeResolver();
    const references = await resolver.resolve([
      message({ id: 'm1', type: MessageType.ProductCard, referenceId: 'p1' }),
    ]);
    const reference = references.get('m1');
    expect(reference).toBeDefined();
    expect(reference?.name).toBe('Banarasi Silk');
    expect(reference?.images).toEqual(['img1']);
    expect(reference?.ownerCompanyId).toBe('co1');
    expect(reference?.ownerCompanyName).toBe('Surat Silk House');
    expect(reference?.allowForward).toBe(true);
    expect(JSON.stringify(reference)).not.toMatch(/sender/i);
  });

  it('flags a deleted target as unavailable rather than leaking', async () => {
    const resolver = makeResolver();
    const references = await resolver.resolve([
      message({ id: 'm2', type: MessageType.ProductCard, referenceId: 'ghost' }),
    ]);
    const reference = references.get('m2');
    expect(reference?.available).toBe(false);
    expect(reference?.name).toBeNull();
  });

  it('keeps collection thumbs locked when the viewer lacks audience rights', async () => {
    const resolver = makeResolver({ following: false, connected: false });
    const references = await resolver.resolve(
      [message({ id: 'm-col', type: MessageType.CollectionCard, referenceId: 'c1' })],
      'meena',
    );
    const reference = references.get('m-col');
    expect(reference?.available).toBe(true);
    expect(reference?.name).toBe('Wedding Edit');
    expect(reference?.images).toEqual(['d1', 'd2']);
    expect(reference?.image).toBe('d1');
    expect(reference?.imagesLocked).toBe(true);
    expect(reference?.ownerCompanyName).toBe('Surat Silk House');
  });

  it('unlocks collection thumbs when the viewer is in audience', async () => {
    const resolver = makeResolver({ following: true, connected: false });
    const references = await resolver.resolve(
      [message({ id: 'm-col', type: MessageType.CollectionCard, referenceId: 'c1' })],
      'ravi',
    );
    const reference = references.get('m-col');
    expect(reference?.images).toEqual(['d1', 'd2']);
    expect(reference?.image).toBe('d1');
    expect(reference?.imagesLocked).toBe(false);
  });

  it('resolves order cards with all line photos for the viewer', async () => {
    const resolver = makeResolver();
    const references = await resolver.resolve(
      [message({ id: 'm3', type: MessageType.OrderCard, referenceId: 'ord1' })],
      'buyer',
    );
    const reference = references.get('m3');
    expect(reference?.kind).toBe('order');
    expect(reference?.images).toEqual(['a.jpg', 'b.jpg', 'c.jpg', 'c2.jpg']);
    expect(reference?.image).toBe('a.jpg');
    expect(reference?.itemCount).toBe(3);
  });

  it('strips order teasers for non-party viewers (no names / thumbs / amounts)', async () => {
    const resolver = makeResolver();
    const references = await resolver.resolve(
      [message({ id: 'm-fwd', type: MessageType.OrderCard, referenceId: 'ord1' })],
      'stranger',
    );
    const reference = references.get('m-fwd');
    expect(reference?.available).toBe(false);
    expect(reference?.name).toBe('Unavailable');
    expect(reference?.images).toEqual([]);
    expect(reference?.image).toBeNull();
    expect(reference?.buyerName).toBeNull();
    expect(reference?.sellerName).toBeNull();
    expect(reference?.counterpartName).toBeNull();
    expect(reference?.totalLabel).toBeNull();
    expect(reference?.orderLabel).toBeNull();
    expect(reference?.itemCount).toBeNull();
    expect(reference?.status).toBeNull();
  });

  it('resolves legacy system line-decision notices as order refs', async () => {
    const resolver = makeResolver();
    const references = await resolver.resolve(
      [
        message({
          id: 'm-sys',
          type: MessageType.System,
          referenceId: 'ord1',
          body: 'Seller confirmed 5 · declined 3.',
          metadata: { kind: 'order_lines', status: 'confirmed' },
        }),
      ],
      'buyer',
    );
    const reference = references.get('m-sys');
    expect(reference?.kind).toBe('order');
    expect(reference?.id).toBe('ord1');
    expect(reference?.available).toBe(true);
    expect(reference?.event).toBe('lines_decided');
    expect(reference?.eventLabel).toBe('Updated');
    expect(reference?.direction).toBe('buying');
  });

  it('keeps frozen requested status on a card even when the live order is cancelled', async () => {
    const prisma = {
      product: { findMany: async () => [] },
      collection: { findMany: async () => [] },
      order: {
        findMany: async () => [
          {
            id: 'ord1',
            status: 'cancelled',
            buyerCompanyId: 'buyer',
            sellerCompanyId: 'seller',
            confirmedByCompanyId: null,
            buyer: { name: 'Jaipur Emporium' },
            seller: { name: 'Surat Silk House' },
            _count: { items: 1 },
            items: [{ image: null, images: ['a.jpg'] }],
          },
        ],
      },
    } as unknown as PrismaService;
    const resolver = new ReferenceResolver(prisma, makeVisibility());
    const references = await resolver.resolve(
      [
        message({
          id: 'm-req',
          type: MessageType.OrderCard,
          referenceId: 'ord1',
          senderCompanyId: 'buyer',
          body: 'Buyer requested · Order #ORD1',
          metadata: {
            event: 'order_requested',
            status: 'requested',
            orderLabel: 'Order #ORD1',
            actorLabel: 'Buyer',
            actorRole: 'buyer',
            itemCount: 1,
          },
        }),
      ],
      'seller',
    );
    const reference = references.get('m-req');
    expect(reference?.status).toBe('requested');
    expect(reference?.event).toBe('order_requested');
    expect(reference?.eventLabel).toBe('Requested');
    expect(reference?.orderLabel).toBe('Order #ORD1');
    // Legacy "Buyer" actorLabel must resolve to the real business name.
    expect(reference?.actorLabel).toBe('Jaipur Emporium');
  });
});

describe('ReferenceResolver order / quote timeline totals', () => {
  it('does not paint live rates onto an earlier order card after a quote', async () => {
    const prisma = {
      product: { findMany: async () => [] },
      collection: { findMany: async () => [] },
      order: {
        findMany: async () => [
          {
            id: 'ord1',
            status: 'requested',
            buyerCompanyId: 'buyer',
            sellerCompanyId: 'seller',
            confirmedByCompanyId: null,
            buyer: { name: 'Jaipur Emporium' },
            seller: { name: 'Surat Silk House' },
            _count: { items: 2 },
            items: [
              {
                rate: { toNumber: () => 100 },
                quantity: { toNumber: () => 10 },
                image: null,
                images: ['a.jpg'],
              },
              {
                rate: { toNumber: () => 50 },
                quantity: { toNumber: () => 4 },
                image: null,
                images: ['b.jpg'],
              },
            ],
          },
        ],
      },
    } as unknown as PrismaService;
    const resolver = new ReferenceResolver(prisma, makeVisibility());

    const references = await resolver.resolve(
      [
        message({
          id: 'm-order',
          type: MessageType.OrderCard,
          referenceId: 'ord1',
          metadata: { status: 'requested', itemCount: 2 },
        }),
        message({
          id: 'm-quote',
          type: MessageType.Rate,
          referenceId: 'ord1',
          metadata: {
            status: 'requested',
            itemCount: 2,
            totalLabel: '₹1,200',
            quoted: true,
          },
        }),
      ],
      'buyer',
    );

    expect(references.get('m-order')?.totalLabel).toBeNull();
    expect(references.get('m-quote')?.totalLabel).toBe('₹1,200');
  });

  it('keeps an older quote card total when a newer quote updates live lines', async () => {
    const prisma = {
      product: { findMany: async () => [] },
      collection: { findMany: async () => [] },
      order: {
        findMany: async () => [
          {
            id: 'ord1',
            status: 'requested',
            buyerCompanyId: 'buyer',
            sellerCompanyId: 'seller',
            confirmedByCompanyId: null,
            buyer: { name: 'Jaipur Emporium' },
            seller: { name: 'Surat Silk House' },
            _count: { items: 1 },
            items: [
              {
                rate: { toNumber: () => 999 },
                quantity: { toNumber: () => 1 },
                image: null,
                images: [],
              },
            ],
          },
        ],
      },
    } as unknown as PrismaService;
    const resolver = new ReferenceResolver(prisma, makeVisibility());

    const references = await resolver.resolve(
      [
        message({
          id: 'm-old',
          type: MessageType.Rate,
          referenceId: 'ord1',
          metadata: { totalLabel: '₹500', quoted: true },
        }),
        message({
          id: 'm-new',
          type: MessageType.Rate,
          referenceId: 'ord1',
          metadata: { totalLabel: '₹999', quoted: true },
        }),
      ],
      'buyer',
    );

    expect(references.get('m-old')?.totalLabel).toBe('₹500');
    expect(references.get('m-new')?.totalLabel).toBe('₹999');
  });
});

describe('ReferenceResolver canAcceptQuote live affordance', () => {
  it('is true for buyer when live order is still requested with a rated open line', async () => {
    const prisma = {
      product: { findMany: async () => [] },
      collection: { findMany: async () => [] },
      order: {
        findMany: async () => [
          {
            id: 'ord1',
            status: 'requested',
            buyerCompanyId: 'buyer',
            sellerCompanyId: 'seller',
            confirmedByCompanyId: null,
            buyer: { name: 'Jaipur Emporium' },
            seller: { name: 'Surat Silk House' },
            _count: { items: 1 },
            items: [
              {
                rate: 150,
                lineStatus: 'open',
                image: null,
                images: ['a.jpg'],
              },
            ],
          },
        ],
      },
    } as unknown as PrismaService;
    const resolver = new ReferenceResolver(prisma, makeVisibility());
    const references = await resolver.resolve(
      [
        message({
          id: 'm-quote',
          type: MessageType.Rate,
          referenceId: 'ord1',
          senderCompanyId: 'seller',
          metadata: {
            event: 'quote_sent',
            status: 'requested',
            totalLabel: '₹3,000',
            quoted: true,
          },
        }),
      ],
      'buyer',
    );
    const reference = references.get('m-quote');
    expect(reference?.status).toBe('requested');
    expect(reference?.canAcceptQuote).toBe(true);
  });

  it('is false after live order is confirmed; frozen status stays requested', async () => {
    const prisma = {
      product: { findMany: async () => [] },
      collection: { findMany: async () => [] },
      order: {
        findMany: async () => [
          {
            id: 'ord1',
            status: 'confirmed',
            buyerCompanyId: 'buyer',
            sellerCompanyId: 'seller',
            confirmedByCompanyId: 'buyer',
            buyer: { name: 'Jaipur Emporium' },
            seller: { name: 'Surat Silk House' },
            _count: { items: 1 },
            items: [
              {
                rate: 150,
                lineStatus: 'confirmed',
                image: null,
                images: ['a.jpg'],
              },
            ],
          },
        ],
      },
    } as unknown as PrismaService;
    const resolver = new ReferenceResolver(prisma, makeVisibility());
    const references = await resolver.resolve(
      [
        message({
          id: 'm-quote',
          type: MessageType.Rate,
          referenceId: 'ord1',
          senderCompanyId: 'seller',
          metadata: {
            event: 'quote_sent',
            status: 'requested',
            totalLabel: '₹3,000',
            quoted: true,
          },
        }),
      ],
      'buyer',
    );
    const reference = references.get('m-quote');
    expect(reference?.status).toBe('requested');
    expect(reference?.event).toBe('quote_sent');
    expect(reference?.canAcceptQuote).toBe(false);
  });

  it('is false for the seller even when the quote is still open', async () => {
    const prisma = {
      product: { findMany: async () => [] },
      collection: { findMany: async () => [] },
      order: {
        findMany: async () => [
          {
            id: 'ord1',
            status: 'requested',
            buyerCompanyId: 'buyer',
            sellerCompanyId: 'seller',
            confirmedByCompanyId: null,
            buyer: { name: 'Jaipur Emporium' },
            seller: { name: 'Surat Silk House' },
            _count: { items: 1 },
            items: [{ rate: 150, lineStatus: 'open', image: null, images: [] }],
          },
        ],
      },
    } as unknown as PrismaService;
    const resolver = new ReferenceResolver(prisma, makeVisibility());
    const references = await resolver.resolve(
      [
        message({
          id: 'm-quote',
          type: MessageType.Rate,
          referenceId: 'ord1',
          senderCompanyId: 'seller',
          metadata: { event: 'quote_sent', status: 'requested', quoted: true },
        }),
      ],
      'seller',
    );
    expect(references.get('m-quote')?.canAcceptQuote).toBe(false);
  });
});

describe('ReferenceResolver payment cards', () => {
  it('resolves amount and open status', async () => {
    const prisma = {
      product: { findMany: async () => [] },
      collection: { findMany: async () => [] },
      order: { findMany: async () => [] },
      paymentRequest: {
        findMany: async () => [
          {
            id: 'pay-1',
            orderId: 'ord1',
            amount: { toNumber: () => 2500 },
            status: 'open',
          },
        ],
      },
    } as unknown as PrismaService;
    const resolver = new ReferenceResolver(prisma, makeVisibility());
    const references = await resolver.resolve([
      message({
        id: 'm-pay',
        type: MessageType.PaymentCard,
        referenceId: 'pay-1',
      }),
    ]);
    const reference = references.get('m-pay');
    expect(reference?.kind).toBe('payment');
    expect(reference?.name).toBe('Payment · ₹2,500');
    expect(reference?.status).toBe('open');
    expect(reference?.totalLabel).toBe('₹2,500');
    expect(reference?.available).toBe(true);
  });
});

