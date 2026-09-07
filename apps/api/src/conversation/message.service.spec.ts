import { describe, expect, it } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { MessageType, type SendMessageDto } from '@ekum/domain-types';
import { MessageService } from './message.service';
import type { AuthPrincipal } from '../auth/auth.types';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';
import type { ThreadService } from './thread.service';
import type { ConversationSerializer } from './conversation.serializer';
import type { ReferenceResolver } from './reference-resolver';
import type { DomainEvents } from '../events/events.module';

const activeMembership = { id: 'p', state: 'active' };
const events = { messageSent: () => undefined } as unknown as DomainEvents;

function visibilityStub(opts?: {
  connected?: boolean;
  blocked?: boolean;
}): VisibilityService {
  return {
    canViewCatalog: async () => opts?.connected ?? false,
    isBlocked: async () => opts?.blocked ?? false,
  } as unknown as VisibilityService;
}

function threadStub(membership = activeMembership) {
  return {
    membershipOrThrow: async () => membership,
    nudgeArchivedRecipients: async () => [],
    notifyUserIdsForMessage: async () => ({ companyIds: [], userIds: [] }),
  } as unknown as ThreadService;
}

function actor(companyId: string, role = 'owner'): AuthPrincipal {
  return { userId: 'u1', companyId, phone: '+910000000000', role, permissions: null };
}

