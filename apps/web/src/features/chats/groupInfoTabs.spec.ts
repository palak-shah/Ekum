import { describe, expect, it } from 'vitest';
import { parseGroupInfoTab, parseGroupMediaKind } from './groupInfoTabs';

describe('group info tabs', () => {
  it('defaults the segment to businesses', () => {
    expect(parseGroupInfoTab(null)).toBe('businesses');
    expect(parseGroupInfoTab('media')).toBe('media');
    expect(parseGroupInfoTab('members')).toBe('businesses');
  });

  it('only accepts the four Ekum media kinds', () => {
    expect(parseGroupMediaKind('photos')).toBe('photos');
    expect(parseGroupMediaKind('links')).toBeNull();
  });
});
