import { describe, expect, it } from 'vitest';
import { tradeListThumbs } from './tradeListThumbs';
import type { TradeListItem } from './tradeList';

describe('tradeListThumbs', () => {
  it('stacks one image per design and +N past three', () => {
    const item = {
      kind: 'order',
      order: {
        items: [
          { image: 'https://a/1.jpg', images: [] },
          { image: 'https://a/2.jpg', images: [] },
          { image: null, images: ['https://a/3.jpg'] },
          { image: 'https://a/4.jpg', images: [] },
        ],
      },
    } as TradeListItem;
    expect(tradeListThumbs(item)).toEqual({
      urls: ['https://a/1.jpg', 'https://a/2.jpg', 'https://a/3.jpg'],
      overflow: 1,
    });
  });

  it('shows two overlapped urls for two designs', () => {
    const item = {
      kind: 'order',
      order: {
        items: [
          { image: 'https://a/1.jpg', images: [] },
          { image: 'https://a/2.jpg', images: [] },
        ],
      },
    } as TradeListItem;
    expect(tradeListThumbs(item)).toEqual({
      urls: ['https://a/1.jpg', 'https://a/2.jpg'],
      overflow: 0,
    });
  });

  it('returns empty when no photos', () => {
    const item = {
      kind: 'order',
      order: { items: [{ image: null, images: [] }] },
    } as TradeListItem;
    expect(tradeListThumbs(item)).toEqual({ urls: [], overflow: 0 });
  });
});
