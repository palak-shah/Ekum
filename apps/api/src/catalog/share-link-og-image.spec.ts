import { describe, expect, it } from 'vitest';
import { layoutTeaserSlots, teaserSlotRects } from './share-link-og-image';

describe('layoutTeaserSlots', () => {
  it('maps counts to collage layouts', () => {
    expect(layoutTeaserSlots(0)).toBe('empty');
    expect(layoutTeaserSlots(1)).toBe('single');
    expect(layoutTeaserSlots(2)).toBe('dual');
    expect(layoutTeaserSlots(3)).toBe('triple');
    expect(layoutTeaserSlots(4)).toBe('quad');
    expect(layoutTeaserSlots(9)).toBe('quad');
  });
});

describe('teaserSlotRects', () => {
  it('fills the 1200×630 canvas for quad', () => {
    const slots = teaserSlotRects('quad');
    expect(slots).toHaveLength(4);
    const area = slots.reduce((n, s) => n + s.width * s.height, 0);
    expect(area).toBeGreaterThan(1200 * 630 * 0.9);
  });
});
