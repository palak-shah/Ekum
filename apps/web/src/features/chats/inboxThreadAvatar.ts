import type { ThreadSummary } from '@ekum/domain-types';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';

/** Group photo on All Chats; 1:1 uses the other shop’s logo. */
export function inboxThreadAvatarUrl(thread: Pick<ThreadSummary, 'type' | 'imageUrl' | 'counterpart'>): string | null {
  if (thread.type === 'group') {
    return toAbsoluteMediaUrl(thread.imageUrl) ?? thread.imageUrl ?? null;
  }
  const logo = thread.counterpart?.logoUrl ?? null;
  return toAbsoluteMediaUrl(logo) ?? logo;
}
