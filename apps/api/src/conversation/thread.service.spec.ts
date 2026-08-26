import { describe, expect, it } from 'vitest';
import { ThreadParticipantState, ThreadVisibility } from '@ekum/domain-types';
import { ThreadService } from './thread.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';
import type { ConversationSerializer } from './conversation.serializer';
import type { ReferenceResolver } from './reference-resolver';

interface CreatedData {
  data: { participants: { create: { companyId: string; state: string }[] } } | null;
}

function makeStartDirectService(options: { blocked?: boolean; connected?: boolean }) {
  const created: CreatedData = { data: null };
  const prisma = {
    company: { findUnique: async () => ({ id: 'target' }) },
    thread: {
      findFirst: async () => null,
      create: async (args: { data: CreatedData['data'] }) => {
        created.data = args.data;
        return { id: 't1' };
      },
      findUnique: async () => ({
        id: 't1',
        type: 'direct',
        visibility: 'shared',
        title: null,
        lastMessageAt: new Date(),
        participants: [
          {
            id: 'p-me',
            companyId: 'me',
            state: 'active',
            alertLevel: 'all',
            lastReadAt: null,
            leftAt: null,
            company: { id: 'me' },
          },
        ],
      }),
    },
    threadParticipant: { update: async () => ({}) },
    message: { count: async () => 0, findMany: async () => [] },
  } as unknown as PrismaService;

  const visibility = {
    isBlocked: async () => options.blocked ?? false,
    canViewCatalog: async () => options.connected ?? false,
  } as unknown as VisibilityService;
  const serializer = {
    toThreadSummary: () => ({ id: 't1' }),
  } as unknown as ConversationSerializer;
  const references = { resolve: async () => new Map() } as unknown as ReferenceResolver;

  return { service: new ThreadService(prisma, visibility, serializer, references), created };
}

function targetState(created: CreatedData): string | undefined {
  return created.data?.participants.create.find((p) => p.companyId === 'target')?.state;
}

describe('ThreadService.startDirect request gating', () => {
  it('opens a pending request to an unconnected business', async () => {
    const { service, created } = makeStartDirectService({ connected: false });
    await service.startDirect('me', 'owner', {
      companyId: 'target',
      visibility: ThreadVisibility.Shared,
    });
    expect(targetState(created)).toBe(ThreadParticipantState.Pending);
  });

  it('opens an active thread with a connected business', async () => {
    const { service, created } = makeStartDirectService({ connected: true });
    await service.startDirect('me', 'owner', {
      companyId: 'target',
      visibility: ThreadVisibility.Shared,
    });
    expect(targetState(created)).toBe(ThreadParticipantState.Active);
  });

  it('silently archives the recipient when it has blocked the sender', async () => {
    const { service, created } = makeStartDirectService({ blocked: true });
    await service.startDirect('me', 'owner', {
      companyId: 'target',
      visibility: ThreadVisibility.Shared,
    });
    expect(targetState(created)).toBe(ThreadParticipantState.Archived);
  });
});

describe('ThreadService.membershipOrThrow owner_only visibility', () => {
  function serviceWith(visibility: string) {
    const prisma = {
      threadParticipant: {
        findUnique: async () => ({ id: 'p', state: 'active', leftAt: null, thread: { visibility } }),
      },
    } as unknown as PrismaService;
    return new ThreadService(
      prisma,
      {} as VisibilityService,
      {} as ConversationSerializer,
      {} as ReferenceResolver,
    );
  }

  it('hides an owner_only thread from staff', async () => {
    const service = serviceWith(ThreadVisibility.OwnerOnly);
    await expect(service.membershipOrThrow('t', 'me', 'staff')).rejects.toThrow();
  });

  it('lets the owner into an owner_only thread', async () => {
    const service = serviceWith(ThreadVisibility.OwnerOnly);
    await expect(service.membershipOrThrow('t', 'me', 'owner')).resolves.toMatchObject({ id: 'p' });
  });

  it('lets staff into a shared thread', async () => {
    const service = serviceWith(ThreadVisibility.Shared);
    await expect(service.membershipOrThrow('t', 'me', 'staff')).resolves.toMatchObject({ id: 'p' });
  });
});

describe('ThreadService.findDirectThread visibility', () => {
  it('creates an owner_only direct when only a shared thread exists', async () => {
    const findFirstCalls: unknown[] = [];
    const prisma = {
      company: { findUnique: async () => ({ id: 'target' }) },
      thread: {
        findFirst: async (args: unknown) => {
          findFirstCalls.push(args);
          return null;
        },
        create: async () => ({ id: 'owner-only-thread' }),
        findUnique: async () => ({
          id: 'owner-only-thread',
          type: 'direct',
          visibility: ThreadVisibility.OwnerOnly,
          title: null,
          lastMessageAt: new Date(),
          participants: [
            {
              id: 'p-me',
              companyId: 'me',
              state: 'active',
              alertLevel: 'all',
              lastReadAt: null,
              leftAt: null,
              company: { id: 'me' },
            },
          ],
        }),
      },
      threadParticipant: { update: async () => ({}) },
      message: { count: async () => 0, findMany: async () => [] },
    } as unknown as PrismaService;

    const service = new ThreadService(
      prisma,
      { isBlocked: async () => false, canViewCatalog: async () => true } as VisibilityService,
      { toThreadSummary: () => ({ id: 'owner-only-thread' }) } as ConversationSerializer,
      { resolve: async () => new Map() } as ReferenceResolver,
    );

    await service.startDirect('me', 'owner', {
      companyId: 'target',
      visibility: ThreadVisibility.OwnerOnly,
    });

    expect(findFirstCalls).toHaveLength(1);
    expect((findFirstCalls[0] as { where: { visibility: string } }).where.visibility).toBe(
      ThreadVisibility.OwnerOnly,
    );
  });
});
