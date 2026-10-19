import type { MessageView } from '@ekum/domain-types';
export { highlightSearchText } from '@/ui/highlightMatch';

export type ThreadMessageViewScope =
  | 'all'
  | 'photos'
  | 'documents'
  | 'collections'
  | 'designs'
  | 'orders'
  | 'complaints'
  | 'starred'
  | 'links'
  | 'media';

export const THREAD_SEARCH_SCOPE_OPTIONS: Array<{
  id: Exclude<ThreadMessageViewScope, 'media'>;
  label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'photos', label: 'Photos' },
  { id: 'documents', label: 'Documents' },
  { id: 'collections', label: 'Collections' },
  { id: 'designs', label: 'Designs' },
  { id: 'orders', label: 'Orders' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'starred', label: 'Starred' },
  { id: 'links', label: 'Links' },
];

export function threadSearchScopeLabel(scope: ThreadMessageViewScope): string {
  return THREAD_SEARCH_SCOPE_OPTIONS.find((row) => row.id === scope)?.label ?? 'All';
}

function metaOf(message: MessageView): Record<string, unknown> | null {
  return message.metadata && typeof message.metadata === 'object'
    ? (message.metadata as Record<string, unknown>)
    : null;
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
  if (typeof meta?.fileName === 'string' && meta.fileName.toLowerCase().includes(needle)) {
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
