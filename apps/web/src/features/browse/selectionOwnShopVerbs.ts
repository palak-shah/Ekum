/** Own-shop traveling selection: Message muted; Order label stays Order (buyer intent in How many). */
export function selectionOwnShopVerbs(input: {
  singleShopId: string | null;
  myCompanyId: string | undefined;
}): { ownSelectionShop: boolean; messageDisabled: boolean; orderLabel: 'Order' } {
  const ownSelectionShop = Boolean(
    input.singleShopId && input.myCompanyId && input.singleShopId === input.myCompanyId,
  );
  return {
    ownSelectionShop,
    messageDisabled: !input.singleShopId || ownSelectionShop,
    orderLabel: 'Order',
  };
}
