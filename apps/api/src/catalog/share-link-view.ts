import { ProductStatus, PublishAudience } from '@ekum/domain-types';
import { isCollectionLiveForBuyers } from './collection-schedule';

export function shareLinkOpenForCollection(collection: {
  audience: string;
  status: string;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
}): boolean {
  return (
    collection.audience === PublishAudience.Everyone && isCollectionLiveForBuyers(collection)
  );
}

export function shareLinkOpenForProduct(product: {
  audience: string;
  status: string;
  postedToMarketAt?: Date | string | null;
}): boolean {
  const onMarket =
    product.status === ProductStatus.Published || Boolean(product.postedToMarketAt);
  return product.audience === PublishAudience.Everyone && onMarket;
}
