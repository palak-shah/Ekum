import { describe, expect, it } from 'vitest';
import {
  buildConnectedSet,
  buildFollowingSet,
  shouldShowExploreFollow,
} from './exploreCompanyRelationships';

describe('shouldShowExploreFollow', () => {
  const following = buildFollowingSet([
    { id: 'c-follow', name: 'A', city: 'Surat', logoUrl: null },
  ]);
  const connected = buildConnectedSet([
    {
      id: 'conn-1',
      status: 'active',
      company: { id: 'c-conn', name: 'B', city: 'Mumbai', logoUrl: null },
    },
  ]);

  it('shows Follow for a stranger', () => {
    expect(shouldShowExploreFollow('c-new', 'me', following, connected)).toBe(true);
  });

  it('hides for own company', () => {
    expect(shouldShowExploreFollow('me', 'me', following, connected)).toBe(false);
  });

  it('hides when already following', () => {
    expect(shouldShowExploreFollow('c-follow', 'me', following, connected)).toBe(false);
  });

  it('hides when connected', () => {
    expect(shouldShowExploreFollow('c-conn', 'me', following, connected)).toBe(false);
  });
});
