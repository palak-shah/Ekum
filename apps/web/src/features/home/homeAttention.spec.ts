import { describe, expect, it } from 'vitest';
import type { OrderView, ThreadSummary } from '@ekum/domain-types';
import { buildHomeNeeds, needTitle } from './homeAttention';

function order(
  id: string,
  overrides: Partial<OrderView> & Pick<OrderView, 'status' | 'direction'>,
): OrderView {
  return {
    id,
    kind: 'order',
    intent: 'order',
    status: overrides.status,
    tradeMode: 'bilateral',
    facilitatorCompanyId: null,
    downstreamOrderId: null,
    relatedOrders: [],
    direction: overrides.direction,
    amendCount: 0,
    counterpart: overrides.counterpart ?? {
      id: 'jaipur',
      name: 'Jaipur Emporium',
      city: 'Jaipur',
      logoUrl: null,
      verification: 'gst',
    },
    items: overrides.items ?? [
      {
        id: 'i1',
        quantity: 100,
        remainingQuantity: 100,
        rate: 120,
        lineStatus: 'open',
      },
    ],
    createdAt: '2026-08-20T08:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-08-22T08:00:00.000Z',
    ...overrides,
  } as OrderView;
}

describe('buildHomeNeeds', () => {
  it('groups many dispatch orders from the same company into one row', () => {
    const orders = Array.from({ length: 38 }, (_, index) =>
      order(`o${index}`, { status: 'confirmed', direction: 'selling' }),
    );
    const needs = buildHomeNeeds({
      orders,
      returns: [],
      chatRequests: [],
    });
    expect(needs).toHaveLength(1);
    expect(needs[0]?.title).toBe('38 to dispatch · Jaipur Emporium');
    expect(needs[0]?.to).toBe('/orders?filter=needs&q=Jaipur%20Emporium');
    expect(needs[0]?.subtitle).toBeNull();
  });

  it('keeps separate rows per action type for the same company', () => {
    const orders = [
      order('confirm-1', {
        status: 'requested',
        direction: 'selling',
        items: [{ id: 'i1', quantity: 50, remainingQuantity: 50, rate: 100, lineStatus: 'open' }],
      }),
      order('dispatch-1', { status: 'confirmed', direction: 'selling' }),
      order('dispatch-2', { status: 'confirmed', direction: 'selling' }),
    ];
    const needs = buildHomeNeeds({
      orders,
      returns: [],
      chatRequests: [],
    });
    expect(needs.map((item) => item.kind).sort()).toEqual(['confirm_order', 'dispatch']);
    expect(needs.find((item) => item.kind === 'dispatch')?.title).toBe(
      '2 to dispatch · Jaipur Emporium',
    );
  });

  it('links a single order need to its detail page', () => {
    const needs = buildHomeNeeds({
      orders: [order('solo', { status: 'confirmed', direction: 'selling' })],
      returns: [],
      chatRequests: [],
    });
    expect(needs[0]?.to).toBe('/orders/solo');
    expect(needs[0]?.title).toBe('Dispatch to Jaipur Emporium');
  });

  it('links follow asks to Followers Asked', () => {
    const needs = buildHomeNeeds({
      orders: [],
      returns: [],
      followAsks: [
        {
          company: {
            id: 'c-ask',
            name: 'Ahmedabad Loom Co',
            city: 'Ahmedabad',
            logoUrl: null,
            verification: 'none',
          },
          createdAt: '2026-09-24T10:00:00.000Z',
        },
      ],
      chatRequests: [],
    });
    expect(needs).toHaveLength(1);
    expect(needs[0]?.kind).toBe('follow_request');
    expect(needs[0]?.title).toBe('Follow ask · Ahmedabad Loom Co');
    expect(needs[0]?.to).toBe('/network/followers?tab=asked');
  });

  it('sends chat requests to the thread, not Network Requests', () => {
    const chat: ThreadSummary = {
      id: 'th-1',
      type: 'direct',
      visibility: 'shared',
      title: 'Ahmedabad Loom Co',
      state: 'pending',
      alertLevel: 'all',
      pinned: false,
      unreadCount: 1,
      lastMessage: null,
      lastMessageAt: '2026-09-28T10:00:00.000Z',
      counterpart: {
        id: 'c-ask',
        name: 'Ahmedabad Loom Co',
        city: 'Ahmedabad',
        logoUrl: null,
        verification: 'none',
      },
      participantCount: 2,
    };
    const needs = buildHomeNeeds({
      orders: [],
      returns: [],
      chatRequests: [chat],
    });
    expect(needs).toHaveLength(1);
    expect(needs[0]?.kind).toBe('chat_request');
    expect(needs[0]?.to).toBe('/chats/th-1');
    expect(needs.some((row) => row.kind === 'access_request')).toBe(false);
  });
});

describe('needTitle', () => {
  it('uses trader phrasing for grouped confirms', () => {
    expect(needTitle('confirm_order', 5, 'Jaipur Emporium')).toBe(
      '5 to confirm · Jaipur Emporium',
    );
  });
});
