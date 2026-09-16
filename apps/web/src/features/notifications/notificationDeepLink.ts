import type { NotificationView } from '@ekum/domain-types';

/**
 * In-app path for a notification row (and push click). Unknown / missing refs
 * stay on the inbox so traders never land nowhere.
 */
export function notificationDeepLink(
  item: Pick<NotificationView, 'refType' | 'refId'> | { refType?: string | null; refId?: string | null },
): string {
  const refType = item.refType ?? null;
  const refId = item.refId ?? null;
  if (!refType) return '/notifications';
  switch (refType) {
    case 'order':
      return refId ? `/orders/${refId}` : '/orders';
    case 'thread':
      return refId ? `/chats/${refId}` : '/chats';
    case 'company':
      return refId ? `/company/${refId}` : '/notifications';
    case 'collection':
      return refId ? `/collections/${refId}` : '/notifications';
    case 'product':
      return refId ? `/explore/products/${refId}` : '/notifications';
    case 'broadcast':
      return '/broadcast';
    default:
      return '/notifications';
  }
}
