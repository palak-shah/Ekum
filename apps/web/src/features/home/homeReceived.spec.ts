import { describe, expect, it } from 'vitest';
import { homeReceivedRows } from './homeReceived';
import type { CollectionCard } from '@ekum/domain-types';

function pack(overrides: Partial<CollectionCard> = {}): CollectionCard {
  return {
    id: 'col1',
    name: 'Wedding Edit',
    coverImage: null,
    previewImages: [],
    imageCount: 0,
    productCount: 4,
    status: 'published',
    updatedAt: '2026-08-22T08:00:00.000Z',
    allowForward: true,
    orderPathPreference: null,
    company: { id: 'c1', name: 'Jaipur Emporium', city: 'Jaipur', logoUrl: null, verification: 'gst' },
    ...overrides,
  };
}

describe('homeReceivedRows', () => {
  it('builds pack name · publisher · day', () => {
    const rows = homeReceivedRows([pack()], Date.parse('2026-08-22T12:00:00.000Z'));
    expect(rows).toEqual([
      {
        id: 'pack-col1',
        title: 'Wedding Edit',
        subtitle: 'Jaipur Emporium · Today',
        to: '/collections/col1',
        sortAt: '2026-08-22T08:00:00.000Z',
      },
    ]);
  });
});
