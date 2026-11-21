/**
 * P3 shop-wide Pack policy — mirrors API `isShopRepostPackAllowed`.
 * Missing / true = Pack allowed; false = OFF.
 */

export function isShopRepostPackAllowed(tradeDefaults: unknown): boolean {
  if (!tradeDefaults || typeof tradeDefaults !== 'object' || Array.isArray(tradeDefaults)) {
    return true;
  }
  return (tradeDefaults as Record<string, unknown>).shopRepostPackAllowed !== false;
}

export const SHOP_REPOST_PACK_TITLE = 'Followers can repost my collections';

export const SHOP_REPOST_PACK_HINT_ON =
  'People you allow to Repost can put your designs in their collections.';

export const SHOP_REPOST_PACK_OFF_CONFIRM_TITLE = 'Turn off Repost for everyone?';

export const SHOP_REPOST_PACK_OFF_CONFIRM_BODY =
  'Anyone who can Repost today becomes look-only. Existing collections stay, but they can’t get new designs from you until you turn this back on. Turning it on later does not restore Repost by itself — you choose each person again.';

export const SHOP_REPOST_PACK_OFF_CONFIRM_ACTION = 'Turn off Repost';
