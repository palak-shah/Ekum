import { describe, expect, it } from 'vitest';
import type { Message } from '@prisma/client';
import { MessageType } from '@ekum/domain-types';
import { ReferenceResolver } from './reference-resolver';
import type { PrismaService } from '../core/prisma/prisma.service';

/**
 * Trust rule: source masking. A shared product/collection card resolves to the
 * live name/image but never carries its owning company — so forwarding a design
 * into a group does not disclose which supplier it came from. A deleted target
 * resolves as unavailable rather than leaking anything.
 */
function makeResolver() {
  const prisma = {
    product: {
      findMany: async () => [{ id: 'p1', name: 'Banarasi Silk', images: ['img1'] }],
    },
    collection: {
      findMany: async () => [
        {
          id: 'c1',
          name: 'Wedding Edit',
          coverImage: 'cover1',
          _count: { products: 2 },
          products: [
            { product: { images: ['d1'] } },
            { product: { images: ['d2'] } },
          ],
        },
      ],
    },
  } as unknown as PrismaService;
  return new ReferenceResolver(prisma);
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

describe('ReferenceResolver source masking', () => {
  it('resolves a product card without exposing the owning company', async () => {
    const resolver = makeResolver();
    const references = await resolver.resolve([
      message({ id: 'm1', type: MessageType.ProductCard, referenceId: 'p1' }),
    ]);
    const reference = references.get('m1');
    expect(reference).toBeDefined();
    expect(reference?.name).toBe('Banarasi Silk');
    expect(reference?.images).toEqual(['img1']);
    // The resolved card carries display fields — no source company.
    expect(Object.keys(reference ?? {}).sort()).toEqual(
      ['available', 'id', 'image', 'images', 'kind', 'name'].sort(),
    );
    const serialized = JSON.stringify(reference);
    expect(serialized).not.toMatch(/compan/i);
    expect(serialized).not.toMatch(/sender/i);
    expect(serialized).not.toMatch(/owner/i);
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
});
