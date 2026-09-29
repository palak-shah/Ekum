import type { OrderView } from '@ekum/domain-types';

export function orderWhen(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

export function complaintOrderTitle(order: Pick<OrderView, 'items'>): string {
  const names = order.items.map((item) => item.name?.trim()).filter(Boolean);
  if (names.length === 0) {
    const n = order.items.length;
    return n > 0 ? `${n} design${n === 1 ? '' : 's'}` : 'This order';
  }
  const shown = names.slice(0, 2);
  const extra = names.length - shown.length;
  return extra > 0 ? `${shown.join(' · ')} +${extra}` : shown.join(' · ');
}

export function complaintOrderThumb(order: Pick<OrderView, 'items'>): string | null {
  for (const item of order.items) {
    const url = item.image?.trim() || item.images?.[0]?.trim();
    if (url) return url;
  }
  return null;
}

export function complaintOrderHaystack(
  order: OrderView,
  status: string,
  when: string,
): string {
  const lines = order.items.map((item) => `${item.name} ${item.sku ?? ''}`).join(' ');
  return `${lines} ${status} ${when} ${order.id}`.toLowerCase();
}
