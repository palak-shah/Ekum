import type { OrderView } from '@ekum/domain-types';
import { shortOrderLabel } from '@ekum/domain-types';

export function isTradingDeskOrder(
  order: Pick<OrderView, 'tradeMode' | 'direction'>,
): boolean {
  return order.tradeMode === 'manage' && order.direction === 'selling';
}

/** List meta after the order #. Trading = I-handle desk, not a second You sell. */
export function orderListRoleBit(
  order: Pick<OrderView, 'tradeMode' | 'direction' | 'intent'>,
  shared: boolean,
): string | null {
  if (shared) return 'Shared';
  if (order.intent === 'inquiry') return null;
  if (isTradingDeskOrder(order)) return 'Trading';
  if (order.direction === 'buying') return 'You buy';
  return 'You sell';
}

export function orderListLinkedCue(
  mills: NonNullable<OrderView['linkedMills']> | undefined,
): string {
  if (!mills?.length) return '';
  const names = mills.map((mill) => mill.name).filter(Boolean);
  if (names.length === 0) return '';
  return names.join(' + ');
}

/** Mill shops on the list only for the trader’s Trading (manage + selling) row. */
export function orderListMillCue(
  order: Pick<OrderView, 'tradeMode' | 'direction' | 'linkedMills'>,
): string {
  if (!isTradingDeskOrder(order)) return '';
  return orderListLinkedCue(order.linkedMills);
}

export function linkedMillHaystack(order: Pick<OrderView, 'linkedMills'>): string {
  return (order.linkedMills ?? [])
    .map((mill) => {
      const id = mill.orderId ? shortOrderLabel(mill.orderId) : '';
      return `${mill.name} ${mill.orderId ?? ''} ${id}`;
    })
    .join(' ');
}
