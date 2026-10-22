import { describe, expect, it } from 'vitest';
import { createAlbumChangeLabel } from './createAlbumChangeLabel';

describe('createAlbumChangeLabel', () => {
  it('uses singular for one design', () => {
    expect(createAlbumChangeLabel(1)).toBe('1 design · tap to change');
  });

  it('uses plural for many designs', () => {
    expect(createAlbumChangeLabel(12)).toBe('12 designs · tap to change');
  });
});
