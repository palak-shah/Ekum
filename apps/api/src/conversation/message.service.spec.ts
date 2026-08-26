import { describe, expect, it } from 'vitest';
import { MessageType, type SendMessageDto } from '@ekum/domain-types';
import { MessageService } from './message.service';
import type { AuthPrincipal } from '../auth/auth.types';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { ThreadService } from './thread.service';
import type { ConversationSerializer } from './conversation.serializer';
import type { ReferenceResolver } from './reference-resolver';
import type { DomainEvents } from '../events/events.module';

const activeMembership = { id: 'p', state: 'active' };
const events = { messageSent: () => undefined } as unknown as DomainEvents;

function actor(companyId: string, role = 'owner'): AuthPrincipal {
  return { userId: 'u1', companyId, phone: '+910000000000', role, permissions: null };
}

describe('MessageService.send', () => {
  it('rejects sharing a product the sender does not own and has not received in chat', async () => {
    const prisma = {
      product: { findFirst: async () => null },
      message: { findFirst: async () => null },
    } as unknown as PrismaService;
    const threads = { membershipOrThrow: async () => activeMembership } as unknown as ThreadService;
    const service = new MessageService(
      prisma,
      threads,
      {} as ConversationSerializer,
      {} as ReferenceResolver,
      events,
    );
    const dto = { type: MessageType.ProductCard, referenceId: 'not-mine' } as SendMessageDto;
    await expect(service.send(actor('me'), 't', dto)).rejects.toThrow();
  });

  it('allows forwarding a product already shared into the sender chat', async () => {
    const created = {
      id: 'm1',
      threadId: 't2',
      senderCompanyId: 'me',
      type: MessageType.ProductCard,
      body: 'Banarasi',
      referenceId: 'p1',
      metadata: null,
      createdAt: new Date(),
    };
    const prisma = {
      product: {
        findFirst: async () => ({
          id: 'p1',
          companyId: 'supplier',
          allowForward: true,
        }),
      },
      message: { findFirst: async () => ({ id: 'prior' }) },
      $transaction: async (fn: (tx: unknown) => unknown) =>
        fn({
          message: { create: async () => created },
          thread: { update: async () => ({}) },
          threadParticipant: { update: async () => ({}) },
        }),
      threadParticipant: { findMany: async () => [] },
      user: { findUnique: async () => ({ name: 'Owner' }) },
    } as unknown as PrismaService;
    const threads = { membershipOrThrow: async () => activeMembership } as unknown as ThreadService;
    const serializer = {
      toMessageView: (message: { id: string }) => ({ id: message.id, mine: true }),
    } as unknown as ConversationSerializer;
    const references = {
      resolve: async () =>
        new Map([['m1', { kind: 'product', id: 'p1', name: 'Banarasi', image: null, available: true }]]),
    } as unknown as ReferenceResolver;
    const service = new MessageService(prisma, threads, serializer, references, events);
    const dto = {
      type: MessageType.ProductCard,
      referenceId: 'p1',
      body: 'Banarasi',
    } as SendMessageDto;
    await expect(service.send(actor('me'), 't2', dto)).resolves.toMatchObject({ id: 'm1' });
  });

  it('rejects non-owner forward when allowForward is false', async () => {
    const prisma = {
      product: {
        findFirst: async () => ({
          id: 'p1',
          companyId: 'supplier',
          allowForward: false,
        }),
      },
      message: { findFirst: async () => ({ id: 'prior' }) },
    } as unknown as PrismaService;
    const threads = { membershipOrThrow: async () => activeMembership } as unknown as ThreadService;
    const service = new MessageService(
      prisma,
      threads,
      {} as ConversationSerializer,
      {} as ReferenceResolver,
      events,
    );
    const dto = {
      type: MessageType.ProductCard,
      referenceId: 'p1',
    } as SendMessageDto;
    try {
      await service.send(actor('me'), 't2', dto);
      expect.fail('expected FORWARD_NOT_ALLOWED');
    } catch (error) {
      expect((error as { getResponse: () => unknown }).getResponse()).toMatchObject({
        code: 'FORWARD_NOT_ALLOWED',
      });
    }
  });

  it('allows the catalog owner to share even when allowForward is false', async () => {
    const created = {
      id: 'm1',
      threadId: 't2',
      senderCompanyId: 'supplier',
      type: MessageType.ProductCard,
      body: null,
      referenceId: 'p1',
      metadata: null,
      createdAt: new Date(),
    };
    const prisma = {
      product: {
        findFirst: async () => ({
          id: 'p1',
          companyId: 'supplier',
          allowForward: false,
        }),
      },
      message: { findFirst: async () => null },
      $transaction: async (fn: (tx: unknown) => unknown) =>
        fn({
          message: { create: async () => created },
          thread: { update: async () => ({}) },
          threadParticipant: { update: async () => ({}) },
        }),
      threadParticipant: { findMany: async () => [] },
      user: { findUnique: async () => ({ name: 'Owner' }) },
    } as unknown as PrismaService;
    const threads = { membershipOrThrow: async () => activeMembership } as unknown as ThreadService;
    const serializer = {
      toMessageView: (message: { id: string }) => ({ id: message.id, mine: true }),
    } as unknown as ConversationSerializer;
    const references = {
      resolve: async () =>
        new Map([
          [
            'm1',
            {
              kind: 'product',
              id: 'p1',
              name: 'Banarasi',
              image: null,
              available: true,
              allowForward: false,
            },
          ],
        ]),
    } as unknown as ReferenceResolver;
    const service = new MessageService(prisma, threads, serializer, references, events);
    const dto = {
      type: MessageType.ProductCard,
      referenceId: 'p1',
    } as SendMessageDto;
    await expect(service.send(actor('supplier'), 't2', dto)).resolves.toMatchObject({
      id: 'm1',
    });
  });

  it('sends a text message through the thread transaction', async () => {
    const created = {
      id: 'm1',
      threadId: 't',
      senderCompanyId: 'me',
      type: 'text',
      body: 'hello',
      referenceId: null,
      metadata: null,
      createdAt: new Date(),
    };
    const prisma = {
      $transaction: async (fn: (tx: unknown) => unknown) =>
        fn({
          message: { create: async () => created },
          thread: { update: async () => ({}) },
          threadParticipant: { update: async () => ({}) },
        }),
      threadParticipant: { findMany: async () => [] },
      user: { findUnique: async () => ({ name: 'Owner' }) },
    } as unknown as PrismaService;
    const threads = {
      membershipOrThrow: async () => ({ id: 'p', state: 'pending' }),
    } as unknown as ThreadService;
    const serializer = {
      toMessageView: (message: { id: string }) => ({ id: message.id, mine: true }),
    } as unknown as ConversationSerializer;
    const references = { resolve: async () => new Map() } as unknown as ReferenceResolver;
    const service = new MessageService(prisma, threads, serializer, references, events);

    const dto = { type: MessageType.Text, body: 'hello' } as SendMessageDto;
    await expect(service.send(actor('me'), 't', dto)).resolves.toMatchObject({ id: 'm1' });
  });
});

