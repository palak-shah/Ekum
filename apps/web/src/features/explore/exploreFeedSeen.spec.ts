import { describe, expect, it } from 'vitest';
import {
  isExplorePostUnseen,
  loadExploreFeedSeenMap,
  markExplorePostSeen,
} from './exploreFeedSeen';

describe('exploreFeedSeen', () => {
  it('hides a post until activity moves forward', () => {
    const companyId = 'co-test-seen';
    localStorage.removeItem(`ekum.exploreFeedSeen.${companyId}`);

    markExplorePostSeen(companyId, 'c:abc', '2026-08-20T10:00:00.000Z');
    const map = loadExploreFeedSeenMap(companyId);

    expect(isExplorePostUnseen(companyId, 'c:abc', '2026-08-20T10:00:00.000Z', map)).toBe(false);
    expect(isExplorePostUnseen(companyId, 'c:abc', '2026-08-21T10:00:00.000Z', map)).toBe(true);
    expect(isExplorePostUnseen(companyId, 'c:other', '2026-08-20T10:00:00.000Z', map)).toBe(true);
  });
});
