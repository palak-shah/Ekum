import { describe, expect, it, vi } from 'vitest';
import { MessageType, type SendBroadcastDto } from '@ekum/domain-types';
import { BroadcastService } from './broadcast.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';
import type { CompanySerializer } from '../access/company.serializer';
import type { DomainEvents } from '../events/events.module';

interface Captured {
  recipientCompanyIds: string[] | null;
}

function makeService() {
  const captured: Captured = { recipientCompanyIds: null };
  const broadcastSent = vi.fn();
  const prisma = {
    broadcastList: { findMany: async () => [] },
    broadcast: {
      create: async (args: {
        data: { recipients: { create: { recipientCompanyId: string }[] } };
      }) => {
        captured.recipientCompanyIds = args.data.recipients.create.map((r) => r.recipientCompanyId);
        return {
          id: 'bc1',
          type: MessageType.Text,
          subject: 'Hi',
          body: null,
          referenceId: null,
          createdAt: new Date(),
        };
      },
    },
    company: {
      findMany: async ({ where }: { where: { id: { in: string[] } } }) =>
        where.id.in.map((id) => ({ id, name: id, city: null, verification: 'not_verified' })),
    },
  } as unknown as PrismaService;

  const visibility = {
    // The recipient has blocked us only for 'blocked-co'.
    isBlocked: async (_sender: string, recipient: string) => recipient === 'blocked-co',
    // Only 'connected-co' has an active connection with us (either direction).
    canViewCatalog: async (a: string, b: string) => a === 'connected-co' || b === 'connected-co',
  } as unknown as VisibilityService;

  const serializer = {
    toPublicSummary: (company: { id: string }) => ({ id: company.id }),
  } as unknown as CompanySerializer;

  const events = { broadcastSent } as unknown as DomainEvents;

  return { service: new BroadcastService(prisma, visibility, serializer, events), captured, broadcastSent };
}

describe('BroadcastService.send', () => {
  it('delivers only to connected recipients and silently drops blocked ones', async () => {
    const { service, captured, broadcastSent } = makeService();
    const dto = {
      type: MessageType.Text,
      subject: 'Hi',
      recipientCompanyIds: ['connected-co', 'blocked-co', 'stranger'],
      listIds: [],
    } as SendBroadcastDto;

    const view = await service.send('me', dto);

    expect(captured.recipientCompanyIds).toEqual(['connected-co']);
    expect(view.recipientCount).toBe(1);
    expect(broadcastSent).toHaveBeenCalledWith(
      expect.objectContaining({ broadcastId: 'bc1', recipientCompanyIds: ['connected-co'] }),
    );
  });

  it('rejects a send when none of the recipients are connected', async () => {
    const { service, broadcastSent } = makeService();
    const dto = {
      type: MessageType.Text,
      subject: 'Hi',
      recipientCompanyIds: ['stranger', 'blocked-co'],
      listIds: [],
    } as SendBroadcastDto;

    await expect(service.send('me', dto)).rejects.toThrow();
    expect(broadcastSent).not.toHaveBeenCalled();
  });
});
