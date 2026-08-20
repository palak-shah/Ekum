import type { OrderView, ReturnView, SampleView } from '@ekum/domain-types';
import {
  matchesCompleted,
  matchesNeeds,
  matchesProgress,
  matchesReturnCompleted,
  matchesReturnNeeds,
  matchesReturnProgress,
  matchesSampleCompleted,
  matchesSampleNeeds,
  matchesSampleProgress,
} from './orderAttention';

export type TradeListItem =
  | { kind: 'order'; id: string; createdAt: string; direction: string; order: OrderView }
  | { kind: 'sample'; id: string; createdAt: string; direction: string; sample: SampleView }
  | { kind: 'return'; id: string; createdAt: string; direction: string; ret: ReturnView };

export function toTradeItems(
  orders: OrderView[],
  samples: SampleView[],
  returns: ReturnView[],
): TradeListItem[] {
  const rows: TradeListItem[] = [
    ...orders.map((order) => ({
      kind: 'order' as const,
      id: order.id,
      createdAt: order.createdAt,
      direction: order.direction,
      order,
    })),
    ...samples.map((sample) => ({
      kind: 'sample' as const,
      id: sample.id,
      createdAt: sample.createdAt,
      direction: sample.direction,
      sample,
    })),
    ...returns.map((ret) => ({
      kind: 'return' as const,
      id: ret.id,
      createdAt: ret.createdAt,
      direction: ret.direction,
      ret,
    })),
  ];
  return rows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function matchesTradeNeeds(item: TradeListItem): boolean {
  if (item.kind === 'order') return matchesNeeds(item.order);
  if (item.kind === 'sample') return matchesSampleNeeds(item.sample);
  return matchesReturnNeeds(item.ret);
}

export function matchesTradeProgress(item: TradeListItem): boolean {
  if (item.kind === 'order') return matchesProgress(item.order);
  if (item.kind === 'sample') return matchesSampleProgress(item.sample);
  return matchesReturnProgress(item.ret);
}

export function matchesTradeCompleted(item: TradeListItem): boolean {
  if (item.kind === 'order') return matchesCompleted(item.order);
  if (item.kind === 'sample') return matchesSampleCompleted(item.sample);
  return matchesReturnCompleted(item.ret);
}
