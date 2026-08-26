import { describe, expect, it } from 'vitest';
import { CollectionStatus, ProductStatus, PublishAudience } from '@ekum/domain-types';
import { shareLinkOpenForCollection, shareLinkOpenForProduct } from './share-link-view';

describe('shareLinkOpenForCollection', () => {
  it('is open only when Everyone and live', () => {
    expect(
      shareLinkOpenForCollection({
        audience: PublishAudience.Everyone,
        status: CollectionStatus.Published,
        startsAt: null,
        endsAt: null,
      }),
    ).toBe(true);
    expect(
      shareLinkOpenForCollection({
        audience: PublishAudience.Connections,
        status: CollectionStatus.Published,
        startsAt: null,
        endsAt: null,
      }),
    ).toBe(false);
    expect(
      shareLinkOpenForCollection({
        audience: PublishAudience.Everyone,
        status: CollectionStatus.Draft,
        startsAt: null,
        endsAt: null,
      }),
    ).toBe(false);
  });
});

describe('shareLinkOpenForProduct', () => {
  it('is open only when Everyone and on market', () => {
    expect(
      shareLinkOpenForProduct({
        audience: PublishAudience.Everyone,
        status: ProductStatus.Published,
        postedToMarketAt: new Date(),
      }),
    ).toBe(true);
    expect(
      shareLinkOpenForProduct({
        audience: PublishAudience.Selected,
        status: ProductStatus.Published,
        postedToMarketAt: new Date(),
      }),
    ).toBe(false);
  });
});