describe('MessageService.send', () => {
  it('rejects when actor has no active company', async () => {
    const threads = {
      membershipOrThrow: async () => {
        expect.fail('membershipOrThrow should not run without a company');
      },
    } as unknown as ThreadService;
    const service = new MessageService(
      {} as PrismaService,
      threads,
      {} as ConversationSerializer,
      {} as ReferenceResolver,
      events,
      visibilityStub(),
    );
    const dto = { type: MessageType.Text, body: 'hi' } as SendMessageDto;
    await expect(
      service.send(
        { userId: 'u1', companyId: null, phone: '+910000000000', role: null, permissions: null },
        't',
        dto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects sharing a product the sender does not own and has not received in chat', async () => {
    const prisma = {
      product: { findFirst: async () => null },
      message: { findFirst: async () => null },
    } as unknown as PrismaService;
    const threads = threadStub();
    const service = new MessageService(
      prisma,
      threads,
      {} as ConversationSerializer,
      {} as ReferenceResolver,
      events,
      visibilityStub(),
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
    const threads = threadStub();
    const serializer = {
      toMessageView: (message: { id: string }) => ({ id: message.id, mine: true }),
    } as unknown as ConversationSerializer;
    const references = {
      resolve: async () =>
        new Map([['m1', { kind: 'product', id: 'p1', name: 'Banarasi', image: null, available: true }]]),
    } as unknown as ReferenceResolver;
    const service = new MessageService(prisma, threads, serializer, references, events, visibilityStub());
    const dto = {
      type: MessageType.ProductCard,
      referenceId: 'p1',
      body: 'Banarasi',
    } as SendMessageDto;
    await expect(service.send(actor('me'), 't2', dto)).resolves.toMatchObject({ id: 'm1' });
  });

  it('allows non-owner forward when allowForward is false', async () => {
    const created = {
      id: 'm1',
      threadId: 't2',
      senderCompanyId: 'me',
      type: MessageType.ProductCard,
      body: null,
      referenceId: 'p1',
    };
    const prisma = {
      product: {
        findFirst: async () => ({
          id: 'p1',
          companyId: 'supplier',
          allowForward: false,
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
    const threads = threadStub();
    const serializer = {
      toMessageView: (row: { id: string }) => ({ id: row.id }),
    } as unknown as ConversationSerializer;
    const references = {
      resolve: async () =>
        new Map([['m1', { kind: 'product', id: 'p1', name: 'Banarasi', image: null, available: true }]]),
    } as unknown as ReferenceResolver;
    const service = new MessageService(prisma, threads, serializer, references, events, visibilityStub());
    const dto = {
      type: MessageType.ProductCard,
      referenceId: 'p1',
    } as SendMessageDto;
    await expect(service.send(actor('me'), 't2', dto)).resolves.toMatchObject({ id: 'm1' });
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
    const threads = threadStub();
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
    const service = new MessageService(prisma, threads, serializer, references, events, visibilityStub());
    const dto = {
      type: MessageType.ProductCard,
      referenceId: 'p1',
    } as SendMessageDto;
    await expect(service.send(actor('supplier'), 't2', dto)).resolves.toMatchObject({
      id: 'm1',
    });
  });

  it('allows chat-share of a Followers pack without sender follow (Forward free)', async () => {
    const created = {
      id: 'm1',
      threadId: 't2',
      senderCompanyId: 'ravi',
      type: MessageType.CollectionCard,
      body: 'Kavita pack',
      referenceId: 'col-1',
      metadata: null,
      createdAt: new Date(),
    };
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'kavita',
          status: 'published',
          startsAt: null,
          endsAt: null,
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
      user: { findUnique: async () => ({ name: 'Ravi' }) },
    } as unknown as PrismaService;
    const threads = threadStub();
    const serializer = {
      toMessageView: (message: { id: string }) => ({ id: message.id, mine: true }),
    } as unknown as ConversationSerializer;
    const references = {
      resolve: async () =>
        new Map([
          [
            'm1',
            {
              kind: 'collection',
              id: 'col-1',
              name: 'Kavita pack',
              image: null,
              available: true,
            },
          ],
        ]),
    } as unknown as ReferenceResolver;
    const service = new MessageService(
      prisma,
      threads,
      serializer,
      references,
      events,
      visibilityStub(),
    );
    const dto = {
      type: MessageType.CollectionCard,
      referenceId: 'col-1',
      body: 'Kavita pack',
    } as SendMessageDto;
    await expect(service.send(actor('ravi'), 't2', dto)).resolves.toMatchObject({ id: 'm1' });
  });

  it('rejects chat-share when the catalog owner has blocked the sender', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'kavita',
          status: 'published',
          startsAt: null,
          endsAt: null,
        }),
      },
      message: { findFirst: async () => null },
    } as unknown as PrismaService;
    const service = new MessageService(
      prisma,
      threadStub(),
      {} as ConversationSerializer,
      {} as ReferenceResolver,
      events,
      visibilityStub({ blocked: true }),
    );
    const dto = {
      type: MessageType.CollectionCard,
      referenceId: 'col-1',
    } as SendMessageDto;
    await expect(service.send(actor('ravi'), 't2', dto)).rejects.toThrow();
  });

  it('rejects chat-share of a draft pack the sender does not own', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'kavita',
          status: 'draft',
          startsAt: null,
          endsAt: null,
        }),
      },
      message: { findFirst: async () => null },
    } as unknown as PrismaService;
    const service = new MessageService(
      prisma,
      threadStub(),
      {} as ConversationSerializer,
      {} as ReferenceResolver,
      events,
      visibilityStub(),
    );
    const dto = {
      type: MessageType.CollectionCard,
      referenceId: 'col-1',
    } as SendMessageDto;
    await expect(service.send(actor('ravi'), 't2', dto)).rejects.toThrow();
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
    const threads = threadStub({ id: 'p', state: 'pending' });
    const serializer = {
      toMessageView: (message: { id: string }) => ({ id: message.id, mine: true }),
    } as unknown as ConversationSerializer;
    const references = { resolve: async () => new Map() } as unknown as ReferenceResolver;
    const service = new MessageService(prisma, threads, serializer, references, events, visibilityStub());

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
      messageStar: { findMany: async () => [] },
      $queryRaw: async () => [] as { id: string }[],
      product: { findMany: async () => [] },
      collection: { findMany: async () => [] },
    } as unknown as PrismaService;
    const threads = threadStub();
    const serializer = {
      toMessageView: (message: { id: string }) => ({ id: message.id, mine: true }),
    } as unknown as ConversationSerializer;
    const references = { resolve: async () => new Map() } as unknown as ReferenceResolver;
    return new MessageService(prisma, threads, serializer, references, events, visibilityStub());
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
      messageStar: { findMany: async () => [] },
      $queryRaw: async () => [{ id: 'm-order-hit' }],
      product: { findMany: async () => [] },
      collection: { findMany: async () => [] },
    } as unknown as PrismaService;
    const threads = threadStub();
    const serializer = {
      toMessageView: (message: { id: string }) => ({ id: message.id, mine: true }),
    } as unknown as ConversationSerializer;
    const references = { resolve: async () => new Map() } as unknown as ReferenceResolver;
    const service = new MessageService(prisma, threads, serializer, references, events, visibilityStub());
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

