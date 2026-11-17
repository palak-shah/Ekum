import { describe, expect, it } from 'vitest';
import { selectionShareCatalogPayload } from './selectionSharePayload';

const album = { collectionId: 'col1', name: 'Festive', image: null };
const design = { productId: 'p1', name: 'Rose', image: null };

describe('selectionShareCatalogPayload', () => {
  it('on pack Selecting with designs: designs only (no collection card)', () => {
    expect(
      selectionShareCatalogPayload({
        pathname: '/collections/col1',
        pageSelecting: true,
        albums: [album],
        products: [design],
      }),
    ).toEqual({ collections: [], products: [design] });
  });

  it('⋯ / Explore collection pick: keeps albums', () => {
    expect(
      selectionShareCatalogPayload({
        pathname: '/explore',
        pageSelecting: false,
        albums: [album],
        products: [],
      }),
    ).toEqual({ collections: [album], products: [] });
  });

  it('Explore mixed selection keeps both', () => {
    expect(
      selectionShareCatalogPayload({
        pathname: '/explore',
        pageSelecting: false,
        albums: [album],
        products: [design],
      }),
    ).toEqual({ collections: [album], products: [design] });
  });
});
