import { describe, expect, it } from 'vitest';
import {
  COLLECTION_QUICK_PHOTO_CAP,
  collectionCameraMaxShots,
  coverUrlFromGrid,
  defaultCollectionName,
  itemKey,
  nameFromFilename,
  type CreateGridItem,
} from './collectionCreateHelpers';

describe('defaultCollectionName', () => {
  it('uses day and month', () => {
    expect(defaultCollectionName(new Date('2026-08-12T12:00:00Z'))).toMatch(/collection$/i);
  });
});

describe('nameFromFilename', () => {
  it('cleans underscores', () => {
    expect(nameFromFilename('Red_Banarasi.jpg')).toBe('Red Banarasi');
  });
});

describe('collectionCameraMaxShots', () => {
  it('matches Add designs continuous remaining slots for new collection', () => {
    expect(collectionCameraMaxShots(0)).toBe(COLLECTION_QUICK_PHOTO_CAP);
    expect(collectionCameraMaxShots(3)).toBe(COLLECTION_QUICK_PHOTO_CAP - 3);
    expect(collectionCameraMaxShots(COLLECTION_QUICK_PHOTO_CAP)).toBe(0);
  });
});

describe('coverUrlFromGrid', () => {
  const items: CreateGridItem[] = [
    {
      kind: 'photo',
      localId: 'p1',
      imageUrl: 'https://cdn.example/a.jpg',
      name: 'A',
      previewUrl: 'blob:a',
    },
    {
      kind: 'library',
      productId: 'd1',
      imageUrl: 'https://cdn.example/b.jpg',
      name: 'B',
    },
  ];

  it('defaults to first item', () => {
    expect(coverUrlFromGrid(items, null)).toBe('https://cdn.example/a.jpg');
  });

  it('uses tagged library design', () => {
    expect(coverUrlFromGrid(items, itemKey(items[1]!))).toBe('https://cdn.example/b.jpg');
  });
});
