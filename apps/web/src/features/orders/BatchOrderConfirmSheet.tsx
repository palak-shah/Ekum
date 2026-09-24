import { OrderIntent, type CreateOrdersBatchResult } from '@ekum/domain-types';

function batchIsInquiry(result: CreateOrdersBatchResult): boolean {
  return (
    result.orders.length > 0 &&
    result.orders.every((order) => order.intent === OrderIntent.Inquiry)
  );
}

/** Toast copy after Place / Ask rates from Selection (auto-dismiss — no Done sheet). */
export function batchConfirmTitle(
  result: CreateOrdersBatchResult,
  opts?: { linkedMillCount?: number },
): string {
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
    if (!inquiry && opts?.linkedMillCount && opts.linkedMillCount > 1) {
      return `One order · ${opts.linkedMillCount} mills`;
    }
    return inquiry ? 'Rate request sent' : '1 order placed';
  }
  return inquiry
    ? `${placed} rate requests sent`
    : `${placed} separate chats · one per shop`;
}
