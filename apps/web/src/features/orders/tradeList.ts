import type { ComplaintView, OrderView, ReturnView, SampleView } from '@ekum/domain-types';
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
  | {
      kind: 'order';
      id: string;
      createdAt: string;
      updatedAt: string;
      direction: string;
      order: OrderView;
    }
  | {
      kind: 'sample';
      id: string;
      createdAt: string;
      updatedAt: string;
      direction: string;
      sample: SampleView;
    }
  | {
      kind: 'return';
      id: string;
      createdAt: string;
      updatedAt: string;
      direction: string;
      ret: ReturnView;
    }
  | {
      kind: 'complaint';
      id: string;
      createdAt: string;
      updatedAt: string;
      direction: string;
      complaint: ComplaintView;
    };

function sortKey(item: TradeListItem): number {
  return new Date(item.updatedAt || item.createdAt).getTime();
}

export function toTradeItems(
  orders: OrderView[],
  samples: SampleView[],
  returns: ReturnView[],
  complaints: ComplaintView[] = [],
): TradeListItem[] {
  const rows: TradeListItem[] = [
    ...orders.map((order) => ({
      kind: 'order' as const,
      id: order.id,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt || order.createdAt,
      direction: order.direction,
      order,
    })),
    ...samples.map((sample) => ({
      kind: 'sample' as const,
      id: sample.id,
      createdAt: sample.createdAt,
      updatedAt: sample.updatedAt || sample.createdAt,
      direction: sample.direction,
      sample,
    })),
    ...returns.map((ret) => ({
      kind: 'return' as const,
      id: ret.id,
      createdAt: ret.createdAt,
      updatedAt: ret.updatedAt || ret.createdAt,
      direction: ret.direction,
      ret,
    })),
    ...complaints.map((complaint) => ({
      kind: 'complaint' as const,
      id: complaint.id,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt || complaint.createdAt,
      direction: complaint.mine ? 'buying' : 'selling',
      complaint,
    })),
  ];
  return rows.sort((a, b) => sortKey(b) - sortKey(a));
}

export function matchesTradeNeeds(item: TradeListItem): boolean {
  if (item.kind === 'order') return matchesNeeds(item.order);
  if (item.kind === 'sample') return matchesSampleNeeds(item.sample);
  if (item.kind === 'complaint') return item.complaint.status === 'open' && !item.complaint.mine;
  return matchesReturnNeeds(item.ret);
}

/** Open trade — not finished (replaces separate Needs you + In progress tabs). */
export function matchesTradePending(item: TradeListItem): boolean {
  if (item.kind === 'complaint') {
    return item.complaint.status === 'open' || item.complaint.status === 'responded';
  }
  return !matchesTradeCompleted(item);
}

export function matchesTradeProgress(item: TradeListItem): boolean {
  if (item.kind === 'order') return matchesProgress(item.order);
  if (item.kind === 'sample') return matchesSampleProgress(item.sample);
  if (item.kind === 'complaint') return item.complaint.status === 'responded';
  return matchesReturnProgress(item.ret);
}

export function matchesTradeCompleted(item: TradeListItem): boolean {
  if (item.kind === 'order') return matchesCompleted(item.order);
  if (item.kind === 'sample') return matchesSampleCompleted(item.sample);
  if (item.kind === 'complaint') return item.complaint.status === 'resolved';
  return matchesReturnCompleted(item.ret);
}

/** Pending list: Needs you first, then last-edited. */
export function sortTradePending(items: TradeListItem[]): TradeListItem[] {
  return [...items].sort((a, b) => {
    const aNeeds = matchesTradeNeeds(a) ? 0 : 1;
    const bNeeds = matchesTradeNeeds(b) ? 0 : 1;
    if (aNeeds !== bNeeds) return aNeeds - bNeeds;
    return sortKey(b) - sortKey(a);
  });
}
