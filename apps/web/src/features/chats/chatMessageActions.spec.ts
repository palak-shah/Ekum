import { describe, expect, it } from 'vitest';
import type { MessageView } from '@ekum/domain-types';
import { canForwardMessage } from './chatMessageActions';

function productCard(
  reference: Partial<NonNullable<MessageView['reference']>>,
): MessageView {
  return {
    id: 'm1',
    type: 'product_card',
    body: null,
    mine: false,
    createdAt: new Date().toISOString(),
    senderCompanyId: 'buyer',
    reference: {
      kind: 'product',
      id: 'p1',
      name: 'Silk',
      image: null,
      available: true,
      allowForward: true,
      ownerCompanyId: 'supplier',
      ...reference,
    },
  } as MessageView;
}

describe('canForwardMessage', () => {
  it('allows forward when unlocked', () => {
    expect(canForwardMessage(productCard({ allowForward: true }), 'buyer')).toBe(true);
  });

  it('hides forward for non-owners when locked', () => {
    expect(canForwardMessage(productCard({ allowForward: false }), 'buyer')).toBe(false);
  });

  it('allows owner to forward when locked', () => {
    expect(canForwardMessage(productCard({ allowForward: false }), 'supplier')).toBe(true);
  });
});