describe('MessageService edit / hide / delete / star', () => {
  function baseMessage(over: Record<string, unknown> = {}) {
    return {
      id: 'm1',
      threadId: 't',
      senderCompanyId: 'me',
      senderUserId: 'u1',
      senderName: 'Me',
      type: MessageType.Text,
      body: 'hello',
      referenceId: null,
      metadata: null,
      replyToMessageId: null,
      createdAt: new Date(),
      editedAt: null,
      deletedForEveryoneAt: null,
      ...over,
    };
  }

  it('edits own text within the window', async () => {
    const original = baseMessage();
    const updated = { ...original, body: 'edited', editedAt: new Date() };
    const prisma = {
      message: {
        findFirst: async () => original,
        update: async () => updated,
      },
      messageStar: { findMany: async () => [] },
    } as unknown as PrismaService;
    const serializer = {
      toMessageView: () => ({ id: 'm1', body: 'edited', editedAt: new Date().toISOString() }),
    } as unknown as ConversationSerializer;
    const references = { resolve: async () => new Map() } as unknown as ReferenceResolver;
    const service = new MessageService(
      prisma,
      threadStub(),
      serializer,
      references,
      events,
      visibilityStub(),
    );
    const view = await service.edit(actor('me'), 't', 'm1', 'edited');
    expect(view.body).toBe('edited');
  });

  it('rejects edit after the window', async () => {
    const original = baseMessage({
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    });
    const prisma = {
      message: { findFirst: async () => original },
    } as unknown as PrismaService;
    const service = new MessageService(
      prisma,
      threadStub(),
      {} as ConversationSerializer,
      {} as ReferenceResolver,
      events,
      visibilityStub(),
    );
    await expect(service.edit(actor('me'), 't', 'm1', 'late')).rejects.toThrow(/EDIT_WINDOW|Edit window/);
  });

  it('hides a message for the actor company', async () => {
    let upserted: unknown;
    const prisma = {
      message: { findFirst: async () => baseMessage() },
      messageHide: {
        upsert: async (args: unknown) => {
          upserted = args;
          return {};
        },
      },
    } as unknown as PrismaService;
    const service = new MessageService(
      prisma,
      threadStub(),
      {} as ConversationSerializer,
      {} as ReferenceResolver,
      events,
      visibilityStub(),
    );
    await expect(service.hide(actor('me'), 't', 'm1')).resolves.toEqual({ ok: true });
    expect(upserted).toMatchObject({
      where: { companyId_messageId: { companyId: 'me', messageId: 'm1' } },
    });
  });

  it('deletes for everyone within one hour and clears body', async () => {
    const original = baseMessage();
    let updateData: Record<string, unknown> | undefined;
    const prisma = {
      message: {
        findFirst: async () => original,
        update: async ({ data }: { data: Record<string, unknown> }) => {
          updateData = data;
          return { ...original, ...data, body: null };
        },
      },
      messageStar: { findMany: async () => [] },
    } as unknown as PrismaService;
    const serializer = {
      toMessageView: () => ({
        id: 'm1',
        deletedForEveryone: true,
        body: null,
      }),
    } as unknown as ConversationSerializer;
    const references = { resolve: async () => new Map() } as unknown as ReferenceResolver;
    const service = new MessageService(
      prisma,
      threadStub(),
      serializer,
      references,
      events,
      visibilityStub(),
    );
    const view = await service.deleteForEveryone(actor('me'), 't', 'm1');
    expect(view.deletedForEveryone).toBe(true);
    expect(updateData?.body).toBeNull();
    expect(updateData?.deletedForEveryoneAt).toBeInstanceOf(Date);
  });

  it('rejects delete for everyone after one hour', async () => {
    const original = baseMessage({
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });
    const prisma = {
      message: { findFirst: async () => original },
    } as unknown as PrismaService;
    const service = new MessageService(
      prisma,
      threadStub(),
      {} as ConversationSerializer,
      {} as ReferenceResolver,
      events,
      visibilityStub(),
    );
    await expect(service.deleteForEveryone(actor('me'), 't', 'm1')).rejects.toThrow(
      /DELETE_WINDOW|Delete for everyone/,
    );
  });

  it('excludes company hides from list where', async () => {
    let whereArg: unknown;
    const prisma = {
      message: {
        findMany: async ({ where }: { where: unknown }) => {
          whereArg = where;
          return [];
        },
      },
      messageStar: { findMany: async () => [] },
    } as unknown as PrismaService;
    const references = { resolve: async () => new Map() } as unknown as ReferenceResolver;
    const service = new MessageService(
      prisma,
      threadStub(),
      {} as ConversationSerializer,
      references,
      events,
      visibilityStub(),
    );
    await service.list(actor('me'), 't', { view: 'all', limit: 20 });
    expect(whereArg).toMatchObject({
      AND: expect.arrayContaining([
        { threadId: 't' },
        { NOT: { hides: { some: { companyId: 'me' } } } },
      ]),
    });
  });

  it('rejects forwarding an order the actor is not a party on', async () => {
    const prisma = {
      order: { findFirst: async () => null },
      message: { create: async () => expect.fail('should not create') },
    } as unknown as PrismaService;
    const service = new MessageService(
      prisma,
      threadStub(),
      {} as ConversationSerializer,
      {} as ReferenceResolver,
      events,
      visibilityStub(),
    );
    await expect(
      service.send(actor('me'), 't', {
        type: MessageType.OrderCard,
        referenceId: 'ord-other',
      } as SendMessageDto),
    ).rejects.toThrow();
  });
});
