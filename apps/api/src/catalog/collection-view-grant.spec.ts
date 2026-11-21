import { describe, expect, it } from 'vitest';
import {
  COLLECTION_VIEW_GRANT_TTL_MS,
  collectionViewGrantExpiresAt,
  isCollectionViewGrantActive,
} from './collection-view-grant';

describe('collection view grant expiry', () => {
  it('is inactive without expiresAt (fail closed)', () => {
    expect(isCollectionViewGrantActive({ expiresAt: null })).toBe(false);
    expect(isCollectionViewGrantActive(null)).toBe(false);
    expect(isCollectionViewGrantActive({})).toBe(false);
  });

  it('is active before expiry and inert after', () => {
    const now = new Date('2026-11-20T12:00:00.000Z');
    const expiresAt = collectionViewGrantExpiresAt(now);
    expect(expiresAt.getTime() - now.getTime()).toBe(COLLECTION_VIEW_GRANT_TTL_MS);
    expect(isCollectionViewGrantActive({ expiresAt }, now)).toBe(true);
    expect(
      isCollectionViewGrantActive({ expiresAt }, new Date(expiresAt.getTime() + 1)),
    ).toBe(false);
  });
});
