import { createElement, type ReactNode } from 'react';
import type { MessageView } from '@ekum/domain-types';

export type ThreadMessageViewScope =
  | 'all'
  | 'photos'
  | 'collections'
  | 'designs'
  | 'orders'
  | 'starred'
  | 'media';

export const THREAD_SEARCH_SCOPE_OPTIONS: Array<{
  id: Exclude<ThreadMessageViewScope, 'media'>;
  label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'photos', label: 'Photos' },
  { id: 'collections', label: 'Collections' },
  { id: 'designs', label: 'Designs' },
  { id: 'orders', label: 'Orders' },
  { id: 'starred', label: 'Starred' },
];

export function threadSearchScopeLabel(scope: ThreadMessageViewScope): string {
  return THREAD_SEARCH_SCOPE_OPTIONS.find((row) => row.id === scope)?.label ?? 'All';
}

function metaOf(message: MessageView): Record<string, unknown> | null {
  return message.metadata && typeof message.metadata === 'object'
    ? (message.metadata as Record<string, unknown>)
    : null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split text and wrap case-insensitive matches in a light mark for in-chat search.
 */
export function highlightSearchText(text: string, query: string | null | undefined): ReactNode {
  const needle = query?.trim();
  if (!needle || !text) return text;
  const pattern = new RegExp(`(${escapeRegExp(needle)})`, 'gi');
  const parts = text.split(pattern);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    part.toLowerCase() === needle.toLowerCase()
      ? createElement(
          'mark',
          {
            key: `${index}-${part}`,
            className:
              'rounded-[3px] bg-warning-soft px-0.5 font-semibold text-warning-ink [box-decoration-break:clone]',
          },
          part,
        )
      : part,
  );
}

/** Client-side match for stepper over loaded messages (mirrors server q fields). */
export function messageMatchesSearch(message: MessageView, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return false;
  if (message.body?.toLowerCase().includes(needle)) return true;
  const meta = metaOf(message);
  if (typeof meta?.orderLabel === 'string' && meta.orderLabel.toLowerCase().includes(needle)) {
    return true;
  }
  const ref = message.reference;
  if (ref?.name?.toLowerCase().includes(needle)) return true;
  if (ref?.orderLabel?.toLowerCase().includes(needle)) return true;
  if (ref?.eventLabel?.toLowerCase().includes(needle)) return true;
  if (ref?.totalLabel?.toLowerCase().includes(needle)) return true;
  return false;
}

/**
 * Hit ids newest-first (WhatsApp: start at newest match as 1 of M).
 * `messages` must be chronological oldest → newest.
 */
export function searchHitIdsNewestFirst(messages: MessageView[], q: string): string[] {
  if (!q.trim()) return [];
  const hits: string[] = [];
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message && messageMatchesSearch(message, q)) {
      hits.push(message.id);
    }
  }
  return hits;
}
