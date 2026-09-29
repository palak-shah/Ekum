import { describe, expect, it } from 'vitest';
import { youLibraryPublishedDockSlots } from './youLibraryPublishedDock';

describe('youLibraryPublishedDockSlots', () => {
  it('puts Order and Share first; Curate last when trading', () => {
    expect(youLibraryPublishedDockSlots(true)).toEqual([
      'order',
      'share',
      'hide',
      'archive',
      'curate',
    ]);
  });

  it('omits Curate when they cannot curate', () => {
    expect(youLibraryPublishedDockSlots(false)).toEqual(['order', 'share', 'hide', 'archive']);
  });
});
