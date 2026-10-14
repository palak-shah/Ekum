import { describe, expect, it } from 'vitest';
import { selectionMessageAttachmentTitle } from './selectionMessageAttachmentTitle';

describe('selectionMessageAttachmentTitle', () => {
  it('uses the collection name when only one album is attached', () => {
    expect(
      selectionMessageAttachmentTitle({
        collections: [{ name: 'Wedding Edit' }],
        products: [],
      }),
    ).toBe('Wedding Edit');
  });

  it('uses the design name when only one design is attached', () => {
    expect(
      selectionMessageAttachmentTitle({
        collections: [],
        products: [{ name: 'Navy Silk' }],
      }),
    ).toBe('Navy Silk');
  });

  it('uses count copy for mixed or multi piles', () => {
    expect(
      selectionMessageAttachmentTitle({
        collections: [{ name: 'A' }, { name: 'B' }],
        products: [],
      }),
    ).toBe('2 collections');
    expect(
      selectionMessageAttachmentTitle({
        collections: [{ name: 'Wedding' }],
        products: [{ name: 'Navy' }],
      }),
    ).toBe('1 design · 1 collection');
  });
});
