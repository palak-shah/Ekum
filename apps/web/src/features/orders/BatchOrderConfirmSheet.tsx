import { Link } from 'react-router-dom';
import { OrderIntent, type CreateOrdersBatchResult } from '@ekum/domain-types';
import { Button, Sheet } from '@/ui/kit';

function batchIsInquiry(result: CreateOrdersBatchResult): boolean {
  return (
    result.orders.length > 0 &&
    result.orders.every((order) => order.intent === OrderIntent.Inquiry)
  );
}

function batchConfirmTitle(result: CreateOrdersBatchResult): string {
  const placed = result.orders.length;
  const attempted = placed + result.failures.length;
  const inquiry = batchIsInquiry(result);

  if (placed === 0) {
    return inquiry ? 'Could not send rate requests' : 'Could not place orders';
  }
  if (result.failures.length > 0) {
    return inquiry
      ? `${placed} of ${attempted} rate requests sent`
      : `${placed} of ${attempted} orders placed`;
  }
  if (placed === 1) {
    return inquiry ? 'Rate request sent' : '1 order placed';
  }
  return inquiry ? `${placed} rate requests sent` : `${placed} orders placed`;
}

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
  const inquiry = batchIsInquiry(result);

  return (
    <Sheet open={open} onClose={onClose} title={batchConfirmTitle(result)}>
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
