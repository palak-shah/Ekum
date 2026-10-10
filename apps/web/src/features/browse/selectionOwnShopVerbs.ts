/** Own-shop traveling selection: Message muted; Order is Order for buyer. */
export function selectionOwnShopVerbs(input: {
  singleShopId: string | null;
  myCompanyId: string | undefined;
}): { ownSelectionShop: boolean; messageDisabled: boolean; orderLabel: 'Order for buyer' | 'Order' } {
  const ownSelectionShop = Boolean(
    input.singleShopId && input.myCompanyId && input.singleShopId === input.myCompanyId,
  );
  return {
    ownSelectionShop,
    messageDisabled: !input.singleShopId || ownSelectionShop,
    orderLabel: ownSelectionShop ? 'Order for buyer' : 'Order',
  };
}
