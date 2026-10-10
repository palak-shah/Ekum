import { describe, expect, it } from 'vitest';
import { ownerAlbumMembershipSurface } from './ownerAlbumMembershipSurface';

describe('ownerAlbumMembershipSurface', () => {
  it('keeps Add / Replace on the album viewer (not the editor)', () => {
    expect(ownerAlbumMembershipSurface()).toBe('album-viewer');
  });
});
