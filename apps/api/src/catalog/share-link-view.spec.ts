import { describe, expect, it } from 'vitest';
import { CollectionStatus, ProductStatus, PublishAudience } from '@ekum/domain-types';
import { shareLinkOpenForCollection, shareLinkOpenForProduct } from './share-link-view';

describe('shareLinkOpenForCollection', () => {
  it('stays closed for guests (Everyone no longer open catalog)', () => {
    expect(
      shareLinkOpenForCollection({
        audience: PublishAudience.Everyone,
        status: CollectionStatus.Published,
        startsAt: null,
        endsAt: null,
      }),
    ).toBe(false);
    expect(
      shareLinkOpenForCollection({
        audience: PublishAudience.Followers,
        status: CollectionStatus.Published,
        startsAt: null,
        endsAt: null,
      }),
    ).toBe(false);
  });
});

describe('shareLinkOpenForProduct', () => {
  it('stays closed for guests for all audiences', () => {
    expect(
      shareLinkOpenForProduct({
        audience: PublishAudience.Everyone,
        status: ProductStatus.Published,
        postedToMarketAt: new Date(),
      }),
    ).toBe(false);
    expect(
      shareLinkOpenForProduct({
        audience: PublishAudience.Selected,
        status: ProductStatus.Published,
        postedToMarketAt: new Date(),
      }),
    ).toBe(false);
  });
});
