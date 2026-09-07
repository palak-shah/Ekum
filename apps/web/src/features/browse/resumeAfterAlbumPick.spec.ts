import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearResumeAfterAlbumPick,
  continueAfterAlbumPickLabel,
  nextStepAfterAlbumPick,
  readResumeAfterAlbumPick,
  writeResumeAfterAlbumPick,
} from './resumeAfterAlbumPick';

describe('resumeAfterAlbumPick', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('round-trips curate and order intent', () => {
    expect(readResumeAfterAlbumPick()).toBeNull();
    writeResumeAfterAlbumPick('curate');
    expect(readResumeAfterAlbumPick()).toBe('curate');
    writeResumeAfterAlbumPick('order');
    expect(readResumeAfterAlbumPick()).toBe('order');
    clearResumeAfterAlbumPick();
    expect(readResumeAfterAlbumPick()).toBeNull();
  });

  it('chains to the next remaining album before finishing', () => {
    expect(
      nextStepAfterAlbumPick({ resume: 'curate', remainingAlbumIds: ['c2', 'c3'] }),
    ).toEqual({ kind: 'next-album', collectionId: 'c2' });
    expect(nextStepAfterAlbumPick({ resume: 'curate', remainingAlbumIds: [] })).toEqual({
      kind: 'finish',
      resume: 'curate',
    });
    expect(nextStepAfterAlbumPick({ resume: null, remainingAlbumIds: ['c2'] })).toBeNull();
  });

  it('labels next vs finish', () => {
    expect(continueAfterAlbumPickLabel('curate', 2)).toBe('Next collection (2)');
    expect(continueAfterAlbumPickLabel('curate', 1)).toBe('Next collection');
    expect(continueAfterAlbumPickLabel('curate', 0)).toBe('Continue Curate');
    expect(continueAfterAlbumPickLabel('order', 0)).toBe('Continue Order');
  });
});
