import type { ThreadSummary } from '@ekum/domain-types';
import { messagePreviewSearchBlob } from './messagePreview';

/** List row title — trim empty/whitespace titles before falling back to counterpart. */
export function threadDisplayTitle(thread: ThreadSummary): string {
  const trimmedTitle = thread.title?.trim();
  if (trimmedTitle) return trimmedTitle;
  const name = thread.counterpart?.name?.trim();
  if (name) return name;
  return 'Conversation';
}

/** Case-normalized haystack for inbox search (title, counterpart, city, last-message preview). */
export function threadSearchHaystack(thread: ThreadSummary): string {
  const parts = [
    threadDisplayTitle(thread),
    thread.title?.trim(),
    thread.counterpart?.name?.trim(),
    thread.counterpart?.city?.trim(),
    messagePreviewSearchBlob(thread.lastMessage),
  ].filter((part): part is string => Boolean(part));
  return parts.join(' ').toLowerCase();
}

export function filterThreadsBySearch(threads: ThreadSummary[], query: string): ThreadSummary[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return threads;
  return threads.filter((thread) => threadSearchHaystack(thread).includes(needle));
}
