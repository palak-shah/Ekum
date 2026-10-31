import { isIHandleSellingParent } from './iHandleDesk';
import { matchesTradePending } from './tradeList';
import { tradeNeedsYouLabel } from './tradeNeedsYouLabel';
import type { TradeListItem } from './tradeList';

/** Verb on the lime disc — existing Needs you label without the prefix. */
export function tradeListGlanceVerb(item: TradeListItem): string | null {
  const needs = tradeNeedsYouLabel(item);
  if (!needs) return null;
  const verb = needs.replace(/^Needs you\s+/, '').trim() || needs;
  if (verb === 'Accept & forward') return 'Forward';
  return verb;
}

export type TradeListGlanceIcon = 'confirm' | 'dispatch' | 'forward';

export function tradeListGlanceIcon(verb: string): TradeListGlanceIcon {
  if (verb === 'Dispatch') return 'dispatch';
  if (verb === 'Forward' || verb === 'Accept & forward') return 'forward';
  return 'confirm';
}

/** Idle open trades — role words only (no shop / mill names). */
export function tradeListWaitingCue(item: TradeListItem): string | null {
  if (tradeNeedsYouLabel(item)) return null;
  if (!matchesTradePending(item)) return null;
  if (item.kind === 'complaint' || item.kind === 'return') return null;
  if (item.kind === 'order' && isIHandleSellingParent(item.order)) {
    return 'Waiting: supplier';
  }
  const direction = item.kind === 'order' ? item.order.direction : item.sample.direction;
  if (direction === 'buying') return 'Waiting: supplier';
  if (direction === 'selling') return 'Waiting: buyer';
  return null;
}
