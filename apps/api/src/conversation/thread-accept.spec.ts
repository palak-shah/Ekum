import { describe, expect, it, vi } from 'vitest';
import { ThreadParticipantState, ThreadType } from '@ekum/domain-types';
import { ThreadService } from './thread.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';
import type { AccessService } from '../access/access.service';
import type { ConversationSerializer } from './conversation.serializer';
import type { ReferenceResolver } from './reference-resolver';
import type { AuthPrincipal } from '../auth/auth.types';

const actor = { userId: 'u1', companyId: 'me', role: 'owner' } as AuthPrincipal;

describe('ThreadService.accept / decline', () => {
  it('activates a pending participant on accept and approves incoming access', async () => {
    const update = vi.fn(async () => ({}));
    const approveIncoming = vi.fn(async () => true);
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
          thread: { id: 't1', visibility: 'shared', type: ThreadType.Direct },
        }),
        update,
        findMany: async () => [{ companyId: 'them' }],
      },
      thread: {
        findUnique: async () => ({
          id: 't1',
          type: ThreadType.Direct,
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
    const access = {
      approveIncomingFromCounterpartIfPending: approveIncoming,
    } as unknown as AccessService;
    const service = new ThreadService(
      prisma,
      {} as VisibilityService,
      serializer,
      { resolve: async () => new Map() } as unknown as ReferenceResolver,
      access,
    );

    await service.accept('me', 'owner', 't1', actor);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tp-1' },
        data: { state: ThreadParticipantState.Active },
      }),
    );
    expect(approveIncoming).toHaveBeenCalledWith('me', 'them', actor);
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
      {
        approveIncomingFromCounterpartIfPending: async () => false,
      } as unknown as AccessService,
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
