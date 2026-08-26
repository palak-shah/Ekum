/** Mill cannot see a linked hop until Send sets `upstreamReleasedAt`. */
export function isHeldFromSupplier(
  order: {
    sellerCompanyId: string;
    downstreamOrderId: string | null;
    upstreamReleasedAt: Date | string | null;
  },
  actorCompanyId: string,
): boolean {
  return (
    order.sellerCompanyId === actorCompanyId &&
    Boolean(order.downstreamOrderId) &&
    order.upstreamReleasedAt == null
  );
}
