import { describe, expect, it } from 'vitest';
import { followAccessLabel, followersInboxTabFromSearch } from './followersInbox';

describe('followersInboxTabFromSearch', () => {
  it('honours tab=asked', () => {
    expect(followersInboxTabFromSearch('?tab=asked', 0)).toBe('asked');
  });

  it('defaults to asked when there are asks', () => {
    expect(followersInboxTabFromSearch('', 2)).toBe('asked');
  });

  it('defaults to following you when quiet', () => {
    expect(followersInboxTabFromSearch('', 0)).toBe('following');
  });
});

describe('followAccessLabel', () => {
  it('uses trader copy', () => {
    expect(followAccessLabel('look')).toBe('Look through');
    expect(followAccessLabel('pack')).toBe('Put in a pack');
  });
});
