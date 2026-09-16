import type { NotificationView } from '@ekum/domain-types';
import { notificationDeepLink } from './notificationDeepLink';

/** Mark unread item read (best effort), then navigate to its deep link. */
export async function openNotificationItem(opts: {
  item: Pick<NotificationView, 'id' | 'read' | 'refType' | 'refId'>;
  markRead: (id: string) => Promise<unknown>;
  navigate: (path: string) => void;
}): Promise<void> {
  const path = notificationDeepLink(opts.item);
  if (!opts.item.read) {
    try {
      await opts.markRead(opts.item.id);
    } catch {
      // Best-effort: still navigate.
    }
  }
  opts.navigate(path);
}
