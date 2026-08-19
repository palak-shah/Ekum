import { Link } from 'react-router-dom';
import type { CreateOrdersBatchResult } from '@ekum/domain-types';
import { Button, Sheet } from '@/ui/kit';

export function BatchOrderConfirmSheet({
  open,
  result,
  onClose,
}: {
  open: boolean;
  result: CreateOrdersBatchResult | null;
  onClose: () => void;
}) {
  if (!result) return null;
  const placed = result.orders.length;
  const attempted = placed + result.failures.length;
  const title =
    placed === 0
      ? 'Could not place orders'
      : result.failures.length > 0
        ? `${placed} of ${attempted} orders placed`
        : placed === 1
          ? '1 order placed'
          : `${placed} orders placed`;

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-3">
        {result.orders.map((order) => {
          const href = order.threadId ? `/chats/${order.threadId}` : `/orders/${order.id}`;
          return (
            <Link
              key={order.id}
              to={href}
              className="rounded-2xl border border-line bg-foam/40 px-3 py-3 text-sm font-semibold text-ink hover:bg-foam"
              onClick={onClose}
            >
              {order.sellerName || order.counterpart?.name || 'Supplier'} → Open chat
            </Link>
          );
        })}
        {result.failures.map((failure) => (
          <div
            key={`${failure.sellerCompanyId}-${failure.productIds.join(',')}`}
            className="rounded-2xl border border-danger/30 bg-danger/5 px-3 py-3"
          >
            <p className="text-sm font-semibold text-ink">
              {failure.sellerName ?? 'Unknown supplier'}
            </p>
            <p className="text-xs text-danger">{failure.message}</p>
          </div>
        ))}
        <Button fullWidth variant="secondary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Sheet>
  );
}