describe('MessageService.list filters', () => {
  function listService(captured: { where: unknown }) {
    const rows = [
      {
        id: 'm-photo',
        threadId: 't',
        senderCompanyId: 'me',
        type: MessageType.Photo,
        body: 'https://img/a.jpg',
        referenceId: null,
        metadata: { urls: ['https://img/a.jpg'] },
        createdAt: new Date(),
      },
      {
        id: 'm-order',
        threadId: 't',
        senderCompanyId: 'me',
        type: MessageType.OrderCard,
        body: 'asked for rates',
        referenceId: 'o1',
        metadata: { orderLabel: 'Inquiry #O1AB', event: 'rate_requested' },
        createdAt: new Date(),
      },
      {
        id: 'm-text',
        threadId: 't',
        senderCompanyId: 'me',
        type: MessageType.Text,
        body: 'Wedding edit please',
        referenceId: null,
        metadata: null,
        createdAt: new Date(),
      },
    ];
    const prisma = {
      message: {
        findMany: async (args: { where: unknown; take: number }) => {
          captured.where = args.where;
          return rows.slice(0, args.take);
        },
      },
      $queryRaw: async () => [] as { id: string }[],
      product: { findMany: async () => [] },
      collection: { findMany: async () => [] },
    } as unknown as PrismaService;
    const threads = { membershipOrThrow: async () => activeMembership } as unknown as ThreadService;
    const serializer = {
      toMessageView: (message: { id: string }) => ({ id: message.id, mine: true }),
    } as unknown as ConversationSerializer;
    const references = { resolve: async () => new Map() } as unknown as ReferenceResolver;
    return new MessageService(prisma, threads, serializer, references, events);
  }

  it('scopes photos to photo only', async () => {
    const captured: { where: unknown } = { where: null };
    const service = listService(captured);
    await service.list(actor('me'), 't', { view: 'photos', limit: 20 });
    expect(captured.where).toMatchObject({
      AND: expect.arrayContaining([
        { threadId: 't' },
        { type: MessageType.Photo },
      ]),
    });
  });

  it('scopes collections to collection_card', async () => {
    const captured: { where: unknown } = { where: null };
    const service = listService(captured);
    await service.list(actor('me'), 't', { view: 'collections', limit: 20 });
    expect(captured.where).toMatchObject({
      AND: expect.arrayContaining([
        { threadId: 't' },
        { type: MessageType.CollectionCard },
      ]),
    });
  });

  it('scopes designs to product_card', async () => {
    const captured: { where: unknown } = { where: null };
    const service = listService(captured);
    await service.list(actor('me'), 't', { view: 'designs', limit: 20 });
    expect(captured.where).toMatchObject({
      AND: expect.arrayContaining([
        { threadId: 't' },
        { type: MessageType.ProductCard },
      ]),
    });
  });

  it('scopes media (legacy) to photo and voice', async () => {
    const captured: { where: unknown } = { where: null };
    const service = listService(captured);
    await service.list(actor('me'), 't', { view: 'media', limit: 20 });
    expect(captured.where).toMatchObject({
      AND: expect.arrayContaining([
        { threadId: 't' },
        { type: { in: [MessageType.Photo, MessageType.Voice] } },
      ]),
    });
  });

  it('scopes orders to order_card, rate, and legacy system notices', async () => {
    const captured: { where: unknown } = { where: null };
    const service = listService(captured);
    await service.list(actor('me'), 't', { view: 'orders', limit: 20 });
    expect(captured.where).toMatchObject({
      AND: expect.arrayContaining([
        { threadId: 't' },
        {
          OR: expect.arrayContaining([
            { type: { in: [MessageType.OrderCard, MessageType.Rate] } },
          ]),
        },
      ]),
    });
  });

  it('applies case-insensitive body search with q', async () => {
    const captured: { where: unknown } = { where: null };
    const service = listService(captured);
    await service.list(actor('me'), 't', { view: 'all', q: 'Wedding', limit: 20 });
    expect(captured.where).toMatchObject({
      AND: expect.arrayContaining([
        { threadId: 't' },
        {
          OR: expect.arrayContaining([
            { body: { contains: 'Wedding', mode: 'insensitive' } },
          ]),
        },
      ]),
    });
  });

  it('includes orderLabel match ids from case-insensitive raw lookup', async () => {
    const captured: { where: unknown } = { where: null };
    const rows = [
      {
        id: 'm-photo',
        threadId: 't',
        senderCompanyId: 'me',
        type: MessageType.Photo,
        body: 'https://img/a.jpg',
        referenceId: null,
        metadata: { urls: ['https://img/a.jpg'] },
        createdAt: new Date(),
      },
    ];
    const prisma = {
      message: {
        findMany: async (args: { where: unknown; take: number }) => {
          captured.where = args.where;
          return rows.slice(0, args.take);
        },
      },
      $queryRaw: async () => [{ id: 'm-order-hit' }],
      product: { findMany: async () => [] },
      collection: { findMany: async () => [] },
    } as unknown as PrismaService;
    const threads = { membershipOrThrow: async () => activeMembership } as unknown as ThreadService;
    const serializer = {
      toMessageView: (message: { id: string }) => ({ id: message.id, mine: true }),
    } as unknown as ConversationSerializer;
    const references = { resolve: async () => new Map() } as unknown as ReferenceResolver;
    const service = new MessageService(prisma, threads, serializer, references, events);
    await service.list(actor('me'), 't', { view: 'all', q: 'okyd', limit: 20 });
    expect(captured.where).toMatchObject({
      AND: expect.arrayContaining([
        { threadId: 't' },
        {
          OR: expect.arrayContaining([
            { body: { contains: 'okyd', mode: 'insensitive' } },
            { id: { in: ['m-order-hit'] } },
          ]),
        },
      ]),
    });
  });
});
