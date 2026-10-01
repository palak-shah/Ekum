import { describe, expect, it } from 'vitest';
import type { ExploreProductPreviewView } from '@ekum/domain-types';
import { designSetOpenIds, designSetToShortlist } from './designSetShortlist';

const preview = {
  id: 'p1',
  name: 'Navy',
  images: ['navy.jpg'],
  rate: 210,
  unit: 'pc',
  postedAt: '2026-10-01T00:00:00.000Z',
  allowForward: true,
  company: {
    id: 'c1',
    name: 'Surat Silk House',
    city: 'Surat',
    logoUrl: null,
    verification: 'gst',
  },
  connected: true,
  visible: true,
} as ExploreProductPreviewView;

describe('designSetToShortlist', () => {
  it('keeps the design’s own shop (mixed sets stay mixed)', () => {
    expect(designSetToShortlist(preview)).toMatchObject({
      productId: 'p1',
      name: 'Navy',
      thumbUrl: 'navy.jpg',
      companyId: 'c1',
      companyName: 'Surat Silk House',
      allowForward: true,
      unit: 'pc',
      rate: 210,
    });
  });
});

describe('designSetOpenIds', () => {
  it('skips locked and missing tiles', () => {
    expect(
      designSetOpenIds([
        { id: 'a', status: 'ok' },
        { id: 'b', status: 'locked' },
        { id: 'c', status: 'missing' },
      ]),
    ).toEqual(['a']);
  });
});
