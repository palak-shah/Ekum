import { describe, expect, it } from 'vitest';
import {
  collectionIdForPackOrder,
  packHandlerName,
  shouldFallbackPackOrderToBatch,
  singleSourceCollectionId,
} from './packOrderSource';

describe('singleSourceCollectionId', () => {
  it('requires every line to share one pack', () => {
    expect(
      singleSourceCollectionId([
        { sourceCollectionId: 'pack-1' },
        { sourceCollectionId: 'pack-1' },
      ]),
    ).toBe('pack-1');
    expect(
      singleSourceCollectionId([
        { sourceCollectionId: 'pack-1' },
        { sourceCollectionId: 'pack-2' },
      ]),
    ).toBeNull();
    expect(singleSourceCollectionId([{ sourceCollectionId: undefined }])).toBeNull();
  });
});

describe('collectionIdForPackOrder', () => {
  it('skips explicitly Direct packs', () => {
    expect(
      collectionIdForPackOrder([
        { sourceCollectionId: 'pack-1', sourcePath: 'direct' },
        { sourceCollectionId: 'pack-1', sourcePath: 'direct' },
      ]),
    ).toBeUndefined();
    expect(
      collectionIdForPackOrder([
        { sourceCollectionId: 'pack-1', sourcePath: 'handle' },
        { sourceCollectionId: 'pack-1', sourcePath: 'handle' },
      ]),
    ).toBe('pack-1');
  });
});

describe('shouldFallbackPackOrderToBatch', () => {
  it('falls back for own albums and Direct packs', () => {
    expect(shouldFallbackPackOrderToBatch('NOT_CURATED')).toBe(true);
    expect(shouldFallbackPackOrderToBatch('DIRECT_PACK')).toBe(true);
    expect(shouldFallbackPackOrderToBatch('TRADING_REQUIRED')).toBe(false);
  });
});

describe('packHandlerName', () => {
  it('uses the pack owner name', () => {
    expect(
      packHandlerName([
        { sourceHandlerName: 'Ravi Textiles' },
        { sourceHandlerName: 'Ravi Textiles' },
      ]),
    ).toBe('Ravi Textiles');
  });
});
