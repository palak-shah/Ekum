import { describe, expect, it } from 'vitest';
import type { HomeNeedItem } from './homeAttention';
import { homeNeedVisual } from './homeNeedVisual';

function need(partial: Partial<HomeNeedItem> & Pick<HomeNeedItem, 'kind' | 'title'>): HomeNeedItem {
  return {
    id: 'n1',
    subtitle: null,
    to: '/orders',
    sortAt: '2026-09-10T00:00:00.000Z',
    ...partial,
  };
}

describe('homeNeedVisual', () => {
  it('makes grouped confirms an action + company', () => {
    expect(
      homeNeedVisual(need({ kind: 'confirm_order', title: '3 to confirm · Jaipur Emporium' })),
    ).toEqual({
      action: '3 orders to confirm',
      party: 'Jaipur Emporium',
    });
  });

  it('makes a single confirm an action + company', () => {
    expect(
      homeNeedVisual(need({ kind: 'confirm_order', title: 'Confirm order · Jaipur Emporium' })),
    ).toEqual({
      action: 'Confirm this order',
      party: 'Jaipur Emporium',
    });
  });

  it('reads send-rate from Order from', () => {
    expect(homeNeedVisual(need({ kind: 'send_rate', title: 'Order from Meena Textiles' }))).toEqual({
      action: 'Send rates',
      party: 'Meena Textiles',
    });
  });
});
