import type { MessageReference, MessageView } from '@ekum/domain-types';

export function orderRef(
  overrides: Partial<MessageReference> & { id: string },
): MessageReference {
  return {
    kind: 'order',
    name: 'Order #ECNL',
    image: null,
    available: true,
    orderLabel: 'Order #ECNL',
    ...overrides,
  };
}

export function textMessage(overrides: Partial<MessageView> & { id: string }): MessageView {
  return {
    threadId: 'seed-thread-1',
    senderCompanyId: 'seed-company-meena',
    type: 'text',
    body: null,
    reference: null,
    metadata: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    mine: true,
    replyTo: null,
    ...overrides,
  };
}

export function orderCardMessage(
  overrides: Partial<MessageView> & { id: string },
): MessageView {
  return textMessage({
    type: 'order_card',
    body: null,
    reference: orderRef({ id: 'ord-1' }),
    ...overrides,
  });
}
