import type { QueryClient } from '@tanstack/react-query';
import type { NavigateFunction } from 'react-router-dom';
import type { OrderView } from '@ekum/domain-types';

/** Open the trade thread scrolled to the living order card when possible. */
export async function navigateToOrderChat(
  navigate: NavigateFunction,
  queryClient: QueryClient,
  order: Pick<OrderView, 'id' | 'threadId' | 'livingMessageId'>,
  options?: { replace?: boolean },
) {
  if (order.threadId) {
    await queryClient.invalidateQueries({ queryKey: ['thread', order.threadId, 'messages'] });
    const message = order.livingMessageId
      ? `?message=${encodeURIComponent(order.livingMessageId)}`
      : '';
    navigate(`/chats/${order.threadId}${message}`, { replace: options?.replace ?? false });
    return;
  }
  navigate(`/orders/${order.id}`, { replace: options?.replace ?? false });
}
