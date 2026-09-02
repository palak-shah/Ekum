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
    threadMember: {
      createMany: async () => ({}),
      updateMany: async () => ({}),
      findUnique: async () => null,
      findMany: async () => [],
    },
    companyMembership: { findMany: async () => [] },
    user: { findUnique: async () => ({ name: 'Me' }) },
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
    const result = await service.startDirect('me', 'owner', {
      companyId: 'target',
      visibility: ThreadVisibility.Shared,
    });
    expect(targetState(created)).toBe(ThreadParticipantState.Pending);
    expect(result.opened).toBe('created');
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

describe('ThreadService.findDirectThread one 1:1', () => {
  it('reuses the shared shop chat even if the client asks for owner_only', async () => {
    const created: { id?: string } = {};
    const prisma = {
      company: { findUnique: async () => ({ id: 'target' }) },
      thread: {
        findFirst: async () => ({
          id: 'shared-1',
          participants: [{ companyId: 'me', leftAt: null, state: 'active' }],
        }),
        create: async (args: { data: { id?: string } }) => {
          created.id = 'new';
          return args.data;
        },
        findUnique: async () => ({
          id: 'shared-1',
          type: 'direct',
          visibility: ThreadVisibility.Shared,
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
      threadMember: {
        createMany: async () => ({}),
        updateMany: async () => ({}),
        findUnique: async () => ({ state: 'active', companyId: 'me' }),
        findMany: async () => [],
      },
      companyMembership: { findMany: async () => [] },
      user: { findUnique: async () => ({ name: 'Me' }) },
      message: { count: async () => 0, findMany: async () => [] },
    } as unknown as PrismaService;

    const service = new ThreadService(
      prisma,
      { isBlocked: async () => false, canViewCatalog: async () => true } as VisibilityService,
      { toThreadSummary: () => ({ id: 'shared-1' }) } as ConversationSerializer,
      { resolve: async () => new Map() } as ReferenceResolver,
    );

    const result = await service.startDirect('me', 'owner', {
      companyId: 'target',
      visibility: ThreadVisibility.OwnerOnly,
      memberUserIds: [],
    }, 'user-1');

    expect(result).toEqual({ id: 'shared-1', opened: 'existing' });
    expect(created.id).toBeUndefined();
  });
});
