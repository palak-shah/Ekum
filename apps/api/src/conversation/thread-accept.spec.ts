import { describe, expect, it, vi } from 'vitest';
import { ThreadParticipantState } from '@ekum/domain-types';
import { ThreadService } from './thread.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';
import type { ConversationSerializer } from './conversation.serializer';
import type { ReferenceResolver } from './reference-resolver';

describe('ThreadService.accept / decline', () => {
  it('activates a pending participant on accept', async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      threadParticipant: {
        findUnique: async () => ({
          id: 'tp-1',
          companyId: 'me',
          state: ThreadParticipantState.Pending,
          leftAt: null,
          lastReadAt: null,
          alertLevel: 'all',
          pinnedAt: null,
          thread: { id: 't1', visibility: 'shared', type: 'direct' },
        }),
        update,
      },
      thread: {
        findUnique: async () => ({
          id: 't1',
          type: 'direct',
          visibility: 'shared',
          title: null,
          lastMessageAt: new Date(),
          participants: [
            {
              id: 'tp-1',
              companyId: 'me',
              state: ThreadParticipantState.Active,
              alertLevel: 'all',
              lastReadAt: null,
              leftAt: null,
              pinnedAt: null,
              company: { id: 'me', name: 'Me' },
            },
          ],
        }),
      },
      message: { count: async () => 0, findMany: async () => [] },
      threadMember: {
        findUnique: async () => ({ state: 'active', companyId: 'me' }),
        findMany: async () => [],
      },
      companyMembership: { findMany: async () => [] },
    } as unknown as PrismaService;
    const serializer = {
      toThreadDetail: () => ({ id: 't1', state: ThreadParticipantState.Active }),
    } as unknown as ConversationSerializer;
    const service = new ThreadService(
      prisma,
      {} as VisibilityService,
      serializer,
      { resolve: async () => new Map() } as unknown as ReferenceResolver,
    );

    await service.accept('me', 'owner', 't1');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tp-1' },
        data: { state: ThreadParticipantState.Active },
      }),
    );
  });

  it('archives the participant on decline', async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      threadParticipant: {
        findUnique: async () => ({
          id: 'tp-1',
          companyId: 'me',
          state: ThreadParticipantState.Pending,
          leftAt: null,
          thread: { id: 't1', visibility: 'shared', type: 'direct' },
        }),
        update,
      },
    } as unknown as PrismaService;
    const service = new ThreadService(
      prisma,
      {} as VisibilityService,
      {} as ConversationSerializer,
      { resolve: async () => new Map() } as unknown as ReferenceResolver,
    );

    const result = await service.decline('me', 'owner', 't1');
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: ThreadParticipantState.Archived,
          leftAt: expect.any(Date),
        }),
      }),
    );
  });
});
