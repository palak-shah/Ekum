import { describe, expect, it } from 'vitest';
import { selectionOwnShopVerbs } from './selectionOwnShopVerbs';

describe('selectionOwnShopVerbs', () => {
  it('foreign single shop: Message on, Order label', () => {
    expect(
      selectionOwnShopVerbs({ singleShopId: 'mill', myCompanyId: 'me' }),
    ).toEqual({
      ownSelectionShop: false,
      messageDisabled: false,
      orderLabel: 'Order',
    });
  });

  it('own shop pile: Message gray, Order for buyer', () => {
    expect(selectionOwnShopVerbs({ singleShopId: 'me', myCompanyId: 'me' })).toEqual({
      ownSelectionShop: true,
      messageDisabled: true,
      orderLabel: 'Order for buyer',
    });
  });

  it('no single shop: Message disabled, Order label', () => {
    expect(
      selectionOwnShopVerbs({ singleShopId: null, myCompanyId: 'me' }),
    ).toEqual({
      ownSelectionShop: false,
      messageDisabled: true,
      orderLabel: 'Order',
    });
  });
});
